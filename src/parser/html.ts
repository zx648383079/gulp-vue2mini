import { Element } from "./element";
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
 * @param content 
 */
export function htmlToJson(content: string): Element {
    let pos = -1,
    /**
     * 判断是否是标签的开始
     */
    isNodeBegin = function() {
        let po = pos, code: string, status = BLOCK_TYPE.TAG, attrTag: string = '';
        while (po < content.length) {
            code = content.charAt(++ po);
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
    },
    /**
     * 获取结束标签的tag, 可能包含空格
     */
    getNodeEndTag = function(i: number): string|boolean {
        let code: string, tag = '';
        code = content.charAt(++ i);
        if (code !== '/') {
            return false;
        }
        while (i < content.length) {
            code = content.charAt(++ i);
            if (code === '>') {
                return tag;
            }
            if (['<', '"', '\'', '(', ')', '{', '}', '='].indexOf(code) >= 0) {
                return false;
            }
            tag += code;
        }
        return false;
    },
    /**
     * 判断是否是结束标签，是则移动位置
     */
    isNodeEnd = function() {
        let tag = getNodeEndTag(pos);
        if (typeof tag !== 'string') {
            return false;
        }
        pos += 2 + tag.length;
        return true;
    },
    /**
     * 判断是否是评论
     */
    isComment = function() {
        if (content.substr(pos, 3) !== '!--') {
            return false;
        }
        return content.indexOf('-->', pos + 3) > 0;
    },
    /**
     * 获取评论元素，并移动位置
     */
    getCommentElement = function(): Element {
        let start = pos + 3;
        let end = content.indexOf('-->', start);
        let text = content.substr(start, end - start);
        pos += end + 3;
        return Element.comment(text);
    },
    /**
     * 获取文本元素，并移动位置
     */
    getTextElement = function(): Element | boolean {
        let text = '', code: string;
        while (pos < content.length) {
            code = content.charAt(++ pos);
            if (code  === '<' && isNodeBegin()) {
                pos --;
                break;
            }
            text += code;
        }
        if (text.length < 1) {
            return false;
        }
        return Element.text(text.trim());
    },
    /**
     * 向前获取 \ 的数量
     */
    backslashedCount = function() {
        let po = pos, code: string, count = 0;
        while (po < content.length) {
            code = content.charAt(-- po);
            if (code === '\\') {
                count ++;
                continue;
            }
            return count;
        }
        return count;
    },
    /**
     * 判断字符是否为空
     */
    isEmpty = function (code: string) {
        return code === ' ' || code === "\r" || code === "\n" || code === "\t";
    },
    /**
     * 移除为单标签的内容及结束符 例如 <br>123</br> 只获取 br 并移动位置忽略 123</br> 
     */
    moveEndTag = function(tag: string) {
        let po = pos, code: string;
        while (po < content.length) {
            code = content.charAt(++ po);
            if (isEmpty(code)) {
                continue;
            }
            if (code === '<') {
                break;
            }
        }
        let endTag = getNodeEndTag(po);
        if (typeof endTag !== 'string') {
            return;
        }
        if (endTag.trim() !== tag) {
            return;
        }
        pos = po + 2 + endTag.length;
    },
    /**
     * 获取元素
     */
    getElement = function(): Element {
        let tag = '', 
            attrs: {[key: string]: string| boolean} = {}, 
            code: string,
            status: BLOCK_TYPE = BLOCK_TYPE.TAG, 
            name: string = '', 
            value: string = '', 
            endAttr: string| undefined; // 属性的结束标记
        while (pos < content.length) {
            code = content.charAt(++ pos);
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
                    if (content.charAt(pos + 1) === '>') {
                        pos ++;
                        break;
                    }
                    continue;
                }
                if (!endAttr && status == BLOCK_TYPE.ATTR_VALUE) {
                    if (content.charAt(pos ++) == '>') {
                        status = BLOCK_TYPE.NONE;
                        attrs[name] = value;
                        name = '';
                        value = '';
                        pos ++;
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
            if (code === '=' && status == BLOCK_TYPE.ATTR) {
                code = content.charAt(pos + 1);
                status = BLOCK_TYPE.ATTR_VALUE;
                if (code == '\'' || code == '"') {
                    endAttr = code;
                    pos ++;
                    continue;
                }
                endAttr = undefined;
                continue;
            }
            if (endAttr && code === endAttr && status == BLOCK_TYPE.ATTR_VALUE) {
                //向前获取反斜杠的数量
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
        return Element.noKid(tag.trim(), attrs);
    },
    /**
     * 转化根据第一个非空字符获取元素
     */
    parserElement = function(): Element | boolean {
        let code: string;
        while (pos < content.length) {
            code = content.charAt(++pos);
            if (isEmpty(code)) {
                continue;
            }
            if (code !== '<') {
                pos --;
                return getTextElement();
            }
            if (isNodeEnd()) {
                return true;
            }
            if (isComment()) {
                return getCommentElement();
            }
            if (!isNodeBegin()) {
                pos --;
                return getTextElement();
            }
            return getElement();
        }
        return false;
    },
    /**
     * 获取特殊的内容
     */
    parserSpecialText = function(blockTag: string): Element[] {
        let text = '',
            endTag = '',
            code = '';
        while (pos < content.length) {
            code = content.charAt(++pos);
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
            let tag = getNodeEndTag(pos);
            if (tag !== blockTag) {
                text += code;
                continue;
            }
            pos += 2 + tag.length;
            break;
        }
        if (text.length < 1) {
            return [];
        }
        return [Element.text(text.trim())];
    },
    /**
     * 获取元素集合
     */
    parserElements = function () {
        let items: Element[] = [];
        while (pos < content.length) {
            let item = parserElement();
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
 * @param json 
 */
export function jsonToHtml(json: Element): string {
    return json.toString(Element.htmlCallback);
}