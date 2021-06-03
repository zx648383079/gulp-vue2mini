import { TemplateProject } from './project';
import { CompilerFile, IThemeStyleOption } from '../../compiler';
export declare class StyleParser {
    private project;
    constructor(project: TemplateProject);
    private themeItems;
    private tokenizer;
    private compiler;
    get length(): number;
    get(theme: string): {
        [name: string]: string;
    } | undefined;
    render(file: CompilerFile): string;
    pushTheme(items: IThemeStyleOption): void;
    extractTheme(content: string): void;
    private renderImport;
    private hasTheme;
    private needTheme;
}
