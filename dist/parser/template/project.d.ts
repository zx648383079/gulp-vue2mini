import { BaseProjectCompiler, CompilerFile, IProjectCompiler } from '../../compiler';
import { ThemeTokenizer } from './tokenizer';
import { StyleParser } from './style';
import { TemplateParser } from './template';
import { ScriptParser } from './script';
import { CacheManger, LinkManager } from '../../util';
export declare class TemplateProject extends BaseProjectCompiler implements IProjectCompiler {
    constructor(inputFolder: string, outputFolder: string, options?: any);
    readonly link: LinkManager;
    readonly script: ScriptParser;
    readonly template: TemplateParser;
    readonly style: StyleParser;
    readonly tokenizer: ThemeTokenizer;
    readonly cache: CacheManger<string>;
    get compilerMin(): boolean;
    renderFile(file: CompilerFile): string;
    readyFile(src: CompilerFile): undefined | CompilerFile | CompilerFile[];
    compileFile(src: CompilerFile): void;
    compileAFile(src: CompilerFile): void;
    fileContent(file: CompilerFile): string;
    unlink(src: string | CompilerFile): void;
    ready(): void;
}
