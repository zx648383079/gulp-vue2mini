import { MiniProject } from './project';
export declare class JsonParser {
    private project;
    constructor(project: MiniProject);
    render(...args: any[]): string;
    merge(...args: any[]): any;
}
