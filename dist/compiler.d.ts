import * as sass from 'sass';
export interface ICompliper {
    compileFile(src: string): void;
    outputFile(src: string): string;
    unlink(src: string): void;
    logFile(src: string, tip?: string): void;
}
export declare class Compiler {
    static ts(input: string, file: string, tsConfigFileName?: string, sourceMap?: boolean): string;
    static sass(input: string, file: string, lang?: string, options?: sass.Options): string;
}
export declare const consoleLog: (file: string, tip?: string, rootFolder?: string | undefined) => void;
