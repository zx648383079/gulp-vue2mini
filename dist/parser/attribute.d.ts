export declare class Attribute {
    items: {
        [key: string]: string | boolean;
    };
    constructor(items?: {
        [key: string]: string | boolean;
    });
    get(key: string): string | boolean | undefined;
    has(key: string): boolean;
    set(key: string | any, value?: any): this;
    filter(cb: (key: string, value: any) => boolean): this;
    delete(key: string): this;
    on(keys: string[] | string, cb: (value: any, key: string) => any): this;
    keys(): string[];
    map(cb: (key: string, value: any) => any): this;
    toString(): string;
    clone(): Attribute;
    static create(attribute: Attribute | any): Attribute;
}
