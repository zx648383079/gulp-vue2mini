"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateTokenizer = exports.SINGLE_TAGS = void 0;
var iterator_1 = require("../iterator");
var util_1 = require("../util");
var element_1 = require("./element");
var ElementTokenType;
(function (ElementTokenType) {
    ElementTokenType[ElementTokenType["NONE"] = 0] = "NONE";
    ElementTokenType[ElementTokenType["TAG"] = 1] = "TAG";
    ElementTokenType[ElementTokenType["ATTR"] = 2] = "ATTR";
    ElementTokenType[ElementTokenType["ATTR_VALUE"] = 3] = "ATTR_VALUE";
    ElementTokenType[ElementTokenType["END_TAG"] = 4] = "END_TAG";
})(ElementTokenType || (ElementTokenType = {}));
exports.SINGLE_TAGS = ['area', 'base', 'basefont', 'br', 'col', 'frame', 'hr', 'img', 'input', 'link', 'meta', 'param', 'embed', 'command', 'keygen', 'source', 'track', 'wbr', '!DOCTYPE'];
var ALLOW_INCLUDE_TAGS = ['style', 'script'];
var TemplateTokenizer = (function () {
    function TemplateTokenizer() {
    }
    TemplateTokenizer.prototype.render = function (content) {
        var reader = content instanceof iterator_1.CharIterator ? content : new iterator_1.CharIterator(content);
        reader.reset();
        return element_1.ElementToken.nodeElement('root', this.renderElement(reader));
    };
    TemplateTokenizer.prototype.renderElement = function (reader) {
        var items = [];
        while (reader.canNext) {
            var item = this.renderOneElement(reader);
            if (item === true) {
                break;
            }
            if (item) {
                items.push(item);
            }
        }
        return items;
    };
    TemplateTokenizer.prototype.renderOneElement = function (reader) {
        var code;
        while (reader.moveNext()) {
            code = reader.current;
            if ((0, util_1.isEmptyCode)(code)) {
                continue;
            }
            if (code !== '<') {
                reader.move(-1);
                return this.getTextElement(reader);
            }
            if (this.isNodeEnd(reader)) {
                return true;
            }
            if (this.isComment(reader)) {
                return this.getCommentElement(reader);
            }
            if (!this.isNodeBegin(reader)) {
                reader.move(-1);
                return this.getTextElement(reader);
            }
            return this.getElement(reader);
        }
        return false;
    };
    TemplateTokenizer.prototype.getElement = function (reader) {
        var tag = '';
        var attrs = {};
        var code;
        var status = ElementTokenType.TAG;
        var name = '';
        var value = '';
        var endAttr;
        while (reader.moveNext()) {
            code = reader.current;
            if ((code === '\n' || code === '\r') && (status === ElementTokenType.TAG || status === ElementTokenType.ATTR)) {
                code = ' ';
            }
            if (code === '>' && (status === ElementTokenType.TAG || status === ElementTokenType.ATTR)) {
                if (status === ElementTokenType.ATTR && name !== '') {
                    attrs[name] = true;
                    name = '';
                }
                if (exports.SINGLE_TAGS.indexOf(tag) >= 0) {
                    this.moveEndTag(reader, tag);
                    return element_1.ElementToken.noKid(tag.trim(), attrs);
                }
                var children = ALLOW_INCLUDE_TAGS.indexOf(tag) >= 0 ? this.parserSpecialText(reader, tag) : this.renderElement(reader);
                if (children.length < 1) {
                    return element_1.ElementToken.noKid(tag.trim(), attrs);
                }
                return element_1.ElementToken.create(tag.trim(), children, attrs);
            }
            if (code === '/') {
                if (status === ElementTokenType.ATTR || status === ElementTokenType.TAG) {
                    if (reader.nextIs('>')) {
                        reader.move();
                        break;
                    }
                    continue;
                }
                if (!endAttr && status === ElementTokenType.ATTR_VALUE) {
                    if (reader.nextIs('>')) {
                        status = ElementTokenType.NONE;
                        attrs[name] = value;
                        name = '';
                        value = '';
                        reader.move();
                        break;
                    }
                }
            }
            if (code === ' ') {
                if (status === ElementTokenType.TAG) {
                    status = ElementTokenType.ATTR;
                    name = '';
                    value = '';
                    continue;
                }
                if (status === ElementTokenType.ATTR) {
                    name = name.trim();
                    if (name.length > 0) {
                        status = ElementTokenType.ATTR;
                        attrs[name] = true;
                        name = '';
                    }
                    continue;
                }
                if (!endAttr && status === ElementTokenType.ATTR_VALUE) {
                    status = ElementTokenType.ATTR;
                    attrs[name] = value;
                    name = '';
                    value = '';
                    continue;
                }
            }
            if (status === ElementTokenType.TAG) {
                tag += code;
            }
            if (code === '=' && status === ElementTokenType.ATTR) {
                status = ElementTokenType.ATTR_VALUE;
                if (reader.nextIs('\'', '"')) {
                    reader.moveNext();
                    endAttr = reader.current;
                    continue;
                }
                endAttr = undefined;
                continue;
            }
            if (endAttr && code === endAttr && status === ElementTokenType.ATTR_VALUE) {
                if (this.backslashedCount(reader) % 2 === 0) {
                    status = ElementTokenType.TAG;
                    attrs[name] = value;
                    name = '';
                    value = '';
                    continue;
                }
                value += code;
                continue;
            }
            if (status === ElementTokenType.ATTR) {
                name += code;
                continue;
            }
            if (status === ElementTokenType.ATTR_VALUE) {
                value += code;
            }
        }
        return element_1.ElementToken.noKid(tag.trim(), attrs);
    };
    TemplateTokenizer.prototype.isNodeBegin = function (reader) {
        var status = ElementTokenType.TAG;
        var attrTag = '';
        var success = false;
        reader.each(function (code) {
            if (['\'', '"'].indexOf(code) >= 0) {
                if (status !== ElementTokenType.ATTR_VALUE) {
                    attrTag = code;
                    status = ElementTokenType.ATTR_VALUE;
                    return;
                }
                if (attrTag === code) {
                    status = ElementTokenType.TAG;
                    return;
                }
            }
            if (code === '>') {
                success = true;
                return false;
            }
            if (status !== ElementTokenType.ATTR_VALUE && code === '<') {
                return false;
            }
            return;
        });
        return success;
    };
    TemplateTokenizer.prototype.getNodeEndTag = function (reader, i) {
        var code;
        var tag = '';
        code = reader.readSeek(++i);
        if (code !== '/') {
            return false;
        }
        while (i < reader.length) {
            code = reader.readSeek(++i);
            if (code === '>') {
                return tag;
            }
            if (['<', '"', '\'', '(', ')', '{', '}', '='].indexOf(code) >= 0) {
                return false;
            }
            tag += code;
        }
        return false;
    };
    TemplateTokenizer.prototype.isNodeEnd = function (reader) {
        var tag = this.getNodeEndTag(reader, reader.position);
        if (typeof tag !== 'string') {
            return false;
        }
        reader.move(2 + tag.length);
        return true;
    };
    TemplateTokenizer.prototype.isComment = function (reader) {
        if (reader.read(4) !== '<!--') {
            return false;
        }
        return reader.indexOf('-->', 3) > 0;
    };
    TemplateTokenizer.prototype.getCommentElement = function (reader) {
        var start = reader.position + 4;
        var end = reader.indexOf('-->', 4);
        var text = reader.read(end - start, 4);
        reader.position = end + 2;
        return element_1.ElementToken.comment(text.trim());
    };
    TemplateTokenizer.prototype.getTextElement = function (reader) {
        var text = '';
        var code;
        while (reader.moveNext()) {
            code = reader.current;
            if (code === '<' && this.isNodeBegin(reader)) {
                reader.move(-1);
                break;
            }
            text += code;
        }
        if (text.length < 1) {
            return false;
        }
        return element_1.ElementToken.text(text.trim());
    };
    TemplateTokenizer.prototype.backslashedCount = function (reader) {
        return reader.reverseCount('\\');
    };
    TemplateTokenizer.prototype.moveEndTag = function (reader, tag) {
        var po = -1;
        reader.each(function (code, i) {
            if ((0, util_1.isEmptyCode)(code)) {
                return;
            }
            if (code === '<') {
                po = i;
                return false;
            }
            return;
        });
        if (po < 0) {
            return;
        }
        var endTag = this.getNodeEndTag(reader, po);
        if (typeof endTag !== 'string') {
            return;
        }
        if (endTag.trim() !== tag) {
            return;
        }
        reader.position = po + 2 + endTag.length;
    };
    TemplateTokenizer.prototype.parserSpecialText = function (reader, blockTag) {
        var text = '';
        var endTag = '';
        var code = '';
        while (reader.moveNext()) {
            code = reader.current;
            if (endTag.length > 0) {
                if (code === endTag && this.backslashedCount(reader) % 2 === 0) {
                    endTag = '';
                }
                text += code;
                continue;
            }
            if (code !== '<') {
                text += code;
                continue;
            }
            var tag = this.getNodeEndTag(reader, reader.position);
            if (tag !== blockTag) {
                text += code;
                continue;
            }
            reader.move(2 + tag.length);
            break;
        }
        if (text.length < 1) {
            return [];
        }
        return [element_1.ElementToken.text(text.trim())];
    };
    return TemplateTokenizer;
}());
exports.TemplateTokenizer = TemplateTokenizer;
