import { StyleToken } from '../tokenizer';
import { Compiler } from './base';
export declare class StyleCompiler implements Compiler<StyleToken[], string> {
    private indent;
    private isIndent;
    constructor(indent?: string, isIndent?: boolean);
    render(data: StyleToken[]): string;
    map(data: StyleToken[] | StyleToken, cb: (item: StyleToken) => any): void;
    toString(data: StyleToken[] | StyleToken, cb: (item: StyleToken, content: string, level: number) => string, level?: number): string;
    toMap(data: StyleToken[] | StyleToken, cb: (item: StyleToken, children?: any[]) => any): any[] | any;
}
