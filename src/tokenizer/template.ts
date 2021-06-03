import { CharIterator } from '../iterator';
import { isEmptyCode } from '../util';
import { Tokenizer } from './base';
import { ElementToken } from './element';

enum ElementTokenType {
    NONE,
    TAG,
    ATTR,
    ATTR_VALUE,
    END_TAG
}

/**
 * 单标签
 */
 export const SINGLE_TAGS = ['area', 'base', 'basefont', 'br', 'col', 'frame', 'hr', 'img', 'input', 'link', 'meta', 'param', 'embed', 'command', 'keygen', 'source', 'track', 'wbr', '!DOCTYPE'];
 /**
  * 不进行深入解析的标签
  */
 const ALLOW_INCLUDE_TAGS = ['style', 'script'];

export class TemplateTokenizer implements Tokenizer<string|CharIterator, ElementToken> {
    
    public render(content: string|CharIterator): ElementToken {
        const reader = content instanceof CharIterator ? content : new CharIterator(content);
        reader.reset();
        return ElementToken.nodeElement('root', this.renderElement(reader));
    }

    private renderElement(reader: CharIterator): ElementToken[] {
        const items: ElementToken[] = [];
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

    private renderOneElement(reader: CharIterator) {
        let code: string;
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

    private getElement(reader: CharIterator): ElementToken {
        let tag = '';
        const attrs: {[key: string]: string| boolean} = {};
        let code: string;
        let status: ElementTokenType = ElementTokenType.TAG;
        let name = '';
        let value = '';
        let endAttr: string| undefined; // 属性的结束标记
        while (reader.moveNext()) {
            code = reader.current;
            if ((code === '\n' || code === '\r') && (status === ElementTokenType.TAG || status === ElementTokenType.ATTR)) {
                code = ' ';
            }
            if (code === '>' && (status === ElementTokenType.TAG || status === ElementTokenType.ATTR)) {
                // 修复只有属性名就结算
                if (status === ElementTokenType.ATTR && name !== '') {
                    attrs[name] = true;
                    name = '';
                }
                if (SINGLE_TAGS.indexOf(tag) >= 0) {
                    // 排除可能结尾
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
                    // 修复为空的属性名
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
                    reader.moveNext()
                    endAttr = reader.current;
                    continue;
                }
                endAttr = undefined;
                continue;
            }
            if (endAttr && code === endAttr && status === ElementTokenType.ATTR_VALUE) {
                // 向前获取反斜杠的数量
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

    /**
     * 判断是否是标签的开始
     * @param reader 
     * @returns 
     */
    private isNodeBegin(reader: CharIterator) {
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

    /**
     * 获取结束标签的tag, 可能包含空格
     * @param reader 
     * @param i 
     * @returns 
     */
    private getNodeEndTag(reader: CharIterator, i: number): string|boolean {
        let code: string;
        let tag = '';
        code = reader.readSeek(++ i) as string;
        if (code !== '/') {
            return false;
        }
        while (i < reader.length) {
            code = reader.readSeek(++ i) as string;
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

    /**
     * 判断是否是结束标签，是则移动位置
     * @param reader 
     * @returns 
     */
    private isNodeEnd(reader: CharIterator) {
        const tag = this.getNodeEndTag(reader, reader.position);
        if (typeof tag !== 'string') {
            return false;
        }
        reader.move(2 + tag.length);
        return true;
    }

    /**
     * 判断是否是评论
     * @param reader 
     * @returns 
     */
    private isComment(reader: CharIterator) {
        if (reader.read(4) !== '<!--') {
            return false;
        }
        return reader.indexOf('-->', 3) > 0;
    }

    /**
     * 获取评论元素，并移动位置
     * @returns 
     */
    private getCommentElement(reader: CharIterator): ElementToken {
        const start = reader.position + 4;
        const end = reader.indexOf('-->', 4);
        const text = reader.read(end - start, 4) as string;
        reader.position = end + 2;
        return ElementToken.comment(text.trim());
    }

    /**
     * 获取文本元素，并移动位置
     * @param reader 
     * @returns 
     */
    private getTextElement(reader: CharIterator): ElementToken | boolean {
        let text = '';
        let code: string;
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

    /**
     * 向前获取 \ 的数量
     * @returns 
     */
    private backslashedCount(reader: CharIterator) {
        return reader.reverseCount('\\');
    }

    /**
     * 移除为单标签的内容及结束符 例如 <br>123</br> 只获取 br 并移动位置忽略 123</br>
     * @param reader 
     * @param tag 
     * @returns 
     */
    private moveEndTag(reader: CharIterator, tag: string) {
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

    private parserSpecialText(reader: CharIterator, blockTag: string): ElementToken[] {
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
