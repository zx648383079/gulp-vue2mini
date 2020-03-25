import { htmlToJson } from "./html";
import { Element } from "./element";
import { Attribute } from "./attribute";

/**
 * 获取tpl提取的方法
 */
export let wxmlFunc: string[] = [];

function createInputFunc(name: string, property: string): string {
    return `    ${name}(event: InputEvent) {
        this.setData({
            ${property}: event.detail.value
        });
    }`;
}

/**
 * json 转 wxml
 * @param json 
 */
export function jsonToWxml(json: Element, exclude: RegExp = /^.+[\-A-Z].+$/): string {
    wxmlFunc = [];
    const disallow_attrs: string[] = [],
        replace_attrs:{[key: string]: Function | string| boolean} = {
            'v-if': function(value: string) {
                return ['wx:if', '{{ ' +value + ' }}'];
            },
            'v-model': function(value: string) {
                const func = value + 'Changed';
                wxmlFunc.push(createInputFunc(func, value));
                return ['value', '{{' + value + '}}', `bind:input="${func}"`];
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
            'rich-text', 'picker', 'picker-view', 'picker-view-column', 'checkbox-group', 'radio-group', 'navigator', 'functional-page-navigator', 'audio', 'image', 'camera', 'map', 'canvas',
            'open-data', 'web-view', 'ad', 'official-account'
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
    function q(v: any) {
        return '"' + v + '"';
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
        attrs.map((key, value) => {
            if (disallow_attrs.indexOf(key) >= 0) {
                return
            }
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
                str += ' ' + key + ext;
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
            str += ' ' + key + '=' + q(value) + ext;
        });
        return str;
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