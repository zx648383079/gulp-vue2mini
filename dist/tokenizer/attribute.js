"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attribute = void 0;
class Attribute {
    items;
    static create(attribute) {
        if (!attribute) {
            return new Attribute();
        }
        if (attribute instanceof Attribute) {
            return attribute;
        }
        return new Attribute(attribute);
    }
    constructor(items = {}) {
        this.items = items;
    }
    get(key) {
        return this.items.hasOwnProperty(key) ? this.items[key] : undefined;
    }
    has(key) {
        return this.items.hasOwnProperty(key);
    }
    set(key, value) {
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
    filter(cb) {
        for (const key in this.items) {
            if (this.items.hasOwnProperty(key) && cb(key, this.items[key]) === true) {
                delete this.items[key];
            }
        }
        return this;
    }
    delete(key) {
        delete this.items[key];
        return this;
    }
    on(keys, cb) {
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
    keys() {
        return Object.keys(this.items);
    }
    map(cb) {
        const keys = this.keys();
        for (const key of keys) {
            if (this.items.hasOwnProperty(key)) {
                cb(key, this.items[key]);
            }
        }
        return this;
    }
    toString() {
        const data = [];
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
    clone() {
        return Attribute.create(JSON.parse(JSON.stringify(this.items)));
    }
}
exports.Attribute = Attribute;
