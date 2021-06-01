import { BaseCompliper, CompliperFile, ICompliper } from '../../compiler';
import { TemplateTokenizer } from './tokenizer';
import { LinkManager } from '../link';
import { StyleParser } from './style';
import { TemplateParser } from './template';
import { ScriptParser } from './script';
import { CacheManger } from '../cache';
export declare class TemplateProject extends BaseCompliper implements ICompliper {
    constructor(inputFolder: string, outputFolder: string, options?: any);
    readonly link: LinkManager;
    readonly script: ScriptParser;
    readonly template: TemplateParser;
    readonly style: StyleParser;
    readonly tokenizer: TemplateTokenizer;
    readonly cache: CacheManger<string>;
    get compliperMin(): boolean;
    renderFile(file: CompliperFile): string;
    readyFile(src: CompliperFile): undefined | CompliperFile | CompliperFile[];
    compileFile(src: CompliperFile): void;
    compileAFile(src: CompliperFile): void;
    fileContent(file: CompliperFile): string;
    unlink(src: string | CompliperFile): void;
    ready(): void;
}
