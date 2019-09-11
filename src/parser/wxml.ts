import { htmlToJson } from "./html";

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
    let element = htmlToJson(content);
    return jsonToWxml(element);
}