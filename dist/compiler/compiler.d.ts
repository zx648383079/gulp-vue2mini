/// <reference types="less" />
import * as sass from 'sass';
export declare class CompilerFile {
    src: string;
    mtime: number;
    dist: string;
    type?: string | undefined;
    content?: string | undefined;
    constructor(src: string, mtime?: number, dist?: string, type?: string | undefined, content?: string | undefined);
    get extname(): string;
    get dirname(): string;
    get basename(): string;
    get distMtime(): number;
    static from(file: CompilerFile, dist?: string, type?: string | undefined, content?: string | undefined): CompilerFile;
}
export interface IProjectCompiler {
    readyFile(src: CompilerFile): undefined | CompilerFile | CompilerFile[];
    booted(): void;
    compileFile(src: CompilerFile): void;
    outputFile(src: string | CompilerFile): string;
    unlink(src: string | CompilerFile): void;
    logFile(src: string | CompilerFile, tip?: string): void;
}
export declare class BaseProjectCompiler {
    readonly inputFolder: string;
    readonly outputFolder: string;
    options?: any;
    constructor(inputFolder: string, outputFolder: string, options?: any);
    isBooted: boolean;
    booted(): void;
    mkIfNotFolder(folder: string): void;
    outputFile(file: string | CompilerFile): string;
    unlink(src: string | CompilerFile): void;
    logFile(file: string | CompilerFile, tip?: string): void;
}
export declare class PluginCompiler {
    static ts(input: string, file: string, tsConfigFileName?: string, sourceMap?: boolean): string;
    static sass(input: string, file: string, lang?: string, options?: sass.Options): string;
    static less(input: string, file: string, options?: Less.Options): Promise<string>;
    private static sassImporter;
    private static lessImporter;
}
export declare const consoleLog: (file: string, tip?: string, rootFolder?: string | undefined) => void;
export declare const eachCompileFile: (files: undefined | CompilerFile | CompilerFile[], callback: (file: CompilerFile) => void) => void;
export declare const fileContent: (file: CompilerFile) => string;
