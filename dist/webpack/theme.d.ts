import { Compiler } from 'webpack';
import { IThemeObject } from '../parser/template/tokenizer';
export declare class ThemePlugin {
    private option;
    constructor(option: IThemeObject);
    private readonly compiler;
    apply(compiler: Compiler): void;
}
