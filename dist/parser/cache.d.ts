export declare class CacheManger {
    private data;
    has(key: string): boolean;
    get(key: string): any;
    set(key: string, data: any): this;
    delete(...keys: string[]): this;
    clear(): this;
}
