import { CompliperFile } from '../../compiler';
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
    render(file: CompliperFile): ITemplateResult;
    private mergeStyle;
    extractStyle(content: string): string;
}
export {};
