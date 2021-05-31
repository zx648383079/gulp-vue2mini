import { MiniProject } from './project';
export declare function ttfToBase64(file: string): string;
export declare function replaceTTF(content: string, folder: string): string;
export declare function preImport(content: string): string;
export declare function endImport(content: string): string;
export declare class StyleParser {
    private project;
    constructor(project: MiniProject);
    render(content: string, file: string): string;
}
