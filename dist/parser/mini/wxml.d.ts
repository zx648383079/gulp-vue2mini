import { Element } from '../element';
import { MiniProject } from './project';
export declare function jsonToWxml(json: Element, exclude?: RegExp, wxmlFunc?: string[]): string;
export declare function htmlToWxml(content: string): string;
interface ITemplateResult {
    template: string;
    func?: string[];
}
export declare class TemplateParser {
    private project;
    private exclude;
    constructor(project: MiniProject, exclude?: RegExp);
    render(content: string | Element): ITemplateResult;
}
export {};
