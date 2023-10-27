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
    renderTheme(themeOption?: IThemeObject, keys?: string[]): string;
    renderString(content: string, themeOption?: IThemeObject): string;
    renderAny(items: StyleToken[]): [string, IThemeObject, string[]];
    renderAny(items: StyleToken[], themeOption: IThemeObject): [string, IThemeObject, string[]];
    renderAny(content: string): [string, IThemeObject, string[]];
    renderAny(content: string, themeOption: IThemeObject): [string, IThemeObject, string[]];
    private themeCss;
    private formatThemeHeader;
    private themeStyle;
    private splitThemeStyle;
    private cloneStyle;
    private themeStyleValue;
    private formatVarKey;
    private isThemeStyle;
    separateThemeStyle(items: StyleToken[]): any[];
    private isThemeDef;
}
