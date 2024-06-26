import * as path from 'path';
import * as ts from 'typescript';
import * as sass from 'sass';
import * as fs from 'fs';
import { pathToFileURL } from 'url';
import { Colors, Logger, LogLevel, LogStr } from './log';
import { eachObject, twoPad } from '../util';

export interface SassOptions extends sass.StringOptions<'sync'> {
    includePaths?: string[]|string;
}

export class CompilerFile {
    constructor(
        public src: string,
        public mtime: number = 0,
        public dist: string = '',
        public type?: string,
        public content?: string,
    ) {

    }

    public get extname() {
        return path.extname(this.src);
    }

    public get dirname() {
        return path.dirname(this.src);
    }

    public get basename() {
        return path.basename(this.src);
    }

    public get distMtime() {
        if (!this.dist || !fs.existsSync(this.dist)) {
            return 0;
        }
        return fs.statSync(this.dist).mtimeMs;
    }

    public static from(file: CompilerFile, dist = file.dist, type = file.type, content = file.content) {
        return new CompilerFile(file.src, file.mtime, dist, type, content);
    }
}

export interface IProjectCompiler {
    logger: Logger;
    readyFile(src: CompilerFile): undefined | CompilerFile | CompilerFile[];
    booted(): void;
    compileFile(src: CompilerFile): void;
    outputFile(src: string|CompilerFile): string;
    unlink(src: string|CompilerFile): void;
    logFile(src: string|CompilerFile, tip?: string, level?: LogLevel): void;
}

export class BaseProjectCompiler {
    constructor(
        public readonly inputFolder: string,
        public readonly outputFolder: string,
        public options?: any
    ) {

    }

    public isBooted = false;
    public logger = new Logger();

    public booted() {
        this.isBooted = true;
    }

    /**
     * mkIfNotFolder
     */
    public mkIfNotFolder(folder: string) {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, {recursive: true});
        }
    }

    public outputFile(file: string|CompilerFile) {
        return path.resolve(this.outputFolder, path.relative(this.inputFolder, file instanceof CompilerFile ? file.src : file));
    }

    public unlink(src: string|CompilerFile) {
        const dist = this.outputFile(src);
        if (fs.existsSync(dist)) {
            fs.unlinkSync(dist);
        }
    }

    public logFile(file: string|CompilerFile, tip = 'Finished', level: LogLevel = LogLevel.info) {
        const realFile = file instanceof CompilerFile ? file.src : file;
        this.log(this.inputFolder ? path.relative(this.inputFolder, realFile) : realFile, tip, level)
    }

    public log(key: string, tip = 'Finished', level: LogLevel = LogLevel.info) {
        const now = new Date();
        this.logger.log(level, LogStr.build(undefined, '[', twoPad(now.getHours()), ':', twoPad(now.getMinutes()), ':', twoPad(now.getSeconds()), '] ')
        .join(Colors.magenta, key)
        .join(' ')
        .join(this.logger.levelToColor(level), tip));
    }
}

export class PluginCompiler {
    public static ts(input: string, file: string, tsConfigFileName: string = 'tsconfig.json', sourceMap = false) {
        let projectDirectory = process.cwd();
        tsConfigFileName = path.resolve(process.cwd(), tsConfigFileName);
        projectDirectory = path.dirname(tsConfigFileName);
        const tsConfig = ts.readConfigFile(tsConfigFileName, ts.sys.readFile);
        const option = tsConfig.config || {};
        if (typeof sourceMap === 'boolean') {
            option.sourceMap = sourceMap;
            option.inlineSourceMap = true;
        }
        const parsed: ts.ParsedCommandLine = ts.parseJsonConfigFileContent(
            option,
            {
                useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
                readDirectory: () => [],
                fileExists: ts.sys.fileExists,
                readFile: ts.sys.readFile
            },
            path.resolve(projectDirectory),
            undefined,
            tsConfigFileName);
        const output: ts.TranspileOutput = ts.transpileModule(input,
            {
                compilerOptions: parsed.options,
                fileName: file,
                reportDiagnostics: true,
                transformers: undefined,
        });
        if (sourceMap) {
            return output.outputText;
        }
        return output.outputText.replace(/\/\/#\ssourceMappingURL[\s\S]+$/, '');
    }

    public static sass(input: string, file: string, lang = 'scss', options: SassOptions = {}): string {
        const output: sass.CompileResult = this.sassImporter().compileString(input, this.createSassOptions(file, lang, options));
        return output.css.toString();
    }

    public static createSassOptions(file: string, lang = 'scss', options: SassOptions = {}): SassOptions {
        const fileExsist = (url: URL) => {
            return fs.existsSync(url) ? url: undefined;
        };
        const loadImport = (fileName: string, base: URL) => {
            const extension = `.${lang}`;
            if (fileName.endsWith(extension)) {
                return fileExsist(new URL(fileName, base));
            }
            const i = fileName.lastIndexOf('/');
            if (fileName[i + 1] === '_') {
                return fileExsist(new URL(fileName + extension, base));
            }
            if (i < 0) {
                return fileExsist(new URL(`_${fileName}${extension}`, base));
            }
            return fileExsist(new URL(fileName.substring(0, i + 1) + '_' + fileName.substring(i + 2) + extension, base));
        };
        if (!options.importers) {
            const includePaths = [pathToFileURL(file)];
            if (Object.prototype.hasOwnProperty.call(options, 'includePaths')) {
                eachObject(options.includePaths, v => {
                    if (v && typeof v === 'string') {
                        includePaths.push(pathToFileURL(v));
                    }
                });
            }
            options.importers = [{
                findFileUrl(url: string) {
                    // Load paths only support relative URLs.
                    if (/^[a-z]+:/i.test(url)) {
                        return null
                    }
                    for (const folder of includePaths) {
                        const uri = loadImport(url, folder);
                        if (uri) {
                            return uri;
                        }
                    }
                    return new URL(url, includePaths[0]);
                }
            }];
        }
        return Object.assign({}, options, {
            // loadPaths: [],
            url: new URL(file),
            syntax: lang === 'sass' ? 'indented' : 'scss'
        });
    }

    public static async less(input: string, file: string, options: Less.Options = {}): Promise<string> {
        options.filename = file;
        const output = await this.lessImporter().render(input, options);
        return output.css;
    }

    public static sassImporter() {
        return require('sass');
    }

    public static lessImporter(): LessStatic {
        return require('less');
    }
}

export const eachCompileFile = (files: undefined | CompilerFile | CompilerFile[], callback: (file: CompilerFile) => void) => {
    if (!files) {
        return;
    }
    if (files instanceof Array) {
        files.forEach(callback);
        return;
    }
    callback(files);
};

export const fileContent = (file: CompilerFile): string => {
    if (typeof file.content !== 'undefined') {
        return file.content;
    }
    file.content = fs.readFileSync(file.src).toString();
    return file.content;
};
