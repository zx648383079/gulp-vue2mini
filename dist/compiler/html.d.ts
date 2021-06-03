import { ElementToken } from '../tokenizer';
import { Compiler } from './base';
export declare function htmlBeautify(indent?: string): (item: ElementToken, content: string, level: number) => string;
export declare class TemplateCompiler implements Compiler<ElementToken, string> {
    indent: string;
    constructor(indent?: string);
    render(data: ElementToken): string;
    map(data: ElementToken, cb: (item: ElementToken) => any): void;
    toString(data: ElementToken, cb: (item: ElementToken, content: string, level: number) => string, level?: number): string;
    toMap(data: ElementToken, cb: (item: ElementToken, children?: any[]) => any): any[] | any;
}
