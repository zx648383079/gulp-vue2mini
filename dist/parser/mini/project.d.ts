import { ICompliper } from '../../compiler';
export declare class MiniProject implements ICompliper {
    inputFolder: string;
    outputFolder: string;
    options?: any;
    constructor(inputFolder: string, outputFolder: string, options?: any);
    compileFile(src: string): void;
    mkIfNotFolder(folder: string): void;
    outputFile(file: string): string;
    unlink(src: string): void;
    logFile(file: string, tip?: string): void;
}
