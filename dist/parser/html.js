"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonToHtml = exports.htmlToJson = exports.SINGLE_TAGS = void 0;
var element_1 = require("./element");
var iterator_1 = require("./iterator");
exports.SINGLE_TAGS = ['area', 'base', 'basefont', 'br', 'col', 'frame', 'hr', 'img', 'input', 'link', 'meta', 'param', 'embed', 'command', 'keygen', 'source', 'track', 'wbr', '!DOCTYPE'];
var ALLOW_INCLUDE_TAGS = ['style', 'script'];
var BLOCK_TYPE;
(function (BLOCK_TYPE) {
    BLOCK_TYPE[BLOCK_TYPE["NONE"] = 0] = "NONE";
    BLOCK_TYPE[BLOCK_TYPE["TAG"] = 1] = "TAG";
    BLOCK_TYPE[BLOCK_TYPE["ATTR"] = 2] = "ATTR";
    BLOCK_TYPE[BLOCK_TYPE["ATTR_VALUE"] = 3] = "ATTR_VALUE";
    BLOCK_TYPE[BLOCK_TYPE["END_TAG"] = 4] = "END_TAG";
})(BLOCK_TYPE || (BLOCK_TYPE = {}));
function htmlToJson(content) {
    var reader = new iterator_1.CharIterator(content);
    var isNodeBegin = function () {
        var status = BLOCK_TYPE.TAG;
        var attrTag = '';
        var success = false;
        reader.each(function (code) {
            if (['\'', '"'].indexOf(code) >= 0) {
                if (status !== BLOCK_TYPE.ATTR_VALUE) {
                    attrTag = code;
                    status = BLOCK_TYPE.ATTR_VALUE;
                    return;
                }
                if (attrTag === code) {
                    status = BLOCK_TYPE.TAG;
                    return;
                }
            }
            if (code === '>') {
                success = true;
                return false;
            }
            if (status !== BLOCK_TYPE.ATTR_VALUE && code === '<') {
                return false;
            }
            return;
        });
        return success;
    };
    var getNodeEndTag = function (i) {
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
    var isNodeEnd = function () {
        var tag = getNodeEndTag(reader.index);
        if (typeof tag !== 'string') {
            return false;
        }
        reader.move(2 + tag.length);
        return true;
    };
    var isComment = function () {
        if (reader.read(4) !== '<!--') {
            return false;
        }
        return reader.indexOf('-->', 3) > 0;
    };
    var getCommentElement = function () {
        var start = reader.index + 4;
        var end = reader.indexOf('-->', 4);
        var text = reader.read(end - start, 4);
        reader.index = end + 2;
        return element_1.Element.comment(text.trim());
    };
    var getTextElement = function () {
        var text = '';
        var code;
        while (reader.canNext) {
            code = reader.next();
            if (code === '<' && isNodeBegin()) {
                reader.move(-1);
                break;
            }
            text += code;
        }
        if (text.length < 1) {
            return false;
        }
        return element_1.Element.text(text.trim());
    };
    var backslashedCount = function () {
        var count = 0;
        reader.reverse(function (code) {
            if (code !== '\\') {
                return false;
            }
            count++;
            return;
        });
        return count;
    };
    var isEmpty = function (code) {
        return code === ' ' || code === '\r' || code === '\n' || code === '\t';
    };
    var moveEndTag = function (tag) {
        var po = -1;
        reader.each(function (code, i) {
            if (isEmpty(code)) {
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
        var endTag = getNodeEndTag(po);
        if (typeof endTag !== 'string') {
            return;
        }
        if (endTag.trim() !== tag) {
            return;
        }
        reader.index = po + 2 + endTag.length;
    };
    var getElement = function () {
        var tag = '';
        var attrs = {};
        var code;
        var status = BLOCK_TYPE.TAG;
        var name = '';
        var value = '';
        var endAttr;
        while (reader.canNext) {
            code = reader.next();
            if ((code === '\n' || code === '\r') && (status === BLOCK_TYPE.TAG || status === BLOCK_TYPE.ATTR)) {
                code = ' ';
            }
            if (code === '>' && (status === BLOCK_TYPE.TAG || status === BLOCK_TYPE.ATTR)) {
                if (status === BLOCK_TYPE.ATTR && name !== '') {
                    attrs[name] = true;
                    name = '';
                }
                if (exports.SINGLE_TAGS.indexOf(tag) >= 0) {
                    moveEndTag(tag);
                    return element_1.Element.noKid(tag.trim(), attrs);
                }
                var children = ALLOW_INCLUDE_TAGS.indexOf(tag) >= 0 ? parserSpecialText(tag) : parserElements();
                if (children.length < 1) {
                    return element_1.Element.noKid(tag.trim(), attrs);
                }
                return element_1.Element.create(tag.trim(), children, attrs);
            }
            if (code === '/') {
                if (status === BLOCK_TYPE.ATTR || status === BLOCK_TYPE.TAG) {
                    if (reader.nextIs('>')) {
                        reader.move();
                        break;
                    }
                    continue;
                }
                if (!endAttr && status === BLOCK_TYPE.ATTR_VALUE) {
                    if (reader.nextIs('>')) {
                        status = BLOCK_TYPE.NONE;
                        attrs[name] = value;
                        name = '';
                        value = '';
                        reader.move();
                        break;
                    }
                }
            }
            if (code === ' ') {
                if (status === BLOCK_TYPE.TAG) {
                    status = BLOCK_TYPE.ATTR;
                    name = '';
                    value = '';
                    continue;
                }
                if (status === BLOCK_TYPE.ATTR) {
                    name = name.trim();
                    if (name.length > 0) {
                        status = BLOCK_TYPE.ATTR;
                        attrs[name] = true;
                        name = '';
                    }
                    continue;
                }
                if (!endAttr && status === BLOCK_TYPE.ATTR_VALUE) {
                    status = BLOCK_TYPE.ATTR;
                    attrs[name] = value;
                    name = '';
                    value = '';
                    continue;
                }
            }
            if (status === BLOCK_TYPE.TAG) {
                tag += code;
            }
            if (code === '=' && status === BLOCK_TYPE.ATTR) {
                status = BLOCK_TYPE.ATTR_VALUE;
                if (reader.nextIs('\'', '"')) {
                    endAttr = reader.next();
                    continue;
                }
                endAttr = undefined;
                continue;
            }
            if (endAttr && code === endAttr && status === BLOCK_TYPE.ATTR_VALUE) {
                if (backslashedCount() % 2 === 0) {
                    status = BLOCK_TYPE.TAG;
                    attrs[name] = value;
                    name = '';
                    value = '';
                    continue;
                }
                value += code;
                continue;
            }
            if (status === BLOCK_TYPE.ATTR) {
                name += code;
                continue;
            }
            if (status === BLOCK_TYPE.ATTR_VALUE) {
                value += code;
            }
        }
        return element_1.Element.noKid(tag.trim(), attrs);
    };
    var parserElement = function () {
        var code;
        while (reader.canNext) {
            code = reader.next();
            if (isEmpty(code)) {
                continue;
            }
            if (code !== '<') {
                reader.move(-1);
                return getTextElement();
            }
            if (isNodeEnd()) {
                return true;
            }
            if (isComment()) {
                return getCommentElement();
            }
            if (!isNodeBegin()) {
                reader.move(-1);
                return getTextElement();
            }
            return getElement();
        }
        return false;
    };
    var parserSpecialText = function (blockTag) {
        var text = '';
        var endTag = '';
        var code = '';
        while (reader.canNext) {
            code = reader.next();
            if (endTag.length > 0) {
                if (code === endTag && backslashedCount() % 2 === 0) {
                    endTag = '';
                }
                text += code;
                continue;
            }
            if (code !== '<') {
                text += code;
                continue;
            }
            var tag = getNodeEndTag(reader.index);
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
        return [element_1.Element.text(text.trim())];
    };
    var parserElements = function () {
        var items = [];
        while (reader.canNext) {
            var item = parserElement();
            if (item === true) {
                break;
            }
            if (item) {
                items.push(item);
            }
        }
        return items;
    };
    return element_1.Element.nodeElement('root', parserElements());
}
exports.htmlToJson = htmlToJson;
function jsonToHtml(json, indent) {
    if (indent === void 0) { indent = ''; }
    return json.toString(element_1.Element.htmlBeautify(indent));
}
exports.jsonToHtml = jsonToHtml;
