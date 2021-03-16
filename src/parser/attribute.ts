export class Attribute {
    public static create(attribute: Attribute | any): Attribute {
        if (!attribute) {
            return new Attribute();
        }
        if (attribute instanceof Attribute) {
            return attribute;
        }
        return new Attribute(attribute);
    }
    /**
     *
     */
    constructor(
        public items: {[key: string]: string| boolean} = {}
    ) {
    }

    /**
     * get
     */
    public get(key: string) {
        return this.items.hasOwnProperty(key) ? this.items[key] : undefined;
    }

    public has(key: string) {
        return this.items.hasOwnProperty(key);
    }

    /**
     * set
     */
    public set(key: string| any, value?: any) {
        if (typeof key === 'object') {
            Object.assign(this.items, key);
            return this;
        }
        if (typeof value === 'undefined') {
            return this.delete(key);
        }
        this.items[key] = value;
        return this;
    }

    public filter(cb: (key: string, value: any) => boolean) {
        for (const key in this.items) {
            if (this.items.hasOwnProperty(key) && cb(key, this.items[key]) === true) {
                delete this.items[key];
            }
        }
        return this;
    }

    /**
     * delete
     */
    public delete(key: string) {
        delete this.items[key];
        return this;
    }

    /**
     * on
     */
    public on(keys: string[] | string, cb: (value: any, key: string) => any) {
        if (typeof keys === 'object') {
            keys.forEach(key => {
                this.on(key, cb);
            });
            return this;
        }
        if (!this.items.hasOwnProperty(keys)) {
            return this;
        }
        const val = cb(this.items[keys], keys);
        if (typeof val === 'undefined') {
            delete this.items[keys];
            return this;
        }
        if (typeof val !== 'object') {
            this.items[keys] = val;
            return this;
        }
        if (val instanceof Array) {
            delete this.items[keys];
            this.items[val[0]] = val[1];
            return this;
        }
        this.items = Object.assign(this.items, val);
        return this;
    }

    /**
     * 获取键
     */
    public keys(): string[] {
        return Object.keys(this.items);
    }

    /**
     * map
     */
    public map(cb: (key: string, value: any) => any) {
        const keys = this.keys();
        for (const key of keys) {
            if (this.items.hasOwnProperty(key)) {
                cb(key, this.items[key]);
            }
        }
        return this;
    }

    /**
     * toString
     */
    public toString() {
        const data: string[] = [];
        this.map((key, value) => {
            if (typeof value === 'undefined' || value === false) {
                return;
            }
            if (value === true) {
                data.push(key);
                return;
            }
            if (Array.isArray(value)) {
                value = value.join(' ');
            }
            data.push(`${key}="${value}"`);
        });
        return data.join(' ');
    }

    public clone(): Attribute {
        return Attribute.create(JSON.parse(JSON.stringify(this.items)));
    }
}
