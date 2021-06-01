/// <reference types="less" />
import * as sass from 'sass';
export declare class CompliperFile {
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
    static from(file: CompliperFile, dist?: string, type?: string | undefined, content?: string | undefined): CompliperFile;
}
export interface ICompliper {
    readyFile(src: CompliperFile): undefined | CompliperFile | CompliperFile[];
    compileFile(src: CompliperFile): void;
    outputFile(src: string | CompliperFile): string;
    unlink(src: string | CompliperFile): void;
    logFile(src: string | CompliperFile, tip?: string): void;
}
export declare class BaseCompliper {
    readonly inputFolder: string;
    readonly outputFolder: string;
    options?: any;
    constructor(inputFolder: string, outputFolder: string, options?: any);
    mkIfNotFolder(folder: string): void;
    outputFile(file: string | CompliperFile): string;
    unlink(src: string | CompliperFile): void;
    logFile(file: string | CompliperFile, tip?: string): void;
}
export declare class Compiler {
    static ts(input: string, file: string, tsConfigFileName?: string, sourceMap?: boolean): string;
    static sass(input: string, file: string, lang?: string, options?: sass.Options): string;
    static less(input: string, file: string, options?: Less.Options): Promise<string>;
}
export declare const consoleLog: (file: string, tip?: string, rootFolder?: string | undefined) => void;
export declare const eachCompileFile: (files: undefined | CompliperFile | CompliperFile[], callback: (file: CompliperFile) => void) => void;
export declare const fileContent: (file: CompliperFile) => string;
