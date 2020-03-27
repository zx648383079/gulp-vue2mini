import { Element } from "./element";
export declare let wxmlFunc: string[];
export declare function firstUpper(val: string): string;
export declare function studly(val: string, isFirstUpper?: boolean): string;
export declare function jsonToWxml(json: Element, exclude?: RegExp): string;
export declare function htmlToWxml(content: string): string;
