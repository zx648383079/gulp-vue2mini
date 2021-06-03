import { StyleToken, StyleTokenizer } from '../tokenizer';
import { Compiler } from './base';
import { StyleCompiler } from './style';
export declare class SassCompiler implements Compiler<StyleToken[] | string, string> {
    private tokenizer;
    private compiler;
    constructor(tokenizer?: StyleTokenizer, compiler?: StyleCompiler);
    render(data: StyleToken[] | string): string;
    splitRuleName(name: string): string[];
    splitBlock(items: StyleToken[]): StyleToken[];
}
