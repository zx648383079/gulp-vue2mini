import { CharIterator } from '../iterator';
import { isEmptyCode } from '../util';
import { ElementToken } from './element';
var ElementTokenType;
(function (ElementTokenType) {
    ElementTokenType[ElementTokenType["NONE"] = 0] = "NONE";
    ElementTokenType[ElementTokenType["TAG"] = 1] = "TAG";
    ElementTokenType[ElementTokenType["ATTR"] = 2] = "ATTR";
    ElementTokenType[ElementTokenType["ATTR_VALUE"] = 3] = "ATTR_VALUE";
    ElementTokenType[ElementTokenType["END_TAG"] = 4] = "END_TAG";
})(ElementTokenType || (ElementTokenType = {}));
export const SINGLE_TAGS = ['area', 'base', 'basefont', 'br', 'col', 'frame', 'hr', 'img', 'input', 'link', 'meta', 'param', 'embed', 'command', 'keygen', 'source', 'track', 'wbr', '!DOCTYPE'];
const ALLOW_INCLUDE_TAGS = ['style', 'script'];
export class TemplateTokenizer {
    render(content) {
        const reader = content instanceof CharIterator ? content : new CharIterator(content);
        reader.reset();
        return ElementToken.nodeElement('root', this.renderElement(reader));
    }
    renderElement(reader) {
        const items = [];
        while (reader.canNext) {
            const item = this.renderOneElement(reader);
            if (item === true) {
                break;
            }
            if (item) {
                items.push(item);
            }
        }
        return items;
    }
    renderOneElement(reader) {
        let code;
        while (reader.moveNext()) {
            code = reader.current;
            if (isEmptyCode(code)) {
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
    }
    getElement(reader) {
        let tag = '';
        const attrs = {};
        let code;
        let status = ElementTokenType.TAG;
        let name = '';
        let value = '';
        let endAttr;
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
                if (SINGLE_TAGS.indexOf(tag) >= 0) {
                    this.moveEndTag(reader, tag);
                    return ElementToken.noKid(tag.trim(), attrs);
                }
                const children = ALLOW_INCLUDE_TAGS.indexOf(tag) >= 0 ? this.parserSpecialText(reader, tag) : this.renderElement(reader);
                if (children.length < 1) {
                    return ElementToken.noKid(tag.trim(), attrs);
                }
                return ElementToken.create(tag.trim(), children, attrs);
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
        return ElementToken.noKid(tag.trim(), attrs);
    }
    isNodeBegin(reader) {
        let status = ElementTokenType.TAG;
        let attrTag = '';
        let success = false;
        reader.each(code => {
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
    }
    getNodeEndTag(reader, i) {
        let code;
        let tag = '';
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
    }
    isNodeEnd(reader) {
        const tag = this.getNodeEndTag(reader, reader.position);
        if (typeof tag !== 'string') {
            return false;
        }
        reader.move(2 + tag.length);
        return true;
    }
    isComment(reader) {
        if (reader.read(4) !== '<!--') {
            return false;
        }
        return reader.indexOf('-->', 3) > 0;
    }
    getCommentElement(reader) {
        const start = reader.position + 4;
        const end = reader.indexOf('-->', 4);
        const text = reader.read(end - start, 4);
        reader.position = end + 2;
        return ElementToken.comment(text.trim());
    }
    getTextElement(reader) {
        let text = '';
        let code;
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
        return ElementToken.text(text.trim());
    }
    backslashedCount(reader) {
        return reader.reverseCount('\\');
    }
    moveEndTag(reader, tag) {
        let po = -1;
        reader.each((code, i) => {
            if (isEmptyCode(code)) {
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
        const endTag = this.getNodeEndTag(reader, po);
        if (typeof endTag !== 'string') {
            return;
        }
        if (endTag.trim() !== tag) {
            return;
        }
        reader.position = po + 2 + endTag.length;
    }
    parserSpecialText(reader, blockTag) {
        let text = '';
        let endTag = '';
        let code = '';
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
            const tag = this.getNodeEndTag(reader, reader.position);
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
        return [ElementToken.text(text.trim())];
    }
}
