import { CharIterator } from '../iterator';
import { Tokenizer } from './base';
import { ElementToken } from './element';
export declare const SINGLE_TAGS: string[];
export declare class TemplateTokenizer implements Tokenizer<string | CharIterator, ElementToken> {
    render(content: string | CharIterator): ElementToken;
    private renderElement;
    private renderOneElement;
    private getElement;
    private isNodeBegin;
    private getNodeEndTag;
    private isNodeEnd;
    private isComment;
    private getCommentElement;
    private getTextElement;
    private backslashedCount;
    private moveEndTag;
    private parserSpecialText;
}
