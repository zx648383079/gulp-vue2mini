interface ITemplate {
    type: string;
    content: string;
}
interface IFileTemplate {
    html?: ITemplate;
    style?: ITemplate;
    script?: ITemplate;
    json?: ITemplate;
}
export declare function splitFile(content: string, ext?: string, appendJson?: any): IFileTemplate;
export {};
