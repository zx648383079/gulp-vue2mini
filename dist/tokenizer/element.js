"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementToken = void 0;
var attribute_1 = require("./attribute");
var ElementToken = (function () {
    function ElementToken(tag, text, node, children, attribute) {
        if (tag === void 0) { tag = ''; }
        this.tag = tag;
        this.text = text;
        this.node = node;
        this.children = children;
        this.attribute = attribute;
        this.ignore = false;
    }
    ElementToken.comment = function (text) {
        return ElementToken.nodeElement('comment', text);
    };
    ElementToken.text = function (text) {
        return ElementToken.nodeElement('text', text);
    };
    ElementToken.nodeElement = function (node, text) {
        if (typeof text === 'object') {
            return new ElementToken(undefined, undefined, node, text);
        }
        return new ElementToken(undefined, text, node);
    };
    ElementToken.noKid = function (tag, attribute) {
        return new ElementToken(tag, undefined, 'element', undefined, attribute_1.Attribute.create(attribute));
    };
    ElementToken.create = function (tag, children, attribute) {
        return new ElementToken(tag, undefined, 'element', children, attribute_1.Attribute.create(attribute));
    };
    ElementToken.jsonCallback = function (item, children) {
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
    ElementToken.prototype.attr = function (key, value) {
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
    ElementToken.prototype.push = function () {
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
    ElementToken.prototype.map = function (cb) {
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
    ElementToken.prototype.attributeString = function () {
        if (!this.attribute) {
            return '';
        }
        return this.attribute.toString();
    };
    ElementToken.prototype.isTextChild = function () {
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
    ElementToken.prototype.toString = function (cb, level) {
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
    ElementToken.prototype.toMap = function (cb) {
        var children = [];
        this.map(function (item) {
            children.push(item.toMap(cb));
        });
        if (this.node === 'root') {
            return children;
        }
        return cb(this, children.length < 1 ? undefined : children);
    };
    ElementToken.prototype.clone = function () {
        return new ElementToken(this.tag, this.text, this.node, this.children, this.attribute);
    };
    return ElementToken;
}());
exports.ElementToken = ElementToken;
