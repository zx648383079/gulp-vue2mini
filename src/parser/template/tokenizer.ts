export type TYPE_MAP = 'text' | 'comment' | 'extend' | 'script' | 'style' | 'layout' | 'content' | 'random' | 'theme';

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