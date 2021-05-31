declare enum BLOCK_TYPE {
    COMMENT = 0,
    CHASET = 1,
    IMPORT = 2,
    INCLUDE = 3,
    EXTEND = 4,
    USE = 5,
    TEXT = 6,
    STYLE_GROUP = 7,
    STYLE = 8
}
interface IBlockItem {
    [key: string]: any;
    type: BLOCK_TYPE;
    text?: string;
    children?: IBlockItem[];
}
export declare function cssToJson(content: string): IBlockItem[];
export declare function blockToString(items: IBlockItem[], level?: number, indent?: string, isIndent?: boolean): string;
export declare function splitRuleName(name: string): string[];
export declare function cssToScss(content: string): string;
export declare function separateThemeStyle(items: IBlockItem[]): any[];
export declare function themeCss(items: IBlockItem[], themeOption?: any): IBlockItem[];
export declare function formatThemeCss(items: IBlockItem[]): string;
export declare function formatThemeCss(content: string): string;
export {};
