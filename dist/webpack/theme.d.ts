import { Compiler } from 'webpack';
import { IThemeObject } from '../parser/template/tokenizer';
export declare class ThemePlugin {
    private option;
    private autoDark;
    private useVar;
    private varPrefix;
    constructor(option: IThemeObject, autoDark?: boolean, useVar?: boolean, varPrefix?: string);
    private readonly compiler;
    apply(compiler: Compiler): void;
}
