import { CompilerFile } from '../../compiler';
import { TemplateProject } from './project';
interface ITemplateResultItem {
    type: string;
    content: string;
}
interface ITemplateResult {
    template: string;
    style?: ITemplateResultItem;
    script?: ITemplateResultItem;
}
export declare class TemplateParser {
    private project;
    constructor(project: TemplateProject);
    private readonly tokenizer;
    private readonly compiler;
    render(file: CompilerFile): ITemplateResult;
    private mergeStyle;
    extractStyle(content: string): string;
}
export {};
