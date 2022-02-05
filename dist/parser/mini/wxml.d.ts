import { MiniProject } from './project';
import { ElementToken } from '../../tokenizer';
import { Compiler } from '../../compiler';
interface ITemplateResult {
    template: string;
    func?: string[];
}
export declare class WxmlCompiler implements Compiler<string | ElementToken, ITemplateResult> {
    private exclude;
    private disallowAttrs;
    constructor(_: MiniProject, exclude?: RegExp, disallowAttrs?: string[]);
    private readonly tokenizer;
    private existFunc;
    private replaceAttrs;
    render(data: string | ElementToken): ITemplateResult;
    renderFull(json: ElementToken): ITemplateResult;
    private renderFunc;
    private removeIfText;
    private invertIf;
    private converterSrc;
    private converterClass;
    private converterTap;
    private createInputFunc;
    private createTapFunc;
    private createTapCoverterFunc;
    private q;
    private qStr;
    private qv;
    private parseNodeAttr;
    private parseEventName;
    private parseButton;
    private parseInput;
}
export {};
