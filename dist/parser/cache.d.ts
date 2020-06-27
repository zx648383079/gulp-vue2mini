export declare class CacheManger<T> {
    private data;
    has(key: string, time?: number): boolean;
    get(key: string): T | undefined;
    set(key: string, data: T, time?: number): this;
    delete(...keys: string[]): this;
    clear(): this;
}
