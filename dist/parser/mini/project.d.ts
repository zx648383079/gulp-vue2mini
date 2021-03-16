import { ICompliper, ICompliperFile } from '../../compiler';
export declare class MiniProject implements ICompliper {
    inputFolder: string;
    outputFolder: string;
    options?: any;
    constructor(inputFolder: string, outputFolder: string, options?: any);
    readyFile(src: string): undefined | ICompliperFile | ICompliperFile[];
    private readyVueFile;
    compileFile(src: string): void;
    mkIfNotFolder(folder: string): void;
    outputFile(file: string): string;
    unlink(src: string): void;
    logFile(file: string, tip?: string): void;
}
