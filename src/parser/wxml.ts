import { htmlToJson } from "./html";
import { Element } from "./element";
import { Attribute } from "./attribute";

/**
 * 获取tpl提取的方法
 */
export let wxmlFunc: string[] = [];

/**
 * 生成input 绑定值方法
 * @param name 
 * @param property 
 */
function createInputFunc(name: string, property: string): string {
    return `    ${name}(event: InputEvent) {
        let data = this.data;
        data.${property} = event.detail.value;
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
export function jsonToWxml(json: Element, exclude: RegExp = /^.+[\-A-Z].+$/): string {
    wxmlFunc = [];
    let existFunc: string[] = [];
    const disallow_attrs: string[] = [],
        replace_attrs:{[key: string]: Function | string| boolean} = {
            'v-if': function(value: string) {
                return ['wx:if', '{{ ' + value + ' }}'];
            },
            'v-model': function(value: string, tag: string) {
                const func = studly(value, false) + 'Changed';
                if (existFunc.indexOf(func) < 0) {
                    wxmlFunc.push(createInputFunc(func, value));
                    existFunc.push(func);
                }
                let inputFunc = 'bind:input';
                if (['picker', 'switch', 'slider'].indexOf(tag) >= 0) {
                    inputFunc = 'bindchange';
                }
                return ['value', '{{' + value + '}}', `${inputFunc}="${func}"`];
            },
            'v-elseif': function(value: string) {
                return ['wx:elif', '{{ ' +value + ' }}'];
            },
            'v-else': 'wx:else',
            ':src': converterSrc,
            ':class': converterClass,
            'v-bind:class': converterClass,
            'v-bind:src': converterSrc,
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
            '@click': converterTap,
            'v-on:click': converterTap,
            '(click)': converterTap,
            '@touchstart': 'bindtouchstart',
            '@touchmove': 'bindtouchmove',
            '@touchend': 'bindtouchend',
        };

    return json.toString((item, content) => {
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
        if (['label', 'slot', 'style', 
            'script', 'template', 'view', 'scroll-view', 'swiper', 'block', 
            'swiper-item', 'movable-area', 'movable-view', 'cover-view', 'video',
            'rich-text', 'picker', 'picker-view', 'picker-view-column', 'checkbox-group', 'radio-group', 'editor', 'navigator', 'functional-page-navigator', 'audio', 'image', 'camera', 'map', 'canvas',
            'open-data', 'web-view', 'ad', 'official-account', 
            ].indexOf(item.tag + '') >= 0) {
            const attr = parseNodeAttr(item.attribute, item.tag);
            return `<${item.tag}${attr}>${content}</${item.tag}>`;
        }
        if (item.tag == 'textarea') {
            item.attr('value', content);
            const attr = parseNodeAttr(item.attribute, item.tag);
            return `<textarea${attr}/>`;
        }
        if (item.tag == 'a') {
            let attr = parseNodeAttr(item.attribute, 'navigator');
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

    function converterSrc(value: string): string[] {
        return ['src', '{{ ' +value + ' }}'];
    }

    function converterClass(value: string, _: string, attrs: Attribute): string[] {
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
            value.substr(1, value.length - 2).split(',').forEach(item => {
                const [key, con] = item.split(':', 2);
                block.push('(' + con + '? ' + qStr(key) + ': \'\')');
            });
        } else if (value.charAt(0) === '[') {
            value.substr(1, value.length - 2).split(',').forEach(item => {
                block.push('\' \'');
                block.push('(' + item + ')');
            });
        } else {
            block.push('\' \'');
            block.push('(' + value + ')');
        }
        return ['class', '{{ ' + block.join('+') + ' }}'];
    }

    function converterTap(value: string): string[] {
        if (value.indexOf('=') > 0) {
            let [key, val] = value.split('=', 2);
            key = key.trim();
            val = qv(val.trim());
            let dataKey = studly(key);
            const func = 'tapItem' + dataKey;
            dataKey = dataKey.toLowerCase(); // 只能接受
            if (existFunc.indexOf(func) < 0) {
                wxmlFunc.push(createTapFunc(func, key, dataKey));
                existFunc.push(func);
            }
            return ['bindtap', func, `data-${dataKey}="${val}"`];
        }
        const match = value.match(/^([^\(\)]+)\((.*)\)$/);
        if (!match) {
            return ['bindtap', value];
        }
        const args = match[2].trim();
        const func = match[1].trim();
        if (args.length < 1) {
            return ['bindtap', func];
        }
        let ext: string[] = [];
        let lines: string[] = [];
        args.split(',').forEach((item, i) => {
            const key = 'arg'+i;
            const val = qv(item.trim());
            lines.push(key);
            ext.push(`data-${key}="${val}"`)
        });
        const funcTo = 'converter' + func;
        if (existFunc.indexOf(func) < 0) {
            wxmlFunc.push(createTapCoverterFunc(funcTo, func, lines));
            existFunc.push(func);
        }
        return ['bindtap', funcTo, ext.join(' ')];
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
        let str = '';
        if (!attrs) {
            return str;
        }
        let attrsClone = Attribute.create({});
        attrs.map((key, value) => {
            if (disallow_attrs.indexOf(key) >= 0) {
                return;
            }
            let ext = '';
            if (replace_attrs.hasOwnProperty(key)) {
                const attr: string|Function| boolean = replace_attrs[key];
                if (typeof attr === 'function') {
                    const args: string[] = attr(value, tag, attrsClone);
                    key = args[0];
                    value = args[1];
                    if (args.length > 2) {
                        ext = ' ' + args[2];
                    }
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
                attrsClone.set(key, value);
                return
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
            attrsClone.set(key, value);
            if (ext.length < 1) {
                return;
            }
            str += ' ' + ext;
        });
        str = attrsClone.toString() + str;
        return str.trim().length > 0 ? ' ' + str : '';
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