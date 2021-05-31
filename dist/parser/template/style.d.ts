import { TemplateProject } from './project';
interface IThemeOption {
    [key: string]: {
        [name: string]: string;
    };
}
export declare class StyleParser {
    private project;
    constructor(project: TemplateProject);
    private themeItems;
    render(content: string, file: string, lang?: string): string;
    pushTheme(items: IThemeOption): void;
    private hasTheme;
    private needTheme;
    private sassImport;
}
export {};
