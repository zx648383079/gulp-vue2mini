"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SassCompiler = void 0;
const tokenizer_1 = require("../tokenizer");
const util_1 = require("../util");
const style_1 = require("./style");
class SassCompiler {
    tokenizer;
    compiler;
    constructor(tokenizer = new tokenizer_1.StyleTokenizer(), compiler = new style_1.StyleCompiler()) {
        this.tokenizer = tokenizer;
        this.compiler = compiler;
    }
    render(data) {
        if (typeof data !== 'object') {
            this.tokenizer.autoIndent(data);
            data = this.tokenizer.render(data);
        }
        return this.compiler.render(this.splitBlock(data));
    }
    splitRuleName(name) {
        name = name.trim();
        if (name.length < 2) {
            return [name];
        }
        const tags = {
            '[': ']',
            '(': ')',
        };
        const args = [];
        let tag = '';
        let pos = 0;
        if (name.charAt(pos) === '&') {
            const k = name.charAt(pos + 1);
            let i = pos + 1;
            while (i < name.length) {
                if (name.charAt(++i) !== k) {
                    break;
                }
            }
            tag = name.substring(pos, i);
            pos = i + 1;
        }
        const appendTag = () => {
            const item = tag.trim();
            tag = '';
            if (item.length < 1) {
                return;
            }
            const c = item.charAt(0);
            if (c === '&') {
                args.push(item);
                return;
            }
            if (c === '>' || c === '+' || c === '~') {
                args.push('&' + item);
                return;
            }
            args.push(item);
        };
        let startTag = '';
        let endTag = '';
        let endCount = 0;
        while (pos < name.length) {
            const code = name.charAt(pos);
            pos++;
            if (endCount > 0) {
                tag += code;
                if (code === startTag) {
                    endCount++;
                }
                else if (code === endTag) {
                    endCount--;
                }
                continue;
            }
            if (Object.prototype.hasOwnProperty.call(tags, code)) {
                startTag = code;
                endTag = tags[code];
                endCount = 1;
                tag += code;
                continue;
            }
            if (code === '>' || code === '~' || code === '+') {
                appendTag();
                let i = pos;
                while (i < name.length) {
                    if (!(0, util_1.isEmptyCode)(name.charAt(i))) {
                        break;
                    }
                    i++;
                }
                tag = (args.length > 0 ? '&' : '') + code;
                pos = i;
                continue;
            }
            if (code === '.') {
                appendTag();
                tag = (args.length > 0 && !(0, util_1.isEmptyCode)(name.charAt(pos - 2)) ? '&' : '') + code;
                continue;
            }
            if (code === ':') {
                appendTag();
                let i = pos;
                while (i < name.length) {
                    if (name.charAt(++i) !== ':') {
                        break;
                    }
                }
                tag = (args.length > 0 ? '&' : '') + name.substring(pos - 1, i);
                pos = i;
                continue;
            }
            if ((0, util_1.isEmptyCode)(code)) {
                appendTag();
                tag = '';
                continue;
            }
            tag += code;
        }
        appendTag();
        return args;
    }
    splitBlock(items) {
        const data = [];
        const resetName = (names, hasPrefix = false) => {
            return names.map((val, j) => {
                if (j === 0) {
                    return val.indexOf('&') === 0 && !hasPrefix ? val.substring(1) : val;
                }
                return val.indexOf('&') === 0 ? val.substring(1) : (' ' + val);
            }).join('');
        };
        const findTreeName = (names) => {
            if (names.length < 2) {
                return this.splitRuleName(names[0]).map(i => {
                    return [i];
                });
            }
            const reverseArgs = [];
            const args = [];
            const cache = [];
            const getCacheName = (i, j) => {
                if (cache.length <= i) {
                    cache.push(this.splitRuleName(names[i]));
                }
                const pos = j < 0 ? cache[i].length + j : j;
                if (pos >= cache[i].length) {
                    return '';
                }
                return cache[i][pos];
            };
            const getReverseName = (i, j) => {
                return getCacheName(i, -1 - j);
            };
            let index = 0;
            let isEnd = false;
            while (true) {
                const name = getCacheName(0, index);
                if (name === '') {
                    break;
                }
                isEnd = false;
                for (let i = 1; i < names.length; i++) {
                    if (name !== getCacheName(i, index)) {
                        isEnd = true;
                        break;
                    }
                }
                if (isEnd) {
                    break;
                }
                args.push([name]);
                index++;
            }
            index = 0;
            while (true) {
                const name = getReverseName(0, index);
                if (name === '' || cache[0].length - index - 1 <= args.length) {
                    break;
                }
                isEnd = false;
                for (let i = 1; i < names.length; i++) {
                    if (name !== getReverseName(i, index)) {
                        isEnd = true;
                        break;
                    }
                    if (cache[i].length - index - 1 <= args.length) {
                        isEnd = true;
                        break;
                    }
                }
                if (isEnd) {
                    break;
                }
                reverseArgs.push([name]);
                index++;
            }
            if (reverseArgs.length < 1 && args.length < 1) {
                return [names];
            }
            reverseArgs.push(names.map((i, j) => {
                const c = cache.length > j ? cache[j] : this.splitRuleName(i);
                const start = args.length;
                const end = c.length - reverseArgs.length;
                return resetName(c.splice(start, end - start), start > 0);
            }));
            return [...args, ...reverseArgs.reverse()];
        };
        const arrEq = (a, b) => {
            if (a.length !== b.length) {
                return false;
            }
            for (const i of a) {
                if (b.indexOf(i) < 0) {
                    return false;
                }
            }
            return true;
        };
        const mergeStyle = (parent, children) => {
            children.forEach(i => {
                if (i.type !== tokenizer_1.StyleTokenType.STYLE) {
                    parent.push(i);
                    return;
                }
                for (const j of parent) {
                    if (j.type === tokenizer_1.StyleTokenType.STYLE && j.name === i.name) {
                        j.content = i.content;
                        return;
                    }
                }
                parent.push(i);
            });
        };
        const appendBlock = (names, children, parent) => {
            if (names.length < 1) {
                mergeStyle(parent, children);
                return;
            }
            const name = names.shift();
            for (const item of parent) {
                if (item.type !== tokenizer_1.StyleTokenType.STYLE_GROUP) {
                    continue;
                }
                if (!arrEq(name, item.name)) {
                    continue;
                }
                if (!item.children) {
                    item.children = [];
                }
                appendBlock(names, children, item.children);
                return;
            }
            const block = {
                type: tokenizer_1.StyleTokenType.STYLE_GROUP,
                name,
                children: []
            };
            parent.push(block);
            appendBlock(names, children, block.children);
        };
        const createTree = (item, parent) => {
            if (item.type !== tokenizer_1.StyleTokenType.STYLE_GROUP) {
                parent.push(item);
                return;
            }
            const name = findTreeName(typeof item.name === 'object' ? item.name : [item.name]);
            appendBlock(name, item.children, parent);
        };
        for (const item of items) {
            createTree(item, data);
        }
        return data;
    }
}
exports.SassCompiler = SassCompiler;
