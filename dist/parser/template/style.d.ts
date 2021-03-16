import { ICompliper } from '../../compiler';
export declare class StyleProject implements ICompliper {
    inputFolder: string;
    outputFolder: string;
    options?: any;
    constructor(inputFolder: string, outputFolder: string, options?: any);
    compileFile(src: string): void;
    outputFile(file: string): string;
    unlink(src: string): void;
    logFile(file: string, tip?: string): void;
}
