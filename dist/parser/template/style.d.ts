import { TemplateProject } from './project';
import { CompliperFile } from '../../compiler';
interface IThemeOption {
    [key: string]: {
        [name: string]: string;
    };
}
export declare class StyleParser {
    private project;
    constructor(project: TemplateProject);
    private themeItems;
    get length(): number;
    get(theme: string): {
        [name: string]: string;
    } | undefined;
    render(file: CompliperFile): string;
    pushTheme(items: IThemeOption): void;
    extractTheme(content: string): void;
    private renderImport;
    private hasTheme;
    private needTheme;
}
export {};
