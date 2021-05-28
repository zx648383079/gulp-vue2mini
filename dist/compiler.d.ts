/// <reference types="less" />
import * as sass from 'sass';
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
export declare class Compiler {
    static ts(input: string, file: string, tsConfigFileName?: string, sourceMap?: boolean): string;
    static sass(input: string, file: string, lang?: string, options?: sass.Options): string;
    static less(input: string, file: string, options?: Less.Options): Promise<string>;
}
export declare const consoleLog: (file: string, tip?: string, rootFolder?: string | undefined) => void;
export declare const eachCompileFile: (files: undefined | ICompliperFile | ICompliperFile[], callback: (file: ICompliperFile) => void) => void;
export declare const fileContent: (file: ICompliperFile) => string;
