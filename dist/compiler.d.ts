export interface ICompliper {
    compileFile(src: string): void;
}
export declare class Compiler {
    static ts(input: string, file: string, tsConfigFileName?: string): string;
    static sass(input: string, file: string, lang?: string): string;
}
export declare class MiniCompliper implements ICompliper {
    inputFolder: string;
    outputFolder: string;
    options?: any;
    constructor(inputFolder: string, outputFolder: string, options?: any);
    compileFile(src: string): void;
    mkIfNotFolder(folder: string): void;
    outputFile(file: string): string;
    logFile(file: string, tip?: string): void;
}
