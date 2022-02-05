import { TemplateProject } from './project';
import { CompilerFile } from '../../compiler';
import { Importer } from 'sass';
import { IThemeObject } from './tokenizer';
export declare class StyleParser {
    private project;
    constructor(project: TemplateProject);
    private themeItems;
    private tokenizer;
    private compiler;
    get length(): number;
    get(theme: string): import("./tokenizer").IThemeOption | undefined;
    render(file: CompilerFile): string;
    pushTheme(items: IThemeObject): void;
    extractTheme(content: string): void;
    private renderImport;
    private hasTheme;
    private needTheme;
    importer: Importer<'sync'>;
}
