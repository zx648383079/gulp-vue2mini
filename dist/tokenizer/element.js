"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementToken = void 0;
const attribute_1 = require("./attribute");
class ElementToken {
    tag;
    text;
    node;
    children;
    attribute;
    ignore = false;
    parent;
    static comment(text) {
        return ElementToken.nodeElement('comment', text);
    }
    static text(text) {
        return ElementToken.nodeElement('text', text);
    }
    static nodeElement(node, text) {
        if (typeof text === 'object') {
            return new ElementToken(undefined, undefined, node, text);
        }
        return new ElementToken(undefined, text, node);
    }
    static noKid(tag, attribute) {
        return new ElementToken(tag, undefined, 'element', undefined, attribute_1.Attribute.create(attribute));
    }
    static create(tag, children, attribute) {
        return new ElementToken(tag, undefined, 'element', children, attribute_1.Attribute.create(attribute));
    }
    static jsonCallback(item, children) {
        if (item.node === 'root') {
            return children;
        }
        if (item.node === 'text' || item.node === 'comment') {
            return {
                node: item.node,
                text: item.text
            };
        }
        const data = {
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
    }
    constructor(tag = '', text, node, children, attribute) {
        this.tag = tag;
        this.text = text;
        this.node = node;
        this.children = children;
        this.attribute = attribute;
    }
    attr(key, value) {
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
    }
    push(...items) {
        if (!this.children) {
            this.children = [];
        }
        for (const item of items) {
            if (!item) {
                continue;
            }
            this.children.push(item);
        }
        return this;
    }
    map(cb) {
        if (!this.children) {
            return;
        }
        this.children.forEach(item => {
            item.parent = this;
            if (item.ignore) {
                return;
            }
            cb(item);
        });
    }
    attributeString() {
        if (!this.attribute) {
            return '';
        }
        return this.attribute.toString();
    }
    isTextChild() {
        if (!this.children) {
            return false;
        }
        for (const item of this.children) {
            if (item.node !== 'text') {
                return false;
            }
        }
        return true;
    }
    toString(cb, level = 0) {
        let str = '';
        this.map(item => {
            str += item.toString(cb, level + 1);
        });
        if (this.node === 'root') {
            return str;
        }
        return cb(this, str, level);
    }
    toMap(cb) {
        const children = [];
        this.map(item => {
            children.push(item.toMap(cb));
        });
        if (this.node === 'root') {
            return children;
        }
        return cb(this, children.length < 1 ? undefined : children);
    }
    clone() {
        return new ElementToken(this.tag, this.text, this.node, this.children, this.attribute);
    }
}
exports.ElementToken = ElementToken;
