
export class CacheManger {
    private data: {[key: string]: any} = {};

    public has(key: string): boolean {
        return this.data.hasOwnProperty(key);
    }

    public get(key: string): any {
        return this.has(key) ? this.data[key] : undefined;
    }

    public set(key: string, data: any) {
        this.data[key] = data;
        return this;
    }

    public delete(...keys: string[]) {
        for (const key of keys) {
            delete this.data[key];
        }
        return this;
    }

    public clear() {
        this.data = {}
        return this;
    }
}