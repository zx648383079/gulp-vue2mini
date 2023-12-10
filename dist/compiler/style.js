"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StyleCompiler = void 0;
const tokenizer_1 = require("../tokenizer");
const util_1 = require("../util");
class StyleCompiler {
    indent;
    isIndent;
    constructor(indent = '    ', isIndent = false) {
        this.indent = indent;
        this.isIndent = isIndent;
    }
    render(data) {
        const endTextJoin = (...items) => {
            if (this.isIndent) {
                return items.join('');
            }
            return items.join('') + ';';
        };
        return this.toString(data, (item, content, level) => {
            const spaces = this.indent.length > 0 ? this.indent.repeat(level) : this.indent;
            if (item.type === tokenizer_1.StyleTokenType.TEXT) {
                return endTextJoin(spaces, item.content) + util_1.LINE_SPLITE;
            }
            if (item.type === tokenizer_1.StyleTokenType.COMMENT) {
                const text = item.content;
                if (text.indexOf('\n') < 0) {
                    return spaces + '// ' + item.content + util_1.LINE_SPLITE;
                }
                return spaces + '/* ' + (0, util_1.splitLine)(text).map(i => i.trim()).join(util_1.LINE_SPLITE + spaces) + ' */' + util_1.LINE_SPLITE;
            }
            if (Object.prototype.hasOwnProperty.call(tokenizer_1.StyleTokenCoverter, item.type)) {
                return endTextJoin(spaces, tokenizer_1.StyleTokenCoverter[item.type], ' ', item.content) + util_1.LINE_SPLITE;
            }
            if (item.type === tokenizer_1.StyleTokenType.STYLE) {
                return endTextJoin(spaces, item.name, ': ', item.content) + util_1.LINE_SPLITE;
            }
            if (item.type === tokenizer_1.StyleTokenType.STYLE_GROUP) {
                const line = spaces + (typeof item.name === 'object' ? item.name.join(',' + util_1.LINE_SPLITE + spaces) : item.name) + (this.isIndent ? '' : ' {') + util_1.LINE_SPLITE + content;
                if (!this.isIndent) {
                    return line + spaces + '}' + util_1.LINE_SPLITE;
                }
                return line;
            }
            return '';
        });
    }
    map(data, cb) {
        const items = data instanceof Array ? data : data.children;
        if (!items) {
            return;
        }
        items.forEach(item => {
            cb(item);
        });
    }
    toString(data, cb, level = 0) {
        let str = '';
        if (level > 0 && data instanceof Array) {
            data = data.sort((a, b) => {
                if (a.type === b.type) {
                    return 0;
                }
                if (a.type === tokenizer_1.StyleTokenType.STYLE_GROUP) {
                    return 1;
                }
                if (b.type === tokenizer_1.StyleTokenType.STYLE_GROUP) {
                    return -1;
                }
                return 0;
            });
        }
        this.map(data, item => {
            str += this.toString(item, cb, level + 1);
        });
        if (data instanceof Array) {
            return str;
        }
        return cb(data, str, level);
    }
    toMap(data, cb) {
        const children = [];
        this.map(data, item => {
            children.push(this.toMap(item, cb));
        });
        if (data instanceof Array) {
            return children;
        }
        return cb(data, children.length < 1 ? undefined : children);
    }
}
exports.StyleCompiler = StyleCompiler;
