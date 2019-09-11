export class Attribute {
    /**
     *
     */
    constructor(
        public items: {[key: string]: string| boolean} = {}
    ) {
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
     * map
     */
    public map(cb: (key: string, value: any) => any) {
        for (const key in this.items) {
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
        let data: string[] = [];
        this.map((key, value) => {
            if (typeof value === 'undefined' || value === false) {
                return
            }
            if (value === true) {
                data.push(key);
                return 
            }
            if (Array.isArray(value)) {
                value = value.join(' ');
            };
            data.push(`${key}="${value}"`);
        });
        return data.join(' ');
    }

    public static create(attribute: Attribute | any): Attribute {
        if (!attribute) {
            return new Attribute();
        }
        if (attribute instanceof Attribute) {
            return attribute;
        }
        return new Attribute(attribute);
    }
}