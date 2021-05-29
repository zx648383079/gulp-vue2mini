import { htmlToJson } from '../html';
import { Element } from '../element';
import { Attribute } from '../attribute';

/**
 * 获取tpl提取的方法
 */
export let wxmlFunc: string[] = [];

enum FuncType {
    BIND,
    TAP,
    CONVERTER,
    FUNC,
}

interface IConverterFunc {
    [name: string]: {
        type: FuncType,
        properties?: any[];
        append?: string[];
        amount?: number;
    };
}

type REPLACE_FUNC = (value: any, tag: string, attrs: Attribute) => void;

/**
 * 生成input 绑定值方法
 * @param name 方法名
 * @param property 属性名
 */
function createInputFunc(name: string, property: string, append: string[] = []): string {
    const line = append.join('');
    return `    ${name}(event: InputEvent) {
        let data = this.data;
        data.${property} = event.detail.value;${line}
        this.setData(data);
    }`;
}
/**
 * 生成tap点击方法
 * @param name 方法名
 * @param property 属性名
 * @param val 参数名
 */
function createTapFunc(name: string, property: string, val: string): string {
    return `    ${name}(e: TouchEvent) {
        let data = this.data;
        data.${property} = e.currentTarget.dataset.${val};
        this.setData(data);
    }`;
}
/**
 * 生成直接传多个值func
 * @param name 方法名
 * @param target 目标方法
 * @param args 值
 */
function createTapCoverterFunc(name: string, target: string, args: string[]): string {
    const lines: string[] = [];
    args.forEach(item => {
        lines.push('e.currentTarget.dataset.' + item);
    });
    lines.push('e');
    const line = lines.join(', ');
    return `    ${name}(e: TouchEvent) {
        this.${target}(${line});
    }`;
}
/**
 * 首字母大写
 */
export function firstUpper(val: string): string {
    if (!val) {
        return '';
    }
    val = val.trim();
    if (val.length < 1) {
        return '';
    }
    if (val.length === 1) {
        return val.toUpperCase();
    }
    return val.substring(0, 1).toUpperCase() + val.substring(1);
}

/**
 * 转化成驼峰
 * @param val 字符串
 * @param isFirstUpper 第一个字母是否大写
 */
export function studly(val: string, isFirstUpper: boolean = true): string {
    if (!val || val.length < 1) {
        return '';
    }
    const items: string[] = [];
    val.split(/[\.\s_-]+/).forEach(item => {
        if (item.length < 1) {
            return;
        }
        if (!isFirstUpper && items.length < 1) {
            items.push(item);
            return;
        }
        items.push(firstUpper(item));
    });
    return items.join('');
}

/**
 * json 转 wxml
 * @param json 页面json
 */
export function jsonToWxml(json: Element, exclude: RegExp = /^(.+[\-A-Z].+|[A-Z].+)$/): string {
    wxmlFunc = [];
    const existFunc: IConverterFunc = {};
    const disallowAttrs: string[] = [];
    const replaceAttrs: {
        [key: string]: REPLACE_FUNC | string| boolean
    } = {
            'v-if': (value: string, _, attrs: Attribute) => {
                attrs.set('wx:if', '{{ ' + value + ' }}');
            },
            'v-model': (value: string, tag: string, attrs: Attribute) => {
                const func = studly(value, false) + 'Changed';
                if (!Object.prototype.hasOwnProperty.call(existFunc, func)) {
                    existFunc[func] = {
                        type: FuncType.BIND,
                        properties: [value],
                    };
                }
                const getFunc = (keys: string[]) => {
                    const args: string[] = [];
                    for (const key of keys) {
                        const val = attrs.get(key) as string;
                        if (!val) {
                            continue;
                        }
                        converterTap(val, key, attrs);
                        args.push('this.' + attrs.get(key) + '(e);');
                        attrs.delete(key);
                    }
                    return args;
                };
                let inputFunc: string;
                let append: string[];
                if (['picker', 'switch', 'slider'].indexOf(tag) >= 0) {
                    inputFunc = 'bindchange';
                    append = getFunc([inputFunc, '@change']);
                } else {
                    inputFunc = 'bindinput';
                    append = getFunc([inputFunc, 'bind:input', '@input']);
                }
                existFunc[func].append = append;
                attrs.set('value', '{{' + value + '}}');
                attrs.set(inputFunc, func);
            },
            'v-elseif': (value: string, _, attrs: Attribute) => {
                attrs.set('wx:elif', '{{ ' + value + ' }}');
            },
            'v-else': 'wx:else',
            ':src': converterSrc,
            ':class': converterClass,
            'v-bind:class': converterClass,
            'v-bind:src': converterSrc,
            'v-for': (value: string, _, attrs: Attribute) => {
                let index = 'index';
                let item = 'item';
                const match = value.match(/\(?([\w_]+)(,\s?([\w_]+)\))?\s+in\s+([\w_\.]+)/);
                if (match === null) {
                    attrs.set('wx:for', '{{ ' + value + ' }}');
                    return;
                }
                if (match[3]) {
                    index = match[3];
                }
                item = match[1];
                attrs.set('wx:for', '{{ ' + match[4] + ' }}').set('wx:for-index', index).set('wx:for-item', item);
            },
            'v-show': (value: string, _, attrs: Attribute) => {
                attrs.set('hidden', '{{ ' + invertIf(value) + ' }}');
            },
            href: 'url',
            ':key': false,
            '@click': (value: any, _: string, attrs: Attribute) => {
                converterTap(value, 'bindtap', attrs);
            },
            '@click.stop': (value: any, _: string, attrs: Attribute) => {
                if (typeof value === 'string') {
                    converterTap(value, 'catchtap', attrs);
                    return;
                }
                const func = 'catchTaped';
                if (!Object.prototype.hasOwnProperty.call(existFunc, func)) {
                    existFunc[func] = {
                        type: FuncType.FUNC,
                    };
                }
                attrs.set('catchtap', func);
            },
            'v-on:click': (value: any, _: string, attrs: Attribute) => {
                converterTap(value, 'bindtap', attrs);
            },
            '(click)': (value: any, _: string, attrs: Attribute) => {
                converterTap(value, 'bindtap', attrs);
            },
            '@touchstart': (value: any, _: string, attrs: Attribute) => {
                converterTap(value, 'bindtouchstart', attrs);
            },
            '@touchmove': (value: any, _: string, attrs: Attribute) => {
                converterTap(value, 'bindtouchmove', attrs);
            },
            '@touchend': (value: any, _: string, attrs: Attribute) => {
                converterTap(value, 'bindtouchend', attrs);
            },
        };
    const content = json.toString((item, nextStr) => {
        if (item.node === 'root') {
            return nextStr;
        }
        if (item.node === 'text') {
            if (/^\s+$/.test(item.text + '')) {
                return '';
            }
            return `<text>${item.text}</text>`;
        }
        if (item.node === 'comment') {
            return `<!-- ${item.text} -->`;
        }
        if (item.node !== 'element') {
            return nextStr;
        }
        if (item.tag === 'img') {
            const attrs = parseNodeAttr(item.attribute, 'image');
            return `<image${attrs}></image>`;
        }
        if (item.tag === 'input') {
            return parseInput(item);
        }
        if (item.tag === 'button') {
            return parseButton(item, nextStr);
        }
        if (item.tag === 'form') {
            const attrs = parseNodeAttr(item.attribute, item.tag);
            return `<form${attrs}>${nextStr}</form>`;
        }
        if (['slider', 'icon', 'progress', 'switch', 'radio', 'checkbox', 'live-player', 'live-pusher'].indexOf(item.tag + '') >= 0) {
            const attrs = parseNodeAttr(item.attribute, item.tag);
            return `<${item.tag}${attrs}/>`;
        }
        if (['label', 'slot', 'style', 'text',
            'script', 'template', 'view', 'scroll-view', 'swiper', 'block',
            'swiper-item', 'movable-area', 'movable-view', 'cover-view', 'video',
            'rich-text', 'picker', 'picker-view', 'picker-view-column', 'checkbox-group', 'radio-group', 'editor', 'navigator', 'functional-page-navigator', 'audio', 'image', 'camera', 'map', 'canvas',
            'open-data', 'web-view', 'ad', 'official-account',
            ].indexOf(item.tag + '') >= 0) {
            const attrs = parseNodeAttr(item.attribute, item.tag);
            nextStr = removeIfText(item.children, nextStr);
            return `<${item.tag}${attrs}>${nextStr}</${item.tag}>`;
        }
        if (item.tag === 'textarea') {
            if (nextStr.length > 0) {
                item.attr('value', nextStr);
            }
            const attrs = parseNodeAttr(item.attribute, item.tag);
            return `<textarea${attrs}/>`;
        }
        if (item.tag === 'a') {
            const attrs = parseNodeAttr(item.attribute, 'navigator');
            nextStr = removeIfText(item.children, nextStr);
            return `<navigator${attrs}>${nextStr}</navigator>`;
        }
        if (['i', 'span', 'strong', 'font', 'em', 'b'].indexOf(item.tag + '') >= 0
        && (!item.children || (item.children.length === 1 && item.children[0].node === 'text'))) {
            const attrs = parseNodeAttr(item.attribute, 'text');
            nextStr =  !item.children ? '' : item.children[0].text + '';
            return `<text${attrs}>${nextStr}</text>`;
        }
        const attr = parseNodeAttr(item.attribute);
        // 默认将有 - 分隔符或含大写的作为自定义部件
        if (item.tag && exclude.test(item.tag)) {
            return `<${item.tag}${attr}>${nextStr}</${item.tag}>`;
        }
        return `<view${attr}>${nextStr}</view>`;
    });
    for (const key in existFunc) {
        if (Object.prototype.hasOwnProperty.call(existFunc, key)) {
            const item = existFunc[key];
            if (item.type === FuncType.BIND) {
                wxmlFunc.push(createInputFunc(key, (item.properties as any[])[0], item.append));
                continue;
            }
            if (item.type === FuncType.FUNC) {
                wxmlFunc.push(`${key}(){}`);
                continue;
            }
            if (item.type === FuncType.TAP) {
                const properties = item.properties as any[];
                wxmlFunc.push(createTapFunc(key, properties[0], properties[1]));
                continue;
            }
            if (item.type === FuncType.CONVERTER) {
                const properties = item.properties as any[];
                wxmlFunc.push(createTapCoverterFunc(key, properties[0], properties[1]));
                continue;
            }
        }
    }
    return content;

    /**
     * 抛弃一些不必要的text 标签
     */
    function removeIfText(children: Element[] | undefined, str: string): string {
        if (!children || children.length > 1 || children[0].node !== 'text') {
            return str;
        }
        return children[0].text + '';
    }

    /**
     * 取反判断语句
     * @param value 值
     */
    function invertIf(value: string): string {
        value = value.trim();
        if (value.charAt(0) === '!') {
            return value.substr(1);
        }
        const maps = [
            ['<=', '>'],
            ['=<', '>'],
            ['>=', '<'],
            ['=>', '<'],
            ['==', '!='],
            ['>', '<='],
            ['<', '>='],
        ];
        for (const item of maps) {
            if (value.indexOf(item[0]) > 0) {
                return value.replace(item[0], item[1]);
            }
        }
        return `!(${value})`;
    }

    function converterSrc(value: string, _: string, attrs: Attribute) {
        attrs.set('src', '{{ ' + value + ' }}');
    }

    function converterClass(value: string, _: string, attrs: Attribute) {
        let cls: any = attrs.get('class') || '';
        if (typeof cls === 'object' && cls instanceof Array) {
            cls = cls.join(' ');
        }
        const block = [];
        if (cls.length > 1) {
            block.push('\'' + cls + ' \'');
        }
        value = value.trim();
        if (value.charAt(0) === '{') {
            // 进行合并
            const clsObj: {[key: string]: string[]} = {};
            value.substr(1, value.length - 2).split(',').forEach(item => {
                let [key, con] = item.split(':', 2);
                key = key.trim();
                con = con.trim();
                const isNot = con.charAt(0) === '!';
                const name = isNot ? con.substr(1).trim() : con;
                if (!Object.prototype.hasOwnProperty.call(clsObj, name)) {
                    clsObj[name] = ['', ''];
                }
                clsObj[name][isNot ? 1 : 0] += ' ' + key.replace(/''/g, '');
            });
            for (const key in clsObj) {
                if (Object.prototype.hasOwnProperty.call(clsObj, key)) {
                    block.push('(' + key + '?' + qStr(clsObj[key][0].trim()) + ':' + qStr(clsObj[key][1].trim()) + ')');
                }
            }
        } else if (value.charAt(0) === '[') {
            value.substr(1, value.length - 2).split(',').forEach(item => {
                block.push('\' \'');
                block.push('(' + item + ')');
            });
        } else {
            block.push('\' \'');
            block.push('(' + value + ')');
        }
        attrs.set('class', '{{ ' + block.join('+') + ' }}');
    }

    function converterTap(value: string, attrKey: string = 'bindtap', attrs: Attribute): void {
        if (!attrKey) {
            attrKey = 'bindtap';
        }
        const addFun = (key: string, val: string) => {
            key = key.trim();
            let dataKey = studly(key);
            const f = 'tapItem' + dataKey;
            dataKey = dataKey.toLowerCase(); // 只能接受
            if (!Object.prototype.hasOwnProperty.call(existFunc, f)) {
                existFunc[f] = {
                    type: FuncType.TAP,
                    properties: [key, dataKey],
                };
            }
            attrs.set(attrKey, f).set(`data-${dataKey}`, val);
        };
        let match = value.match(/(([\+\-]{2})|([\+\-\*\/]\=))/);
        if (match) {
            let [key, val] = value.split(match[0], 2);
            if (match[1].charAt(1) !== '=') {
                val = '1';
            }
            key = key.trim();
            addFun(key, '{{' + key + match[0].charAt(0) + val + '}}');
            return;
        }
        if (value.indexOf('=') > 0 && !/[''].*=/.test(value)) {
            const [key, val] = value.split('=', 2);
            addFun(key, qv(val.trim()));
            return;
        }
        match = value.match(/^([^\(\)]+)\((.*)\)$/);
        if (!match) {
            attrs.set(attrKey, value);
            return;
        }
        const args = match[2].trim();
        const func = match[1].trim();
        if (args.length < 1) {
            attrs.set(attrKey, func);
            return;
        }
        const ext: any = {};
        const lines: string[] = [];
        args.split(',').forEach((item, i) => {
            const key = 'arg' + i;
            const val = qv(item.trim());
            lines.push(key);
            ext[`data-${key}`] = val;
        });
        const funcTo = 'converter' + func;
        if (!Object.prototype.hasOwnProperty.call(existFunc, funcTo)) {
            existFunc[funcTo] = {
                type: FuncType.CONVERTER,
                properties: [func, lines],
                amount: lines.length,
            };
        } else if ((existFunc[funcTo].amount as number) < lines.length) {
            existFunc[funcTo].properties = [func, lines];
            existFunc[funcTo].amount = lines.length;
        }
        attrs.set(attrKey, funcTo).set(ext);
        return;
    }

    /**
     * 转换成属性值 包含''
     * @param v 值
     */
    function q(v: any): string {
        if (typeof v === 'object' && v instanceof Array) {
            v = v.join(' ');
        }
        return '\'' + v + '\'';
    }

    /**
     * 转换成字符串
     * @param v 值
     */
    function qStr(v: any): string {
        if (/^[''](.+)['']$/.test(v)) {
            return v;
        }
        return '\'' + v + '\'';
    }

    /**
     * js 转换成 属性值 没有''
     * @param val 值
     */
    function qv(val: string): string {
        if (/^[\d\.]+$/.test(val)) {
            return val;
        }
        const match = val.match(/^[''](.+)['']$/);
        if (match) {
            return match[1];
        }
        return '{{ ' + val + ' }}';
    }

    /**
     * 转化属性
     * @param attrs 属性
     * @param tag 标签
     */
    function parseNodeAttr(attrs?: Attribute, tag: string = 'view'): string {
        if (!attrs) {
            return '';
        }
        const properties = attrs.clone();
        const keys = properties.keys();
        // 排序 prepare 中越后越前
        const sortKey = (prepare: string[]) => {
            keys.sort((a, b) => {
                return prepare.indexOf(b) - prepare.indexOf(a);
            });
        };
        if (tag === 'textarea') {
            sortKey(['value']);
        }
        // 循环遍历属性
        const mapProperty = (cb: (key: string, value: any) => void) => {
            for (const key of keys) {
                if (properties.has(key)) {
                    cb(key, properties.get(key));
                }
            }
        };
        mapProperty((key, value) => {
            properties.delete(key);
            if (disallowAttrs.indexOf(key) >= 0) {
                return;
            }
            if (replaceAttrs.hasOwnProperty(key)) {
                const attr: string|REPLACE_FUNC| boolean = replaceAttrs[key];
                if (typeof attr === 'function') {
                    attr(value, tag, properties);
                    return;
                } else if (typeof attr === 'boolean') {
                    return;
                } else {
                    key = attr;
                }
            }
            if (!key || key.indexOf('@') > 0
                || (key.charAt(0) === '@' && value === true)) {
                return;
            }
            if (value === true) {
                properties.set(key, value);
                return;
            }
            if (Array.isArray(value)) {
                value = value.join(' ');
            }
            const name = parseEventName(key);
            if (name) {
                // 修改 @自定义方法的生成
                converterTap(value, name, properties);
                return;
            } else if (key.charAt(0) === ':') {
                key = key.substr(1);
                value = '{{ ' + value + ' }}';
            }
            properties.set(key, value);
        });
        const str = properties.toString();
        return str.trim().length > 0 ? ' ' + str : '';
    }

    function parseEventName(name: string): string | undefined {
        if (name.indexOf('bind:') === 0 || name.indexOf('bind') === 0) {
            return name;
        }
        if (name.charAt(0) === '@') {
            return 'bind:' + name.substr(1);
        }
        return undefined;
    }

    function parseButton(node: Element, str: string): string {
        let attr = parseNodeAttr(node.attribute);
        if (['reset', 'submit'].indexOf(node.attr('type') + '') >= 0) {
            attr += ' form-type=' + q(node.attr('type'));
        }
        return `<button type='default'${attr}>${str}</button>`;
    }

    function parseInput(node: Element) {
        let type = node.attr('type') || 'text';
        if (type === 'password') {
            type = 'text';
            node.attr('password', 'true');
        }
        node.attr('type', type);
        if (['button', 'reset', 'submit'].indexOf(type + '') >= 0) {
            node.tag = 'button';
            return parseButton(node, node.attr('value') + '');
        }
        if (type === 'checkbox') {
            const attrs = parseNodeAttr(node.attribute, type);
            return `<checkbox${attrs}/>`;
        }
        if (type === 'radio') {
            const attrs = parseNodeAttr(node.attribute, type);
            return `<radio${attrs}/>`;
        }
        if (['text', 'number', 'idcard', 'digit'].indexOf(type + '') < 0) {
            type = 'text';
        }
        node.attr('type', type);
        const attr = parseNodeAttr(node.attribute, 'input');
        return `<input${attr}/>`;
    }
}

export function htmlToWxml(content: string): string {
    // if (content.indexOf('<view') >= 0) {
    //     console.log('跳过。。。');
    //     return content;
    // }
    const element = htmlToJson(content);
    return jsonToWxml(element);
}

export class TemplateParser {

    
    
}