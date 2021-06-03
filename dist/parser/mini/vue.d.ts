import { MiniProject } from './project';
interface IVueResultItem {
    type: string;
    content: string;
}
interface IScriptResultItem extends IVueResultItem {
    isPage?: boolean;
    isComponent?: boolean;
    isApp?: boolean;
}
interface IVueResult {
    template?: string;
    style?: IVueResultItem;
    script?: IScriptResultItem;
    json?: string;
}
export declare class VueParser {
    private project;
    constructor(project: MiniProject);
    private readonly tokenizer;
    render(content: string, ext: string, srcFile: string): IVueResult;
    private splitTsFile;
}
export {};
