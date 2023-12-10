"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheManger = void 0;
class CacheManger {
    data = {};
    has(key, time = 0) {
        return this.data.hasOwnProperty(key) && (time === 0 || this.data[key].time >= time);
    }
    get(key) {
        return this.has(key) ? this.data[key].data : undefined;
    }
    set(key, data, time = 0) {
        this.data[key] = {
            data,
            time
        };
        return this;
    }
    delete(...keys) {
        for (const key of keys) {
            delete this.data[key];
        }
        return this;
    }
    getOrSet(key, cb, time = 0) {
        if (this.has(key, time)) {
            return this.get(key);
        }
        const data = cb();
        this.set(key, data, time);
        return data;
    }
    clear() {
        this.data = {};
        return this;
    }
}
exports.CacheManger = CacheManger;
