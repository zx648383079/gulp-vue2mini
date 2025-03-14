"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.glob = glob;
exports.renderOutputRule = renderOutputRule;
const glob_1 = require("glob");
function isGlobPattern(input) {
    return input.indexOf('*') >= 0 || input.indexOf('?') >= 0 || input.indexOf('[') >= 0 || input.indexOf('(') >= 0 || input.indexOf('{') >= 0;
}
function glob(input) {
    const items = [];
    for (const item of input) {
        if (!isGlobPattern(item)) {
            items.push(item);
            continue;
        }
        items.push(...(0, glob_1.globSync)(item));
    }
    return items;
}
function renderOutputRule(input, output) {
    if (!output.endsWith('/')) {
        return output;
    }
    const data = input.split(/[\\\/]/g);
    const items = output.split('/');
    items[items.length - 1] = data[data.length - 1];
    const res = [];
    items.forEach((v, i) => {
        if (v === '**') {
            const count = data.length - res.length - items.length + i + 1;
            for (let j = 0; j < count; j++) {
                res.push('*');
            }
            return;
        }
        res.push(v);
    });
    let remove = res.length - data.length;
    for (let i = res.length - 1; i >= 0; i--) {
        if (res[i] !== '*') {
            continue;
        }
        if (remove > 0) {
            res.splice(i, 1);
            remove--;
            continue;
        }
        res[i] = data[data.length - res.length + i];
    }
    return res.join('/');
}
