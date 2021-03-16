import { Attribute } from './attribute';
export declare class Element {
    tag: string;
    text?: string | undefined;
    node?: string | undefined;
    children?: Element[] | undefined;
    attribute?: Attribute | undefined;
    ignore: boolean;
    parent?: Element;
    static comment(text: string): Element;
    static text(text: string): Element;
    static nodeElement(node: string, text: string | Element[]): Element;
    static noKid(tag: string, attribute?: any): Element;
    static create(tag: string, children: Element[], attribute?: any): Element;
    static htmlBeautify(indent?: string): (item: Element, content: string, level: number) => string;
    static jsonCallback(item: Element, children?: any[]): any[] | any;
    constructor(tag?: string, text?: string | undefined, node?: string | undefined, children?: Element[] | undefined, attribute?: Attribute | undefined);
    attr(key: string | any, value?: any): string | boolean | this | undefined;
    push(...items: Element[]): this;
    map(cb: (item: Element) => any): void;
    attributeString(): string;
    isTextChild(): boolean;
    toString(cb: (item: Element, content: string, level: number) => string, level?: number): string;
    toJson(cb: (item: Element, children?: any[]) => any): any[] | any;
    clone(): Element;
}
