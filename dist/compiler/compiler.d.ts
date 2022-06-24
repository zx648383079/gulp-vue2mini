/// <reference types="less" />
import * as sass from 'sass';
import { Logger, LogLevel } from './log';
export interface SassOptions extends sass.StringOptionsWithoutImporter<'sync'> {
    includePaths?: string[] | string;
}
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
    logger: Logger;
    readyFile(src: CompilerFile): undefined | CompilerFile | CompilerFile[];
    booted(): void;
    compileFile(src: CompilerFile): void;
    outputFile(src: string | CompilerFile): string;
    unlink(src: string | CompilerFile): void;
    logFile(src: string | CompilerFile, tip?: string, level?: LogLevel): void;
}
export declare class BaseProjectCompiler {
    readonly inputFolder: string;
    readonly outputFolder: string;
    options?: any;
    constructor(inputFolder: string, outputFolder: string, options?: any);
    isBooted: boolean;
    logger: Logger;
    booted(): void;
    mkIfNotFolder(folder: string): void;
    outputFile(file: string | CompilerFile): string;
    unlink(src: string | CompilerFile): void;
    logFile(file: string | CompilerFile, tip?: string, level?: LogLevel): void;
}
export declare class PluginCompiler {
    static ts(input: string, file: string, tsConfigFileName?: string, sourceMap?: boolean): string;
    static sass(input: string, file: string, lang?: string, options?: SassOptions): string;
    static less(input: string, file: string, options?: Less.Options): Promise<string>;
    private static sassImporter;
    private static lessImporter;
}
export declare const eachCompileFile: (files: undefined | CompilerFile | CompilerFile[], callback: (file: CompilerFile) => void) => void;
export declare const fileContent: (file: CompilerFile) => string;
