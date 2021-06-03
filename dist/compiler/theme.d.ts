import { StyleToken, StyleTokenizer } from '../tokenizer';
import { Compiler } from './base';
import { StyleCompiler } from './style';
export interface IThemeStyleOption {
    [key: string]: {
        [name: string]: string;
    };
}
export declare class ThemeStyleCompiler implements Compiler<StyleToken[], string> {
    private autoDark;
    private tokenizer;
    private compiler;
    constructor(autoDark?: boolean, tokenizer?: StyleTokenizer, compiler?: StyleCompiler);
    render(data: StyleToken[]): string;
    themeCss(items: StyleToken[], themeOption?: IThemeStyleOption): StyleToken[];
    private themeStyle;
    private splitThemeStyle;
    private cloneStyle;
    private themeStyleValue;
    private isThemeStyle;
    formatThemeCss(items: StyleToken[]): string;
    formatThemeCss(items: StyleToken[], themeOption: IThemeStyleOption): string;
    formatThemeCss(content: string): string;
    separateThemeStyle(items: StyleToken[]): any[];
    private isThemeDef;
}
