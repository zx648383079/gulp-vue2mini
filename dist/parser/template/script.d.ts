import { TemplateProject } from './project';
export declare class ScriptParser {
    private project;
    constructor(project: TemplateProject);
    render(content: string): string;
}
