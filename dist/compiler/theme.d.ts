import { IThemeObject } from '../parser/template/tokenizer';
import { StyleToken, StyleTokenizer } from '../tokenizer';
import { Compiler } from './base';
import { StyleCompiler } from './style';
export declare class ThemeStyleCompiler implements Compiler<StyleToken[], string> {
    private autoDark;
    private useVar;
    private varPrefix;
    private tokenizer;
    private compiler;
    constructor(autoDark?: boolean, useVar?: boolean, varPrefix?: string, tokenizer?: StyleTokenizer, compiler?: StyleCompiler);
    render(data: StyleToken[]): string;
    themeCss(items: StyleToken[], themeOption?: IThemeObject): StyleToken[];
    private formatThemeHeader;
    private themeStyle;
    private splitThemeStyle;
    private cloneStyle;
    private themeStyleValue;
    private formatVarKey;
    private isThemeStyle;
    formatThemeCss(items: StyleToken[]): string;
    formatThemeCss(items: StyleToken[], themeOption: IThemeObject): string;
    formatThemeCss(content: string): string;
    formatThemeCss(content: string, themeOption: IThemeObject): string;
    separateThemeStyle(items: StyleToken[]): any[];
    private isThemeDef;
}
