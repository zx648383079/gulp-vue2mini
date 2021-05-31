import { MiniProject } from './project';
interface IScriptResult {
    script: string;
    json?: string;
    isPage?: boolean;
    isComponent?: boolean;
    isApp?: boolean;
}
export declare class ScriptParser {
    private project;
    constructor(project: MiniProject);
    render(source: string, templateFunc?: string[]): IScriptResult;
    private parseJson;
    private parseMethodToObject;
    private appendMethod;
}
export {};
