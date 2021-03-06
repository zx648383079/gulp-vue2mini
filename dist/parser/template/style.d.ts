import { TemplateProject } from './project';
import { CompilerFile, IThemeStyleOption } from '../../compiler';
import { ImporterReturnType } from 'sass';
export declare class StyleParser {
    private project;
    constructor(project: TemplateProject);
    private themeItems;
    private tokenizer;
    private compiler;
    get length(): number;
    get(theme: string): any;
    render(file: CompilerFile): string;
    pushTheme(items: IThemeStyleOption): void;
    extractTheme(content: string): void;
    private renderImport;
    private hasTheme;
    private needTheme;
    importer(url: string, prev: string, done: (data: ImporterReturnType) => void): void;
}
