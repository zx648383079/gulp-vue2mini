import { Element } from './element';
export declare const SINGLE_TAGS: string[];
export declare function htmlToJson(content: string): Element;
export declare function jsonToHtml(json: Element, indent?: string): string;
