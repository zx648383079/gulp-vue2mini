"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StyleCompiler = void 0;
var tokenizer_1 = require("../tokenizer");
var util_1 = require("../util");
var StyleCompiler = (function () {
    function StyleCompiler(indent, isIndent) {
        if (indent === void 0) { indent = '    '; }
        if (isIndent === void 0) { isIndent = false; }
        this.indent = indent;
        this.isIndent = isIndent;
    }
    StyleCompiler.prototype.render = function (data) {
        var _this = this;
        var endTextJoin = function () {
            var items = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                items[_i] = arguments[_i];
            }
            if (_this.isIndent) {
                return items.join('');
            }
            return items.join('') + ';';
        };
        return this.toString(data, function (item, content, level) {
            var spaces = _this.indent.length > 0 ? _this.indent.repeat(level) : _this.indent;
            if (item.type === tokenizer_1.StyleTokenType.TEXT) {
                return endTextJoin(spaces, item.content) + util_1.LINE_SPLITE;
            }
            if (item.type === tokenizer_1.StyleTokenType.COMMENT) {
                var text = item.content;
                if (text.indexOf('\n') < 0) {
                    return spaces + '// ' + item.content + util_1.LINE_SPLITE;
                }
                return spaces + '/* ' + (0, util_1.splitLine)(text).map(function (i) { return i.trim(); }).join(util_1.LINE_SPLITE + spaces) + ' */' + util_1.LINE_SPLITE;
            }
            if (Object.prototype.hasOwnProperty.call(tokenizer_1.StyleTokenCoverter, item.type)) {
                return endTextJoin(spaces, tokenizer_1.StyleTokenCoverter[item.type], ' ', item.content) + util_1.LINE_SPLITE;
            }
            if (item.type === tokenizer_1.StyleTokenType.STYLE) {
                return endTextJoin(spaces, item.name, ': ', item.content) + util_1.LINE_SPLITE;
            }
            if (item.type === tokenizer_1.StyleTokenType.STYLE_GROUP) {
                var line = spaces + (typeof item.name === 'object' ? item.name.join(',' + util_1.LINE_SPLITE + spaces) : item.name) + (_this.isIndent ? '' : ' {') + util_1.LINE_SPLITE + content;
                if (!_this.isIndent) {
                    return line + spaces + '}' + util_1.LINE_SPLITE;
                }
                return line;
            }
            return '';
        });
    };
    StyleCompiler.prototype.map = function (data, cb) {
        var items = data instanceof Array ? data : data.children;
        if (!items) {
            return;
        }
        items.forEach(function (item) {
            cb(item);
        });
    };
    StyleCompiler.prototype.toString = function (data, cb, level) {
        var _this = this;
        if (level === void 0) { level = 0; }
        var str = '';
        if (level > 0 && data instanceof Array) {
            data = data.sort(function (a, b) {
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
        this.map(data, function (item) {
            str += _this.toString(item, cb, level + 1);
        });
        if (data instanceof Array) {
            return str;
        }
        return cb(data, str, level);
    };
    StyleCompiler.prototype.toMap = function (data, cb) {
        var _this = this;
        var children = [];
        this.map(data, function (item) {
            children.push(_this.toMap(item, cb));
        });
        if (data instanceof Array) {
            return children;
        }
        return cb(data, children.length < 1 ? undefined : children);
    };
    return StyleCompiler;
}());
exports.StyleCompiler = StyleCompiler;
