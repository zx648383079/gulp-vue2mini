import { Attribute } from './attribute';
export declare class ElementToken {
    tag: string;
    text?: string | undefined;
    node?: string | undefined;
    children?: ElementToken[] | undefined;
    attribute?: Attribute | undefined;
    ignore: boolean;
    parent?: ElementToken;
    static comment(text: string): ElementToken;
    static text(text: string): ElementToken;
    static nodeElement(node: string, text: string | ElementToken[]): ElementToken;
    static noKid(tag: string, attribute?: any): ElementToken;
    static create(tag: string, children: ElementToken[], attribute?: any): ElementToken;
    static jsonCallback(item: ElementToken, children?: any[]): any[] | any;
    constructor(tag?: string, text?: string | undefined, node?: string | undefined, children?: ElementToken[] | undefined, attribute?: Attribute | undefined);
    attr(key: string | any, value?: any): string | boolean | this | undefined;
    push(...items: ElementToken[]): this;
    map(cb: (item: ElementToken) => any): void;
    attributeString(): string;
    isTextChild(): boolean;
    toString(cb: (item: ElementToken, content: string, level: number) => string, level?: number): string;
    toMap(cb: (item: ElementToken, children?: any[]) => any): any[] | any;
    clone(): ElementToken;
}
