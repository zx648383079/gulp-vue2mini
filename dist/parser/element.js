"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Element = void 0;
var attribute_1 = require("./attribute");
var html_1 = require("./html");
var util_1 = require("./util");
var Element = (function () {
    function Element(tag, text, node, children, attribute) {
        if (tag === void 0) { tag = ''; }
        this.tag = tag;
        this.text = text;
        this.node = node;
        this.children = children;
        this.attribute = attribute;
        this.ignore = false;
    }
    Element.comment = function (text) {
        return Element.nodeElement('comment', text);
    };
    Element.text = function (text) {
        return Element.nodeElement('text', text);
    };
    Element.nodeElement = function (node, text) {
        if (typeof text === 'object') {
            return new Element(undefined, undefined, node, text);
        }
        return new Element(undefined, text, node);
    };
    Element.noKid = function (tag, attribute) {
        return new Element(tag, undefined, 'element', undefined, attribute_1.Attribute.create(attribute));
    };
    Element.create = function (tag, children, attribute) {
        return new Element(tag, undefined, 'element', children, attribute_1.Attribute.create(attribute));
    };
    Element.htmlBeautify = function (indent) {
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
                return spaces + "<!-- " + item.text + " -->";
            }
            var attr = item.attributeString();
            if (attr.length > 0) {
                attr = ' ' + attr;
            }
            if (item.tag === '!DOCTYPE') {
                return "<" + item.tag + attr + ">";
            }
            if (html_1.SINGLE_TAGS.indexOf(item.tag) >= 0) {
                return spaces + "<" + item.tag + attr + "/>";
            }
            var endSpaces = item.children && !item.isTextChild() ? spaces : '';
            return spaces + "<" + item.tag + attr + ">" + content + endSpaces + "</" + item.tag + ">";
        };
    };
    Element.jsonCallback = function (item, children) {
        if (item.node === 'root') {
            return children;
        }
        if (item.node === 'text' || item.node === 'comment') {
            return {
                node: item.node,
                text: item.text
            };
        }
        var data = {
            node: item.node,
            tag: item.tag
        };
        if (children) {
            data.children = children;
        }
        if (item.attribute) {
            data.attrs = item.attribute;
        }
        return data;
    };
    Element.prototype.attr = function (key, value) {
        if (!this.attribute) {
            this.attribute = new attribute_1.Attribute();
        }
        if (typeof value !== 'undefined') {
            this.attribute.set(key, value);
            return this;
        }
        if (typeof key === 'object') {
            this.attribute.set(key);
            return this;
        }
        return this.attribute.get(key);
    };
    Element.prototype.push = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        if (!this.children) {
            this.children = [];
        }
        for (var _a = 0, items_1 = items; _a < items_1.length; _a++) {
            var item = items_1[_a];
            if (!item) {
                continue;
            }
            this.children.push(item);
        }
        return this;
    };
    Element.prototype.map = function (cb) {
        var _this = this;
        if (!this.children) {
            return;
        }
        this.children.forEach(function (item) {
            item.parent = _this;
            if (item.ignore) {
                return;
            }
            cb(item);
        });
    };
    Element.prototype.attributeString = function () {
        if (!this.attribute) {
            return '';
        }
        return this.attribute.toString();
    };
    Element.prototype.isTextChild = function () {
        if (!this.children) {
            return false;
        }
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item.node !== 'text') {
                return false;
            }
        }
        return true;
    };
    Element.prototype.toString = function (cb, level) {
        if (level === void 0) { level = 0; }
        var str = '';
        this.map(function (item) {
            str += item.toString(cb, level + 1);
        });
        if (this.node === 'root') {
            return str;
        }
        return cb(this, str, level);
    };
    Element.prototype.toJson = function (cb) {
        var children = [];
        this.map(function (item) {
            children.push(item.toJson(cb));
        });
        if (this.node === 'root') {
            return children;
        }
        return cb(this, children.length < 1 ? undefined : children);
    };
    Element.prototype.clone = function () {
        return new Element(this.tag, this.text, this.node, this.children, this.attribute);
    };
    return Element;
}());
exports.Element = Element;
