interface ICacheData<T> {
    data: T;
    time: number;
}

export class CacheManger<T> {
    private data: {[key: string]: ICacheData<T>} = {};

    public has(key: string, time: number = 0): boolean {
        return this.data.hasOwnProperty(key) && (time === 0 || this.data[key].time >= time);
    }

    public get(key: string): T | undefined {
        return this.has(key) ? this.data[key].data : undefined;
    }

    public set(key: string, data: T, time = 0) {
        this.data[key] = {
            data,
            time
        };
        return this;
    }

    public delete(...keys: string[]) {
        for (const key of keys) {
            delete this.data[key];
        }
        return this;
    }

    public clear() {
        this.data = {};
        return this;
    }
}