"use strict";
exports.__esModule = true;
var element_1 = require("./element");
exports.SINGLE_TAGS = ['area', 'base', 'basefont', 'br', 'col', 'frame', 'hr', 'img', 'input', 'link', 'meta', 'param', 'embed', 'command', 'keygen', 'source', 'track', 'wbr'];
var BLOCK_TYPE;
(function (BLOCK_TYPE) {
    BLOCK_TYPE[BLOCK_TYPE["NONE"] = 0] = "NONE";
    BLOCK_TYPE[BLOCK_TYPE["TAG"] = 1] = "TAG";
    BLOCK_TYPE[BLOCK_TYPE["ATTR"] = 2] = "ATTR";
    BLOCK_TYPE[BLOCK_TYPE["ATTR_VALUE"] = 3] = "ATTR_VALUE";
    BLOCK_TYPE[BLOCK_TYPE["END_TAG"] = 4] = "END_TAG";
})(BLOCK_TYPE || (BLOCK_TYPE = {}));
function htmlToJson(content) {
    var pos = -1, isNodeBegin = function () {
        var po = pos, code, status = BLOCK_TYPE.TAG, attrTag = '';
        while (po < content.length) {
            code = content.charAt(++po);
            if (['\'', '"'].indexOf(code) >= 0) {
                if (status !== BLOCK_TYPE.ATTR_VALUE) {
                    attrTag = code;
                    status = BLOCK_TYPE.ATTR_VALUE;
                    continue;
                }
                if (attrTag === code) {
                    status = BLOCK_TYPE.TAG;
                    continue;
                }
            }
            if (code === '>') {
                return true;
            }
            if (status !== BLOCK_TYPE.ATTR_VALUE && code === '<') {
                return false;
            }
        }
        return false;
    }, getNodeEndTag = function (i) {
        var code, tag = '';
        code = content.charAt(++i);
        if (code !== '/') {
            return false;
        }
        while (i < content.length) {
            code = content.charAt(++i);
            if (code === '>') {
                return tag;
            }
            if (['<', '"', '\'', '(', ')', '{', '}', '='].indexOf(code) >= 0) {
                return false;
            }
            tag += code;
        }
        return false;
    }, isNodeEnd = function () {
        var tag = getNodeEndTag(pos);
        if (typeof tag !== 'string') {
            return false;
        }
        pos += 2 + tag.length;
        return true;
    }, isComment = function () {
        if (content.substr(pos, 3) !== '!--') {
            return false;
        }
        return content.indexOf('-->', pos + 3) > 0;
    }, getCommentElement = function () {
        var start = pos + 3;
        var end = content.indexOf('-->', start);
        var text = content.substr(start, end - start);
        pos += end + 3;
        return element_1.Element.comment(text);
    }, getTextElement = function () {
        var text = '', code;
        while (pos < content.length) {
            code = content.charAt(++pos);
            if (code === '<' && isNodeBegin()) {
                pos--;
                break;
            }
            text += code;
        }
        if (text.length < 1) {
            return false;
        }
        return element_1.Element.text(text.trim());
    }, backslashedCount = function () {
        var po = pos, code, count = 0;
        while (po < content.length) {
            code = content.charAt(--po);
            if (code === '\\') {
                count++;
                continue;
            }
            return count;
        }
        return count;
    }, isEmpty = function (code) {
        return code === ' ' || code === "\r" || code === "\n" || code === "\t";
    }, moveEndTag = function (tag) {
        var po = pos, code;
        while (po < content.length) {
            code = content.charAt(++po);
            if (isEmpty(code)) {
                continue;
            }
            if (code === '<') {
                break;
            }
        }
        var endTag = getNodeEndTag(po);
        if (typeof endTag !== 'string') {
            return;
        }
        if (endTag.trim() !== tag) {
            return;
        }
        pos = po + 2 + endTag.length;
    }, getElement = function () {
        var tag = '', attrs = {}, code, status = BLOCK_TYPE.TAG, name = '', value = '', endAttr;
        while (pos < content.length) {
            code = content.charAt(++pos);
            if (code === '>' && (status === BLOCK_TYPE.TAG || status === BLOCK_TYPE.ATTR)) {
                if (status === BLOCK_TYPE.ATTR && name !== '') {
                    attrs[name] = true;
                    name = '';
                }
                if (exports.SINGLE_TAGS.indexOf(tag) >= 0) {
                    moveEndTag(tag);
                    return element_1.Element.noKid(tag.trim(), attrs);
                }
                var children = parserElements();
                if (children.length < 1) {
                    return element_1.Element.noKid(tag.trim(), attrs);
                }
                return element_1.Element.create(tag.trim(), children, attrs);
            }
            if (code === '/') {
                if (status === BLOCK_TYPE.ATTR || status === BLOCK_TYPE.TAG) {
                    if (content.charAt(pos + 1) === '>') {
                        pos++;
                        break;
                    }
                    continue;
                }
                if (!endAttr && status == BLOCK_TYPE.ATTR_VALUE) {
                    if (content.charAt(pos++) == '>') {
                        status = BLOCK_TYPE.NONE;
                        attrs[name] = value;
                        name = '';
                        value = '';
                        pos++;
                        break;
                    }
                }
            }
            if (code == ' ') {
                if (status === BLOCK_TYPE.TAG) {
                    status = BLOCK_TYPE.ATTR;
                    name = '';
                    value = '';
                    continue;
                }
                if (status == BLOCK_TYPE.ATTR) {
                    status = BLOCK_TYPE.ATTR;
                    attrs[name] = true;
                    name = '';
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
            if (code === '=' && status == BLOCK_TYPE.ATTR) {
                code = content.charAt(pos + 1);
                status = BLOCK_TYPE.ATTR_VALUE;
                if (code == '\'' || code == '"') {
                    endAttr = code;
                    pos++;
                    continue;
                }
                endAttr = undefined;
                continue;
            }
            if (endAttr && code === endAttr && status == BLOCK_TYPE.ATTR_VALUE) {
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
            if (status == BLOCK_TYPE.ATTR) {
                name += code;
                continue;
            }
            if (status == BLOCK_TYPE.ATTR_VALUE) {
                value += code;
            }
        }
        return element_1.Element.noKid(tag.trim(), attrs);
    }, parserElement = function () {
        var code;
        while (pos < content.length) {
            code = content.charAt(++pos);
            if (isEmpty(code)) {
                continue;
            }
            if (code !== '<') {
                pos--;
                return getTextElement();
            }
            if (isNodeEnd()) {
                return true;
            }
            if (isComment()) {
                return getCommentElement();
            }
            if (!isNodeBegin()) {
                pos--;
                return getTextElement();
            }
            return getElement();
        }
        return false;
    }, parserElements = function () {
        var items = [];
        while (pos < content.length) {
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
    return new element_1.Element('root', undefined, undefined, parserElements());
}
exports.htmlToJson = htmlToJson;
