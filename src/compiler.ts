import * as path from 'path';
import * as ts from 'typescript';
import * as sass from 'sass';
import * as fs from 'fs';

export interface ICompliperFile {
    src: string;
    content?: string;
    dist: string;
    type?: string;
}

export interface ICompliper {
    readyFile(src: string): undefined | ICompliperFile | ICompliperFile[];
    compileFile(src: string): void;
    outputFile(src: string): string;
    unlink(src: string): void;
    logFile(src: string, tip?: string): void;
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

export const eachCompileFile = (files: undefined | ICompliperFile | ICompliperFile[], callback: (file: ICompliperFile) => void) => {
    if (!files) {
        return;
    }
    if (files instanceof Array) {
        files.forEach(callback);
        return;
    }
    callback(files);
};

export const fileContent = (file: ICompliperFile): string => {
    if (typeof file.content !== 'undefined') {
        return file.content;
    }
    file.content = fs.readFileSync(file.src).toString();
    return file.content;
};
