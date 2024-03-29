"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonParser = void 0;
class JsonParser {
    constructor(_) { }
    render(...args) {
        return JSON.stringify(this.merge(...args));
    }
    merge(...args) {
        const items = [];
        for (const item of args) {
            if (!item) {
                continue;
            }
            if (typeof item === 'object') {
                items.push(item);
                continue;
            }
            if (typeof item !== 'string') {
                continue;
            }
            const res = eval(item.trim());
            if (typeof res === 'object') {
                items.push(res);
            }
        }
        if (items.length < 1) {
            return {};
        }
        return Object.assign({}, ...items);
    }
}
exports.JsonParser = JsonParser;
