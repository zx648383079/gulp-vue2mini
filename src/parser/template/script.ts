import { TemplateProject } from './project';

export class ScriptParser {
    constructor(
        private project: TemplateProject
    ) {}

    public render(content: string): string {
       return content;
    }
}