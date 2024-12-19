import { CharIterator } from '../iterator';
import { Tokenizer } from './base';
export declare enum StyleTokenType {
    COMMENT = 0,
    CHASET = 1,
    IMPORT = 2,
    INCLUDE = 3,
    EXTEND = 4,
    USE = 5,
    FORWARD = 6,
    TEXT = 7,
    STYLE_GROUP = 8,
    STYLE = 9
}
export declare const StyleTokenCoverter: any;
export interface StyleToken {
    type: StyleTokenType;
    content?: string;
    name?: string[] | string;
    children?: StyleToken[];
}
export declare class StyleTokenizer implements Tokenizer<string | CharIterator, StyleToken[]> {
    private isIndent;
    constructor(isIndent?: boolean);
    autoIndent(content: string): void;
    render(content: string | CharIterator): StyleToken[];
    private renderBlock;
    private parserBlock;
    private getPreviousLine;
    private isComment;
    private getCommentBock;
    private getTextBlock;
    private getMultipleName;
    private getBlock;
    private minIndex;
    private getSassBlock;
    private indentSize;
    private jumpEmptyLine;
    private nextIndentSize;
    private moveNewLine;
    private lineEndIsComma;
}
