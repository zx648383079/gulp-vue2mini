import { ICompliper } from "../compiler";
export declare class UiCompliper implements ICompliper {
    inputFolder: string;
    outputFolder: string;
    options?: any;
    constructor(inputFolder: string, outputFolder: string, options?: any);
    private linkFiles;
    private cachesFiles;
    private triggerLinkFile;
    private addLinkFile;
    private converterToken;
    private parseToken;
    renderFile(file: string, content?: string): string;
    private mergeStyle;
    private getSassImport;
    compileFile(src: string): void;
    compileAFile(src: string, mtime?: number): void;
    mkIfNotFolder(folder: string): void;
    outputFile(file: string): string;
    logFile(file: string, tip?: string): void;
}
