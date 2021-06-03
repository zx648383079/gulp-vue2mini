import { TemplateProject } from './project';
import { CompilerFile } from '../../compiler';
import { Compiler } from '../../compiler';
export declare type TYPE_MAP = 'text' | 'comment' | 'extend' | 'script' | 'style' | 'layout' | 'content' | 'random' | 'theme';
export declare const REGEX_ASSET: RegExp;
export interface IToken {
    type: TYPE_MAP;
    content: string;
    comment?: string;
    amount?: number;
}
export interface IPage {
    isLayout: boolean;
    canRender: boolean;
    file: string;
    tokens: IToken[];
}
export interface IThemeOption {
    [key: string]: string;
}
export interface IThemeObject {
    [key: string]: IThemeOption;
}
export declare class ThemeTokenizer implements Compiler<CompilerFile, IPage> {
    private project;
    constructor(project: TemplateProject);
    private cachesFiles;
    render(file: CompilerFile): IPage;
    private converterToken;
}
