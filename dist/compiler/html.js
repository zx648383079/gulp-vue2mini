"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateCompiler = exports.htmlBeautify = void 0;
var tokenizer_1 = require("../tokenizer");
var util_1 = require("../util");
function htmlBeautify(indent) {
    if (indent === void 0) { indent = '    '; }
    return function (item, content, level) {
        if (item.node === 'root') {
            return content;
        }
        if (item.node === 'text') {
            return item.text + '';
        }
        var spaces = indent.length > 0 ? util_1.LINE_SPLITE + indent.repeat(level - 1) : indent;
        if (item.node === 'comment') {
            return "".concat(spaces, "<!-- ").concat(item.text, " -->");
        }
        var attr = item.attributeString();
        if (attr.length > 0) {
            attr = ' ' + attr;
        }
        if (item.tag === '!DOCTYPE') {
            return "<".concat(item.tag).concat(attr, ">");
        }
        if (tokenizer_1.SINGLE_TAGS.indexOf(item.tag) >= 0) {
            return "".concat(spaces, "<").concat(item.tag).concat(attr, "/>");
        }
        var endSpaces = item.children && !item.isTextChild() ? spaces : '';
        return "".concat(spaces, "<").concat(item.tag).concat(attr, ">").concat(content).concat(endSpaces, "</").concat(item.tag, ">");
    };
}
exports.htmlBeautify = htmlBeautify;
var TemplateCompiler = (function () {
    function TemplateCompiler(indent) {
        if (indent === void 0) { indent = ''; }
        this.indent = indent;
    }
    TemplateCompiler.prototype.render = function (data) {
        return data.toString(htmlBeautify(this.indent));
    };
    TemplateCompiler.prototype.map = function (data, cb) {
        if (!data.children) {
            return;
        }
        data.children.forEach(function (item) {
            item.parent = data;
            if (item.ignore) {
                return;
            }
            cb(item);
        });
    };
    TemplateCompiler.prototype.toString = function (data, cb, level) {
        var _this = this;
        if (level === void 0) { level = 0; }
        var str = '';
        this.map(data, function (item) {
            str += _this.toString(item, cb, level + 1);
        });
        if (data.node === 'root') {
            return str;
        }
        return cb(data, str, level);
    };
    TemplateCompiler.prototype.toMap = function (data, cb) {
        var _this = this;
        var children = [];
        this.map(data, function (item) {
            children.push(_this.toMap(item, cb));
        });
        if (data.node === 'root') {
            return children;
        }
        return cb(data, children.length < 1 ? undefined : children);
    };
    return TemplateCompiler;
}());
exports.TemplateCompiler = TemplateCompiler;
