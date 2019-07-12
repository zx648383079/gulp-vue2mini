import * as fs from 'fs';
import * as path from 'path';
enum BLOCK_TYPE {
    NONE,
    TAG,
    ATTR,
    ATTR_VALUE,
    END_TAG
}

interface IElement {
    node: string,
    tag?: string,
    text?: string,
    children?: IElement[],
    attrs?: {[key: string]: string| boolean}
}

const LINE_SPLITE = "\r\n";

/**
 * html 转json
 * @param content 
 */
export function htmlToJson(content: string): IElement[] {
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
    getCommentElement = function(): IElement {
        let start = pos + 3;
        let end = content.indexOf('-->', start);
        let text = content.substr(start, end - start);
        pos += end + 3;
        return {node: 'comment', text};
    },
    /**
     * 获取文本元素，并移动位置
     */
    getTextElement = function(): IElement | boolean {
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
        return {node: 'text', text: text.trim()};
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
    getElement = function(): IElement {
        let tag = '', 
            attrs: {[key: string]: string| boolean} = {}, 
            code: string, 
            status: BLOCK_TYPE = BLOCK_TYPE.TAG, 
            name: string = '', 
            value: string = '', 
            endAttr: string| undefined; // 属性的结束标记
        while (pos < content.length) {
            code = content.charAt(++ pos);
            if (code === '>' && (status === BLOCK_TYPE.TAG || status === BLOCK_TYPE.ATTR)) {
                // 修复只有属性名就结算
                if (status === BLOCK_TYPE.ATTR && name !== '') {
                    attrs[name] = true;
                    name = '';
                }
                if (['area', 'base', 'basefont', 'br', 'col', 'frame', 'hr', 'img', 'input', 'link', 'meta', 'param', 'embed', 'command', 'keygen', 'source', 'track', 'wbr'].indexOf(tag) >= 0) {
                    // 排除可能结尾
                    moveEndTag(tag);
                    return {
                        node: 'element',
                        tag: tag.trim(),
                        attrs,
                    };
                }
                const children = parserElements();
                if (children.length < 1) {
                    return {
                        node: 'element',
                        tag: tag.trim(),
                        attrs,
                    }
                }
                return {
                    node: 'element',
                    tag: tag.trim(),
                    attrs,
                    children
                }
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
        return {
            node: 'element',
            tag: tag.trim(),
            attrs,
        };
    },
    /**
     * 转化根据第一个非空字符获取元素
     */
    parserElement = function(): IElement | boolean {
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
     * 获取元素集合
     */
    parserElements = function () {
        let items: IElement[] = [];
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
    return parserElements();
}
/**
 * json 转 wxml
 * @param json 
 */
export function jsonToWxml(json: IElement | IElement[], exclude: RegExp = /^.+[\-A-Z].+$/): string {
    if (json instanceof Array) {
        return json.map(item => {
            return jsonToWxml(item);
        }).join('');
    }
    if (json.node == 'text') {
        if (/^\s+$/.test(json.text + '')) {
            return '';
        }
        return `<text>${json.text}</text>`;
    }
    let child = json.children ? jsonToWxml(json.children) : '';
    const disallow_attrs: string[] = [],
        replace_attrs:{[key: string]: Function | string| boolean} = {
            'v-if': function(value: string) {
                return ['wx:if', '{{ ' +value + ' }}'];
            },
            'v-model': function(value: string) {
                return ['value', '{{' + value + '}}', `bind:input="${value}Changed"`];
            },
            'v-elseif': function(value: string) {
                return ['wx:elif', '{{ ' +value + ' }}'];
            },
            'v-else': 'wx:else',
            ':src': function(value: string) {
                return ['src', '{{ ' +value + ' }}'];
            },
            'v-bind:src': function(value: string) {
                return ['src', '{{ ' +value + ' }}'];
            },
            'v-for': function(value: string) {
                let index = 'index';
                let item = 'item';
                let match = value.match(/\(?([\w_]+)(,\s?([\w_]+)\))?\s+in\s+([\w_\.]+)/);
                if (match === null) {
                    return ['wx:for', '{{ ' +value + ' }}'];
                }
                if (match[3]) {
                    index = match[3];
                }
                item = match[1];
                return ['wx:for', '{{ ' + match[4] + ' }}', `wx:for-index="${index}" wx:for-item="${item}"`];
            },
            'v-show': function(value: string) {
                value = value.trim();
                if (value.charAt(0) == '!') {
                    value = value.substr(1);
                } else {
                    value = '!' + value;
                }
                return ['hidden', '{{ ' +value + ' }}'];
            },
            'href': 'url',
            ':key': false,
            '@click': 'bindtap',
            'v-on:click': 'bindtap',
            '(click)': 'bindtap',
            '@touchstart': 'bindtouchstart',
            '@touchmove': 'bindtouchmove',
            '@touchend': 'bindtouchend',
        };
    if (json.node === 'root') {
        return child;
    }

    if (json.node === 'comment') {
        return '<!--' + json.text + '-->';
    }

    if (json.node != 'element') {
        return child;
    }

    if(json.tag == 'img') {
        const attr = parseNodeAttr(json.attrs, 'image');
        return `<image${attr}></image>`
    }
    if (json.tag == 'input') {
        return parseInput(json);
    }
    if (json.tag == 'button') {
        return parseButton(json);
    }
    if (json.tag == 'form') {
        const attr = parseNodeAttr(json.attrs, json.tag);
        return `<form${attr}>${child}</form>`;
    }
    if (['slider', 'icon', 'progress', 'switch', 'radio', 'checkbox', 'live-player', 'live-pusher'].indexOf(json.tag + '') >= 0) {
        const attr = parseNodeAttr(json.attrs, json.tag);
        return `<${json.tag}${attr}/>`;
    }
    child = parseChildren(json);
    if (['label', 'slot', 'style', 
        'script', 'template', 'view', 'scroll-view', 'swiper', 'block', 
        'swiper-item', 'movable-area', 'movable-view', 'cover-view', 'video',
        'rich-text', 'picker', 'picker-view', 'picker-view-column', 'checkbox-group', 'radio-group', 'navigator', 'functional-page-navigator', 'audio', 'image', 'camera', 'map', 'canvas',
        'open-data', 'web-view', 'ad', 'official-account'
        ].indexOf(json.tag + '') >= 0) {
        const attr = parseNodeAttr(json.attrs, json.tag);
        return `<${json.tag}${attr}>${child}</${json.tag}>`;
    }
    if (json.tag == 'textarea') {
        json.attrs = Object.assign({}, json.attrs, {
            vlaue: child
        });
        const attr = parseNodeAttr(json.attrs, json.tag);
        return `<textarea${attr}/>`;
    }
    if (json.tag == 'a') {
        let attr = parseNodeAttr(json.attrs, 'navigator');
        return `<navigator${attr}>${child}</navigator>`;
    }
    if (['i', 'span', 'strong', 'font', 'em', 'b'].indexOf(json.tag + '') >= 0 
    && (!json.children || (json.children.length == 1 && json.children[0].node == 'text'))) {
        const attr = parseNodeAttr(json.attrs, 'text');
        return `<text${attr}>${child}</text>`;
    }
    const attr = parseNodeAttr(json.attrs);
    // 默认将有 - 分隔符或含大写的作为自定义部件
    if (json.tag && exclude.test(json.tag)) {
        return `<${json.tag}${attr}>${child}</${json.tag}>`;
    }
    return `<view${attr}>${child}</view>`;

    function q(v: any) {
        return '"' + v + '"';
    }
    function parseChildren(node: IElement) {
        if (!node.children) {
            return '';
        }
        if (node.children.length == 1 && node.children[0].node == 'text') {
            return node.children[0].text + '';
        }
        return jsonToWxml(node.children);
    }

    /**
     * 转化属性
     * @param attrs 
     * @param tag 
     */
    function parseNodeAttr(attrs?: any, tag: string = 'view'): string {
        let str = '';
        if (!attrs) {
            return str;
        }
        for (let key in attrs) {
            if (!attrs.hasOwnProperty(key)) {
                continue;
            }
            if (disallow_attrs.indexOf(key) >= 0) {
                continue;
            }
            let value = attrs[key];
            let ext = '';
            if (replace_attrs.hasOwnProperty(key)) {
                const attr: string|Function| boolean = replace_attrs[key];
                if (typeof attr === 'function') {
                    const args: string[] = attr(value, tag);
                    key = args[0];
                    value = args[1];
                    if (args.length > 2) {
                        ext = ' ' + args[2];
                    }
                } else if (typeof attr === 'boolean') {
                    continue;
                } else {
                    key = attr;
                }
            }
            if (!key || key.indexOf('@') > 0 
                || (key.charAt(0) === '@' && value === true)) {
                continue;
            }
            if (value === true) {
                str += ' ' + key + ext;
                continue; 
            }
            if (Array.isArray(value)) {
                value = value.join(' ');
            };
            if (key.charAt(0) === '@') {
                key = 'bind:' + key.substr(1);
                if (value.indexOf('(') > 0) {
                    value = value.substring(0, value.indexOf('(') - 1);
                }
            } else if (key.charAt(0) === ':') {
                key = key.substr(1);
                value = '{{ ' + value +' }}';
            }
            str += ' ' + key + '=' + q(value) + ext;
        }
        return str;
    }

    function parseButton(node: IElement): string {
        let attr = parseNodeAttr(node.attrs);
        if (node.attrs && ['reset', 'submit'].indexOf(node.attrs.type + '') >= 0) {
            attr += ' form-type='+ q(node.attrs.type);
        }
        let text = parseChildren(node);
        return `<button type="default"${attr}>${text}</button>`;
    }

    function parseInput(node: IElement) {
        if (!node.attrs) {
            node.attrs = {
                type:'text'
            };
        }
        if (node.attrs.type == 'password') {
            node.attrs.type = 'text';
            node.attrs.password = 'true';
        }
        if (['button', 'reset', 'submit'].indexOf(node.attrs.type + '') >= 0) {
            node.text = node.attrs.value + '';
            node.tag = 'button';
            return parseButton(node);
        }
        if (node.attrs.type == 'checkbox') {
            const attr = parseNodeAttr(node.attrs, node.attrs.type);
            return `<checkbox${attr}/>`
        }
        if (node.attrs.type == 'radio') {
            const attr = parseNodeAttr(node.attrs, node.attrs.type);
            return `<radio${attr}/>`
        }
        if (['text', 'number', 'idcard', 'digit'].indexOf(node.attrs.type + '') < 0) {
            node.attrs.type = 'text';
        }
        const attr = parseNodeAttr(node.attrs, 'input');
        return `<input${attr}/>`;
    }
}

export function htmlToWxml(content: string): string {
    // if (content.indexOf('<view') >= 0) {
    //     console.log('跳过。。。');
    //     return content;
    // }
    let elements = htmlToJson(content);
    return jsonToWxml(elements);
}

/**
 * 处理ts文件
 * @param content 
 */
export function parsePage(content: string): string {
    content = content.replace(/import.+?from\s+.+?\.vue["'];/, '')
    .replace(/import.+?from\s+.+?typings.+?;/, '').replace(/@WxJson\([\s\S]+?\)/, '');
    var match = content.match(/(export\s+(default\s+)?)?class\s+(\S+)\s+extends\s(WxPage|WxComponent)[^\s\{]+/);
    if (!match) {
        return content;
    }
    content = parseMethodToObject(content, {
        'methods': '@WxMethod',
        'lifetimes': '@WxLifeTime',
        'pageLifetimes': '@WxPageLifeTime',
    }).replace(match[0], 'class ' + match[3]);
    var reg = new RegExp('(Page|Component)\\(new\\s+'+ match[3]);
    if (reg.test(content)) {
        return content;
    }
    return content + LINE_SPLITE + (match[4].indexOf('Page') > 0 ? 'Page' : 'Component') + '(new '+ match[3] +'());';
}

export function parseJson(content: string, append: any): string| null {
    let match = content.match(/@WxJson(\([\s\S]+?\))/);
    if (!match) {
        return null;
    }
    return JSON.stringify(Object.assign({}, append, eval(match[1].trim())));
}

export function parseMethodToObject(content: string, maps: {[key: string]: string}): string {
    let str_count = function(search: string, line: string): number {
            return line.split(search).length - 1;
        }, get_tag = function(line: string) {
            for (const key in maps) {
                if (maps.hasOwnProperty(key) && line.indexOf(maps[key]) >= 0) {
                    return key;
                }
            }
            return;
        }, lines = content.split(LINE_SPLITE),
        num = 0, inMethod = 0, method: string | undefined, data: {[key: string]: any} = {}, block: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (inMethod === 0) {
            method = get_tag(line);
            if (!method) {
                continue;
            }
            num = 0;
            inMethod = 1;
            lines[i] = '';
            block = [];
            if (!data.hasOwnProperty(method)) {
                data[method] = {
                    i,
                    items: []
                }
            }
            continue;
        }
        if (inMethod < 1) {
            continue;
        }
        let leftNum = str_count('{', line);
        num += leftNum - str_count('}', line);
        if (inMethod === 1) {
            block.push(line.replace(/public\s/, ''));
            lines[i] = '';
            if (leftNum > 0) {
                if (num === 0) {
                    data[method + ''].items.push(block.join(LINE_SPLITE));
                    inMethod = 0;
                    continue;
                }
                inMethod = 2;
                continue;
            }
            continue;
        }
        block.push(line);
        lines[i] = '';
        if (num === 0) {
            data[method + ''].items.push(block.join(LINE_SPLITE));
            inMethod = 0;
            continue;
        }
    }
    for (const key in data) {
        if (!data.hasOwnProperty(key)) {
            continue;
        }
        let reg = new RegExp(key + '[^=\\{\\}\\(\\)]*=\\s*\\{');
        if (!reg.test(content)) {
            lines[data[key].i] = key + '={' + data[key].items.join(',') + '}';
            delete data[key];
        }
    }
    content = lines.join(LINE_SPLITE);
    for (const key in data) {
        if (!data.hasOwnProperty(key)) {
            continue;
        }
        let reg = new RegExp(key + '[^=\\{\\}\\(\\)]*=\\s*\\{');
        content = content.replace(reg, key + '={' + data[key].items.join(',') + ',');
    }
    return content;
}

/**
 * ttf文件 转 base64
 * @param file 
 */
export function ttfToBase64(file: string): string {
    const content = fs.readFileSync(file);
    return 'url(\'data:font/truetype;charset=utf-8;base64,'+ content.toString('base64') +'\') format(\'truetype\')';
}

/**
 * 替换字体使用
 * @param content 
 * @param folder 
 */
export function replaceTTF(content: string, folder: string): string {
    const reg = /@font-face\s*\{[^\{\}]+\}/g;
    let matches = content.match(reg);
    if (!matches || matches.length < 1) {
        return content;
    }
    const nameReg = /font-family:\s*[^;\{\}\(\)]+/;
    const ttfReg = /url\(\s*['"]?([^\(\)]+\.ttf)/;
    for (const macth of matches) {
        let nameMatch = macth.match(nameReg);
        if (!nameMatch) {
            continue;
        }
        let name = nameMatch[0];
        
        let ttfMatch = macth.match(ttfReg);
        if (!ttfMatch) {
            continue;
        }
        let ttf = ttfMatch[1];
        ttf = path.resolve(folder, ttf);
        ttf = ttfToBase64(ttf);
        content = content.replace(macth, `@font-face {
            ${name};
            src: ${ttf};
        }`);
    }
    return content;
}

export function preImport(content: string): string {
    let matches = content.match(/(@import.+;)/g);
    if (!matches || matches.length < 1) {
        return content;
    }
    for (const item of matches) {
        if (item.indexOf('.scss') < 0 && item.indexOf('.sass') < 0) {
            continue;
        }
        content = content.replace(item, '/** parser['+ item +']parser **/');
    }
    return content;
}

export function endImport(content: string): string {
    let matches = content.match(/\/\*\*\s{0,}parser\[(@.+)\]parser\s{0,}\*\*\//g);
    if (!matches || matches.length < 1) {
        return content;
    }
    for (const item of matches) {
        content = content.replace(item[0], item[1].replace('.scss', '.wxss').replace('.sass', '.wxss').replace('/src/', '/'));
    }
    return content;
}
