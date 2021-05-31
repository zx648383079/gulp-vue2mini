import { ICompliper, ICompliperFile } from '../../compiler';
import { TemplateTokenizer } from './tokenizer';
import { LinkManager } from '../link';
import { StyleParser } from './style';
import { TemplateParser } from './template';
import { ScriptParser } from './script';
export declare class TemplateProject implements ICompliper {
    inputFolder: string;
    outputFolder: string;
    options?: any;
    constructor(inputFolder: string, outputFolder: string, options?: any);
    readonly link: LinkManager;
    readonly script: ScriptParser;
    readonly template: TemplateParser;
    readonly style: StyleParser;
    readonly tokenizer: TemplateTokenizer;
    get compliperMin(): boolean;
    renderFile(file: ICompliperFile): string;
    readyFile(src: string): undefined | ICompliperFile | ICompliperFile[];
    compileFile(src: string): void;
    compileAFile(src: string, mtime?: number): void;
    mkIfNotFolder(folder: string): void;
    outputFile(file: string): string;
    unlink(src: string): void;
    logFile(file: string, tip?: string): void;
}
