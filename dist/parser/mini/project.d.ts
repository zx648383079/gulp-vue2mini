import { StyleParser } from './css';
import { VueParser } from './vue';
import { ICompliper, ICompliperFile } from '../../compiler';
import { ScriptParser } from './ts';
import { LinkManager } from '../link';
import { TemplateParser } from './wxml';
import { JsonParser } from './json';
export declare class MiniProject implements ICompliper {
    inputFolder: string;
    outputFolder: string;
    options?: any;
    constructor(inputFolder: string, outputFolder: string, options?: any);
    readonly link: LinkManager;
    readonly script: ScriptParser;
    readonly template: TemplateParser;
    readonly style: StyleParser;
    readonly json: JsonParser;
    readonly mix: VueParser;
    readyFile(src: string): undefined | ICompliperFile | ICompliperFile[];
    readyMixFile(src: string, dist: string): ICompliperFile[];
    readyMixFile(src: string, ext: string, dist: string): ICompliperFile[];
    readyMixFile(src: string, content: string, ext: string, dist: string): ICompliperFile[];
    compileFile(src: string): void;
    mkIfNotFolder(folder: string): void;
    outputFile(file: string): string;
    unlink(src: string): void;
    logFile(file: string, tip?: string): void;
}
