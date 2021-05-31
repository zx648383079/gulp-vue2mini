import { ICompliperFile } from '../../compiler';
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
    render(file: ICompliperFile): ITemplateResult;
    private mergeStyle;
}
export {};
