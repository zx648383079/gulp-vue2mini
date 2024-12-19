"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateCompiler = void 0;
exports.htmlBeautify = htmlBeautify;
const tokenizer_1 = require("../tokenizer");
const util_1 = require("../util");
function htmlBeautify(indent = '    ') {
    return (item, content, level) => {
        if (item.node === 'root') {
            return content;
        }
        if (item.node === 'text') {
            return item.text + '';
        }
        const spaces = indent.length > 0 ? util_1.LINE_SPLITE + indent.repeat(level - 1) : indent;
        if (item.node === 'comment') {
            return `${spaces}<!-- ${item.text} -->`;
        }
        let attr = item.attributeString();
        if (attr.length > 0) {
            attr = ' ' + attr;
        }
        if (item.tag === '!DOCTYPE') {
            return `<${item.tag}${attr}>`;
        }
        if (tokenizer_1.SINGLE_TAGS.indexOf(item.tag) >= 0) {
            return `${spaces}<${item.tag}${attr}/>`;
        }
        const endSpaces = item.children && !item.isTextChild() ? spaces : '';
        return `${spaces}<${item.tag}${attr}>${content}${endSpaces}</${item.tag}>`;
    };
}
class TemplateCompiler {
    indent;
    constructor(indent = '') {
        this.indent = indent;
    }
    render(data) {
        return data.toString(htmlBeautify(this.indent));
    }
    map(data, cb) {
        if (!data.children) {
            return;
        }
        data.children.forEach(item => {
            item.parent = data;
            if (item.ignore) {
                return;
            }
            cb(item);
        });
    }
    toString(data, cb, level = 0) {
        let str = '';
        this.map(data, item => {
            str += this.toString(item, cb, level + 1);
        });
        if (data.node === 'root') {
            return str;
        }
        return cb(data, str, level);
    }
    toMap(data, cb) {
        const children = [];
        this.map(data, item => {
            children.push(this.toMap(item, cb));
        });
        if (data.node === 'root') {
            return children;
        }
        return cb(data, children.length < 1 ? undefined : children);
    }
}
exports.TemplateCompiler = TemplateCompiler;
