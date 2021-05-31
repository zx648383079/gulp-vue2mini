import { ICompliperFile } from '../../compiler';
import { TemplateProject } from './project';
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
export declare class TemplateTokenizer {
    private project;
    constructor(project: TemplateProject);
    private cachesFiles;
    render(file: ICompliperFile): IPage;
    private converterToken;
}
