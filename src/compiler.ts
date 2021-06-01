import * as path from 'path';
import * as ts from 'typescript';
import * as sass from 'sass';
import * as fs from 'fs';

export class CompliperFile {
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

    public static from(file: CompliperFile, dist = file.dist, type = file.type, content = file.content) {
        return new CompliperFile(file.src, file.mtime, dist, type, content);
    }
}

export interface ICompliper {
    readyFile(src: CompliperFile): undefined | CompliperFile | CompliperFile[];
    compileFile(src: CompliperFile): void;
    outputFile(src: string|CompliperFile): string;
    unlink(src: string|CompliperFile): void;
    logFile(src: string|CompliperFile, tip?: string): void;
}

export class BaseCompliper {
    constructor(
        public readonly inputFolder: string,
        public readonly outputFolder: string,
        public options?: any
    ) {

    }

    /**
     * mkIfNotFolder
     */
    public mkIfNotFolder(folder: string) {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, {recursive: true});
        }
    }

    public outputFile(file: string|CompliperFile) {
        return path.resolve(this.outputFolder, path.relative(this.inputFolder, file instanceof CompliperFile ? file.src : file));
    }

    public unlink(src: string|CompliperFile) {
        const dist = this.outputFile(src);
        if (fs.existsSync(dist)) {
            fs.unlinkSync(dist);
        }
    }

    public logFile(file: string|CompliperFile, tip = 'Finished') {
        consoleLog(file instanceof CompliperFile ? file.src : file, tip, this.inputFolder);
    }
}

export class Compiler {
    public static ts(input: string, file: string, tsConfigFileName: string = 'tsconfig.json', sourceMap = false) {
        let projectDirectory = process.cwd();
        let compilerOptions: ts.CompilerOptions;
        tsConfigFileName = path.resolve(process.cwd(), tsConfigFileName);
        projectDirectory = path.dirname(tsConfigFileName);

        const tsConfig = ts.readConfigFile(tsConfigFileName, ts.sys.readFile);

        const parsed: ts.ParsedCommandLine = ts.parseJsonConfigFileContent(
            tsConfig.config || {},
            {
                useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
                readDirectory: () => [],
                fileExists: ts.sys.fileExists,
                readFile: ts.sys.readFile
            },
            path.resolve(projectDirectory),
            undefined,
            tsConfigFileName);
        compilerOptions = parsed.options;

        const output: ts.TranspileOutput = ts.transpileModule(input,
            {
                compilerOptions,
                fileName: file,
                reportDiagnostics: true,
                transformers: undefined,
        });
        if (sourceMap) {
            return output.outputText;
        }
        return output.outputText.replace(/\/\/#\ssourceMappingURL[\s\S]+$/, '');
    }

    public static sass(input: string, file: string, lang = 'scss', options: sass.Options = {}): string {
        const output = sass.renderSync(Object.assign({}, options, {
            data: input,
            file,
            // includePaths: [],
            indentedSyntax: lang === 'sass'
        }));
        return output.css.toString();
    }

    public static async less(input: string, file: string, options: Less.Options = {}): Promise<string> {
        options.filename = file;
        const less: LessStatic = require('less');
        const output = await less.render(input, options);
        return output.css;
    }
}

export const consoleLog = (file: string, tip = 'Finished', rootFolder?: string) => {
    const now = new Date();
    console.log('[' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + ']',
    rootFolder ? path.relative(rootFolder, file) : file, tip);
};

export const eachCompileFile = (files: undefined | CompliperFile | CompliperFile[], callback: (file: CompliperFile) => void) => {
    if (!files) {
        return;
    }
    if (files instanceof Array) {
        files.forEach(callback);
        return;
    }
    callback(files);
};

export const fileContent = (file: CompliperFile): string => {
    if (typeof file.content !== 'undefined') {
        return file.content;
    }
    file.content = fs.readFileSync(file.src).toString();
    return file.content;
};
