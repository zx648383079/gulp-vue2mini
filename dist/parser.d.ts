interface IElement {
    node: string;
    tag?: string;
    text?: string;
    children?: IElement[];
    attrs?: {
        [key: string]: string | boolean;
    };
}
export declare function htmlToJson(content: string): IElement[];
export declare function jsonToWxml(json: IElement | IElement[], exclude?: RegExp): string;
export declare function htmlToWxml(content: string): string;
export declare function parsePage(content: string): string;
export declare function parseJson(content: string, append: any): string | null;
export declare function parseMethodToObject(content: string, maps: {
    [key: string]: string;
}): string;
export declare function ttfToBase64(file: string): string;
export declare function replaceTTF(content: string, folder: string): string;
export declare function preImport(content: string): string;
export declare function endImport(content: string): string;
export {};
