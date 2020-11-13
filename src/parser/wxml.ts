import { htmlToJson } from "./html";
import { Element } from "./element";
import { Attribute } from "./attribute";

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
    }
}

type REPLACE_FUNC = (value: any, tag: string, attrs: Attribute) => void;

/**
 * 生成input 绑定值方法
 * @param name 
 * @param property 
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
 * @param name 
 * @param property 
 * @param val 
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
 * @param name 
 * @param target 
 * @param args 
 */
function createTapCoverterFunc(name: string, target: string, args: string[]): string {
    let lines: string[] = [];
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
 * @param val 
 * @param isFirstUpper 第一个字母是否大写
 */
export function studly(val: string, isFirstUpper: boolean = true): string {
    if (!val || val.length < 1) {
        return '';
    }
    let items: string[] = [];
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
 * @param json 
 */
export function jsonToWxml(json: Element, exclude: RegExp = /^(.+[\-A-Z].+|[A-Z].+)$/): string {
    wxmlFunc = [];
    let existFunc: IConverterFunc = {};
    const disallow_attrs: string[] = [],
        replace_attrs:{[key: string]: REPLACE_FUNC | string| boolean} = {
            'v-if': function(value: string, _, attrs: Attribute) {
                attrs.set('wx:if', '{{ ' + value + ' }}');
            },
            'v-model': function(value: string, tag: string, attrs: Attribute) {
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
            'v-elseif': function(value: string, _, attrs: Attribute) {
                attrs.set('wx:elif', '{{ ' +value + ' }}');
            },
            'v-else': 'wx:else',
            ':src': converterSrc,
            ':class': converterClass,
            'v-bind:class': converterClass,
            'v-bind:src': converterSrc,
            'v-for': function(value: string, _, attrs: Attribute) {
                let index = 'index';
                let item = 'item';
                let match = value.match(/\(?([\w_]+)(,\s?([\w_]+)\))?\s+in\s+([\w_\.]+)/);
                if (match === null) {
                    attrs.set('wx:for', '{{ ' +value + ' }}');
                    return;
                }
                if (match[3]) {
                    index = match[3];
                }
                item = match[1];
                attrs.set('wx:for', '{{ ' + match[4] + ' }}').set('wx:for-index', index).set('wx:for-item', item);
            },
            'v-show': function(value: string, _, attrs: Attribute) {
                attrs.set('hidden', '{{ ' + invertIf(value) + ' }}')
            },
            'href': 'url',
            ':key': false,
            '@click': function(value: any, _: string, attrs: Attribute) {
                converterTap(value, 'bindtap', attrs);
            },
            '@click.stop': function(value: any, _: string, attrs: Attribute) {
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
            'v-on:click': function(value: any, _: string, attrs: Attribute) {
                converterTap(value, 'bindtap', attrs);
            },
            '(click)': function(value: any, _: string, attrs: Attribute) {
                converterTap(value, 'bindtap', attrs);
            },
            '@touchstart': function(value: any, _: string, attrs: Attribute) {
                converterTap(value, 'bindtouchstart', attrs);
            },
            '@touchmove': function(value: any, _: string, attrs: Attribute) {
                converterTap(value, 'bindtouchmove', attrs);
            },
            '@touchend': function(value: any, _: string, attrs: Attribute) {
                converterTap(value, 'bindtouchend', attrs);
            },
        };
    const content = json.toString((item, content) => {
        if (item.node === 'root') {
            return content;
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
        if (item.node != 'element') {
            return content;
        }
        if(item.tag == 'img') {
            const attr = parseNodeAttr(item.attribute, 'image');
            return `<image${attr}></image>`
        }
        if (item.tag == 'input') {
            return parseInput(item);
        }
        if (item.tag == 'button') {
            return parseButton(item, content);
        }
        if (item.tag == 'form') {
            const attr = parseNodeAttr(item.attribute, item.tag);
            return `<form${attr}>${content}</form>`;
        }
        if (['slider', 'icon', 'progress', 'switch', 'radio', 'checkbox', 'live-player', 'live-pusher'].indexOf(item.tag + '') >= 0) {
            const attr = parseNodeAttr(item.attribute, item.tag);
            return `<${item.tag}${attr}/>`;
        }
        if (['label', 'slot', 'style', 'text',
            'script', 'template', 'view', 'scroll-view', 'swiper', 'block', 
            'swiper-item', 'movable-area', 'movable-view', 'cover-view', 'video',
            'rich-text', 'picker', 'picker-view', 'picker-view-column', 'checkbox-group', 'radio-group', 'editor', 'navigator', 'functional-page-navigator', 'audio', 'image', 'camera', 'map', 'canvas',
            'open-data', 'web-view', 'ad', 'official-account', 
            ].indexOf(item.tag + '') >= 0) {
            const attr = parseNodeAttr(item.attribute, item.tag);
            content = removeIfText(item.children, content);
            return `<${item.tag}${attr}>${content}</${item.tag}>`;
        }
        if (item.tag == 'textarea') {
            if (content.length > 0) {
                item.attr('value', content);
            }
            const attr = parseNodeAttr(item.attribute, item.tag);
            return `<textarea${attr}/>`;
        }
        if (item.tag == 'a') {
            let attr = parseNodeAttr(item.attribute, 'navigator');
            content = removeIfText(item.children, content);
            return `<navigator${attr}>${content}</navigator>`;
        }
        if (['i', 'span', 'strong', 'font', 'em', 'b'].indexOf(item.tag + '') >= 0 
        && (!item.children || (item.children.length == 1 && item.children[0].node == 'text'))) {
            const attr = parseNodeAttr(item.attribute, 'text');
            content =  !item.children ? '' : item.children[0].text + '';
            return `<text${attr}>${content}</text>`;
        }
        const attr = parseNodeAttr(item.attribute);
        // 默认将有 - 分隔符或含大写的作为自定义部件
        if (item.tag && exclude.test(item.tag)) {
            return `<${item.tag}${attr}>${content}</${item.tag}>`;
        }
        return `<view${attr}>${content}</view>`;
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
    function removeIfText(children: Element[] | undefined, content: string): string {
        if (!children || children.length > 1 || children[0].node != 'text') {
            return content;
        }
        return children[0].text + '';
    }

    /**
     * 取反判断语句
     * @param value 
     */
    function invertIf(value: string): string {
        value = value.trim();
        if (value.charAt(0) == '!') {
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
        ]
        for (const item of maps) {
            if (value.indexOf(item[0]) > 0) {
                return value.replace(item[0], item[1]);
            }
        }
        return `!(${value})`;
    }

    function converterSrc(value: string, _: string, attrs: Attribute) {
        attrs.set('src', '{{ ' +value + ' }}');
    }

    function converterClass(value: string, _: string, attrs: Attribute) {
        let cls: any = attrs.get('class') || '';
        if (typeof cls === 'object' && cls instanceof Array) {
            cls = cls.join(' ');
        }
        let block = [];
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
                clsObj[name][isNot ? 1 : 0] += ' ' + key.replace(/'"/g, '');
            });
            for (const key in clsObj) {
                if (Object.prototype.hasOwnProperty.call(clsObj, key)) {
                    block.push('(' + key + '?' + qStr(clsObj[key][0].trim()) + ':' + qStr(clsObj[key][1].trim()) +')');
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
        if (value.indexOf('=') > 0 && !/['"].*=/.test(value)) {
            let [key, val] = value.split('=', 2);
            key = key.trim();
            val = qv(val.trim());
            let dataKey = studly(key);
            const func = 'tapItem' + dataKey;
            dataKey = dataKey.toLowerCase(); // 只能接受
            if (!Object.prototype.hasOwnProperty.call(existFunc, func)) {
                existFunc[func] = {
                    type: FuncType.TAP,
                    properties: [key, dataKey],
                };
            }
            attrs.set(attrKey, func).set(`data-${dataKey}`, val);
            return;
        }
        const match = value.match(/^([^\(\)]+)\((.*)\)$/);
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
        let ext: any = {};
        let lines: string[] = [];
        args.split(',').forEach((item, i) => {
            const key = 'arg'+i;
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
     * 转换成属性值 包含""
     * @param v 
     */
    function q(v: any): string {
        if (typeof v === 'object' && v instanceof Array) {
            v = v.join(' ');
        }
        return '"' + v + '"';
    }

    /**
     * 转换成字符串
     * @param v 
     */
    function qStr(v: any): string {
        if (/^['"](.+)['"]$/.test(v)) {
            return v;
        }
        return '\'' + v + '\'';
    }

    /**
     * js 转换成 属性值 没有""
     * @param val 
     */
    function qv(val: string): string {
        if (/^[\d\.]+$/.test(val)) {
            return val;
        }
        const match = val.match(/^['"](.+)['"]$/);
        if (match) {
            return match[1];
        }
        return '{{ ' +val + ' }}';
    }

    /**
     * 转化属性
     * @param attrs 
     * @param tag 
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
                return prepare.indexOf(b) - prepare.indexOf(a)
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
            if (disallow_attrs.indexOf(key) >= 0) {
                return;
            }
            if (replace_attrs.hasOwnProperty(key)) {
                const attr: string|Function| boolean = replace_attrs[key];
                if (typeof attr === 'function') {
                    attr(value, tag, properties);
                    return;
                } else if (typeof attr === 'boolean') {
                    return
                } else {
                    key = attr;
                }
            }
            if (!key || key.indexOf('@') > 0 
                || (key.charAt(0) === '@' && value === true)) {
                return
            }
            if (value === true) {
                properties.set(key, value);
                return
            }
            if (Array.isArray(value)) {
                value = value.join(' ');
            };
            const name = parseEventName(key);
            if (name) {
                // 修改 @自定义方法的生成
                converterTap(value, name, properties);
                return;
            } else if (key.charAt(0) === ':') {
                key = key.substr(1);
                value = '{{ ' + value +' }}';
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

    function parseButton(node: Element, content: string): string {
        let attr = parseNodeAttr(node.attribute);
        if (['reset', 'submit'].indexOf(node.attr('type') + '') >= 0) {
            attr += ' form-type='+ q(node.attr('type'));
        }
        return `<button type="default"${attr}>${content}</button>`;
    }

    function parseInput(node: Element) {
        let type = node.attr('type') || 'text';
        if (type == 'password') {
            type = 'text';
            node.attr('password', 'true');
        }
        node.attr('type', type);
        if (['button', 'reset', 'submit'].indexOf(type + '') >= 0) {
            node.tag = 'button';
            return parseButton(node, node.attr('value') + '');
        }
        if (type == 'checkbox') {
            const attr = parseNodeAttr(node.attribute, type);
            return `<checkbox${attr}/>`
        }
        if (type == 'radio') {
            const attr = parseNodeAttr(node.attribute, type);
            return `<radio${attr}/>`
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
    let element = htmlToJson(content);
    return jsonToWxml(element);
}