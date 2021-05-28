import { ICompliper, ICompliperFile } from '../../compiler';
export declare class TemplateProject implements ICompliper {
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
    renderFile(file: ICompliperFile): string;
    private mergeStyle;
    private getSassImport;
    readyFile(src: string): undefined | ICompliperFile | ICompliperFile[];
    compileFile(src: string): void;
    private formatThemeStyle;
    compileAFile(src: string, mtime?: number): void;
    mkIfNotFolder(folder: string): void;
    outputFile(file: string): string;
    unlink(src: string): void;
    logFile(file: string, tip?: string): void;
}
