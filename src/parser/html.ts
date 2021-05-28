import { Element } from './element';
import { CharIterator } from './iterator';
/**
 * 单标签
 */
export const SINGLE_TAGS = ['area', 'base', 'basefont', 'br', 'col', 'frame', 'hr', 'img', 'input', 'link', 'meta', 'param', 'embed', 'command', 'keygen', 'source', 'track', 'wbr', '!DOCTYPE'];
/**
 * 不进行深入解析的标签
 */
const ALLOW_INCLUDE_TAGS = ['style', 'script'];

enum BLOCK_TYPE {
    NONE,
    TAG,
    ATTR,
    ATTR_VALUE,
    END_TAG
}

/**
 * html 转json
 * @param content 内容
 */
export function htmlToJson(content: string): Element {
    const reader = new CharIterator(content);
    /**
     * 判断是否是标签的开始
     */
    const isNodeBegin = () => {
        let status = BLOCK_TYPE.TAG;
        let attrTag = '';
        let success = false;
        reader.each(code => {
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
    /**
     * 获取结束标签的tag, 可能包含空格
     */
    const getNodeEndTag = (i: number): string|boolean => {
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
    };
    /**
     * 判断是否是结束标签，是则移动位置
     */
    const isNodeEnd = () => {
        const tag = getNodeEndTag(reader.index);
        if (typeof tag !== 'string') {
            return false;
        }
        reader.move(2 + tag.length);
        return true;
    };
    /**
     * 判断是否是评论
     */
    const isComment = () => {
        if (reader.read(4) !== '<!--') {
            return false;
        }
        return reader.indexOf('-->', 3) > 0;
    };
    /**
     * 获取评论元素，并移动位置
     */
    const getCommentElement = (): Element => {
        const start = reader.index + 4;
        const end = reader.indexOf('-->', 4);
        const text = reader.read(end - start, 4) as string;
        reader.index = end + 2;
        return Element.comment(text.trim());
    };
    /**
     * 获取文本元素，并移动位置
     */
    const getTextElement = (): Element | boolean => {
        let text = '';
        let code: string;
        while (reader.canNext) {
            code = reader.next() as string;
            if (code === '<' && isNodeBegin()) {
                reader.move(-1);
                break;
            }
            text += code;
        }
        if (text.length < 1) {
            return false;
        }
        return Element.text(text.trim());
    };
    /**
     * 向前获取 \ 的数量
     */
    const backslashedCount = () => {
        let count = 0;
        reader.reverse(code => {
            if (code !== '\\') {
                return false;
            }
            count ++;
            return;
        });
        return count;
    };
    /**
     * 判断字符是否为空
     */
    const isEmpty = (code: string) => {
        return code === ' ' || code === '\r' || code === '\n' || code === '\t';
    };
    /**
     * 移除为单标签的内容及结束符 例如 <br>123</br> 只获取 br 并移动位置忽略 123</br>
     */
    const moveEndTag = (tag: string) => {
        let po = -1;
        reader.each((code, i) => {
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
        const endTag = getNodeEndTag(po);
        if (typeof endTag !== 'string') {
            return;
        }
        if (endTag.trim() !== tag) {
            return;
        }
        reader.index = po + 2 + endTag.length;
    };
    /**
     * 获取元素
     */
    const getElement = (): Element => {
        let tag = '';
        const attrs: {[key: string]: string| boolean} = {};
        let code: string;
        let status: BLOCK_TYPE = BLOCK_TYPE.TAG;
        let name = '';
        let value = '';
        let endAttr: string| undefined; // 属性的结束标记
        while (reader.canNext) {
            code = reader.next() as string;
            if ((code === '\n' || code === '\r') && (status === BLOCK_TYPE.TAG || status === BLOCK_TYPE.ATTR)) {
                code = ' ';
            }
            if (code === '>' && (status === BLOCK_TYPE.TAG || status === BLOCK_TYPE.ATTR)) {
                // 修复只有属性名就结算
                if (status === BLOCK_TYPE.ATTR && name !== '') {
                    attrs[name] = true;
                    name = '';
                }
                if (SINGLE_TAGS.indexOf(tag) >= 0) {
                    // 排除可能结尾
                    moveEndTag(tag);
                    return Element.noKid(tag.trim(), attrs);
                }
                const children = ALLOW_INCLUDE_TAGS.indexOf(tag) >= 0 ? parserSpecialText(tag) : parserElements();
                if (children.length < 1) {
                    return Element.noKid(tag.trim(), attrs);
                }
                return Element.create(tag.trim(), children, attrs);
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
                    // 修复为空的属性名
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
                // 向前获取反斜杠的数量
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
        return Element.noKid(tag.trim(), attrs);
    };
    /**
     * 转化根据第一个非空字符获取元素
     */
    const parserElement = (): Element | boolean => {
        let code: string;
        while (reader.canNext) {
            code = reader.next() as string;
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
    /**
     * 获取特殊的内容
     */
    const parserSpecialText = (blockTag: string): Element[] => {
        let text = '';
        let endTag = '';
        let code = '';
        while (reader.canNext) {
            code = reader.next() as string;
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
            const tag = getNodeEndTag(reader.index);
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
        return [Element.text(text.trim())];
    };
    /**
     * 获取元素集合
     */
    const parserElements = () => {
        const items: Element[] = [];
        while (reader.canNext) {
            const item = parserElement();
            if (item === true) {
                break;
            }
            if (item) {
                items.push(item);
            }
        }
        return items;
    };
    return Element.nodeElement('root', parserElements());
}

/**
 * 还原成html
 * @param json 标签数据
 */
export function jsonToHtml(json: Element, indent: string = ''): string {
    return json.toString(Element.htmlBeautify(indent));
}
