declare enum BLOCK_TYPE {
    COMMENT = 0,
    CHASET = 1,
    IMPORT = 2,
    INCLUDE = 3,
    TEXT = 4,
    STYLE_GROUP = 5,
    STYLE = 6
}
interface IBlockItem {
    [key: string]: any;
    type: BLOCK_TYPE;
    text?: string;
    children?: IBlockItem[];
}
export declare function cssToJson(content: string): IBlockItem[];
export declare function splitRuleName(name: string): string[];
export declare function cssToScss(content: string): string;
export declare function themeCss(items: IBlockItem[]): IBlockItem[];
export declare function formatThemeCss(content: string): string;
export {};
