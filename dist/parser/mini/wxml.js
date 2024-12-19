"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WxmlCompiler = void 0;
const tokenizer_1 = require("../../tokenizer");
const util_1 = require("../../util");
var FuncType;
(function (FuncType) {
    FuncType[FuncType["BIND"] = 0] = "BIND";
    FuncType[FuncType["TAP"] = 1] = "TAP";
    FuncType[FuncType["CONVERTER"] = 2] = "CONVERTER";
    FuncType[FuncType["FUNC"] = 3] = "FUNC";
})(FuncType || (FuncType = {}));
class WxmlCompiler {
    exclude;
    disallowAttrs;
    constructor(_, exclude = /^(.+[\-A-Z].+|[A-Z].+)$/, disallowAttrs = []) {
        this.exclude = exclude;
        this.disallowAttrs = disallowAttrs;
    }
    tokenizer = new tokenizer_1.TemplateTokenizer();
    existFunc = {};
    replaceAttrs = {
        'v-if': (value, _, attrs) => {
            attrs.set('wx:if', '{{ ' + value + ' }}');
        },
        'v-model': (value, tag, attrs) => {
            const func = (0, util_1.studly)(value, false) + 'Changed';
            if (!Object.prototype.hasOwnProperty.call(this.existFunc, func)) {
                this.existFunc[func] = {
                    type: FuncType.BIND,
                    properties: [value],
                };
            }
            const getFunc = (keys) => {
                const args = [];
                for (const key of keys) {
                    const val = attrs.get(key);
                    if (!val) {
                        continue;
                    }
                    this.converterTap(val, key, attrs);
                    args.push('this.' + attrs.get(key) + '(e);');
                    attrs.delete(key);
                }
                return args;
            };
            let inputFunc;
            let append;
            if (['picker', 'switch', 'slider'].indexOf(tag) >= 0) {
                inputFunc = 'bindchange';
                append = getFunc([inputFunc, '@change']);
            }
            else {
                inputFunc = 'bindinput';
                append = getFunc([inputFunc, 'bind:input', '@input']);
            }
            this.existFunc[func].append = append;
            attrs.set('value', '{{' + value + '}}');
            attrs.set(inputFunc, func);
        },
        'v-elseif': (value, _, attrs) => {
            attrs.set('wx:elif', '{{ ' + value + ' }}');
        },
        'v-else': 'wx:else',
        ':src': this.converterSrc,
        ':class': this.converterClass,
        'v-bind:class': this.converterClass,
        'v-bind:src': this.converterSrc,
        'v-for': (value, _, attrs) => {
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
        'v-show': (value, _, attrs) => {
            attrs.set('hidden', '{{ ' + this.invertIf(value) + ' }}');
        },
        href: 'url',
        ':key': false,
        '@click': (value, _, attrs) => {
            this.converterTap(value, 'bindtap', attrs);
        },
        '@click.stop': (value, _, attrs) => {
            if (typeof value === 'string') {
                this.converterTap(value, 'catchtap', attrs);
                return;
            }
            const func = 'catchTaped';
            if (!Object.prototype.hasOwnProperty.call(this.existFunc, func)) {
                this.existFunc[func] = {
                    type: FuncType.FUNC,
                };
            }
            attrs.set('catchtap', func);
        },
        'v-on:click': (value, _, attrs) => {
            this.converterTap(value, 'bindtap', attrs);
        },
        '(click)': (value, _, attrs) => {
            this.converterTap(value, 'bindtap', attrs);
        },
        '@touchstart': (value, _, attrs) => {
            this.converterTap(value, 'bindtouchstart', attrs);
        },
        '@touchmove': (value, _, attrs) => {
            this.converterTap(value, 'bindtouchmove', attrs);
        },
        '@touchend': (value, _, attrs) => {
            this.converterTap(value, 'bindtouchend', attrs);
        },
    };
    render(data) {
        if (typeof data !== 'object') {
            data = this.tokenizer.render(data);
        }
        this.existFunc = {};
        return this.renderFull(data);
    }
    renderFull(json) {
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
                const attrs = this.parseNodeAttr(item.attribute, 'image');
                return `<image${attrs}></image>`;
            }
            if (item.tag === 'input') {
                return this.parseInput(item);
            }
            if (item.tag === 'button') {
                return this.parseButton(item, nextStr);
            }
            if (item.tag === 'form') {
                const attrs = this.parseNodeAttr(item.attribute, item.tag);
                return `<form${attrs}>${nextStr}</form>`;
            }
            if (['slider', 'icon', 'progress', 'switch', 'radio', 'checkbox', 'live-player', 'live-pusher'].indexOf(item.tag + '') >= 0) {
                const attrs = this.parseNodeAttr(item.attribute, item.tag);
                return `<${item.tag}${attrs}/>`;
            }
            if (['label', 'slot', 'style', 'text',
                'script', 'template', 'view', 'scroll-view', 'swiper', 'block',
                'swiper-item', 'movable-area', 'movable-view', 'cover-view', 'video',
                'rich-text', 'picker', 'picker-view', 'picker-view-column', 'checkbox-group', 'radio-group', 'editor', 'navigator', 'functional-page-navigator', 'audio', 'image', 'camera', 'map', 'canvas',
                'open-data', 'web-view', 'ad', 'official-account',
            ].indexOf(item.tag + '') >= 0) {
                const attrs = this.parseNodeAttr(item.attribute, item.tag);
                nextStr = this.removeIfText(item.children, nextStr);
                return `<${item.tag}${attrs}>${nextStr}</${item.tag}>`;
            }
            if (item.tag === 'textarea') {
                if (nextStr.length > 0) {
                    item.attr('value', nextStr);
                }
                const attrs = this.parseNodeAttr(item.attribute, item.tag);
                return `<textarea${attrs}/>`;
            }
            if (item.tag === 'a') {
                const attrs = this.parseNodeAttr(item.attribute, 'navigator');
                nextStr = this.removeIfText(item.children, nextStr);
                return `<navigator${attrs}>${nextStr}</navigator>`;
            }
            if (['i', 'span', 'strong', 'font', 'em', 'b'].indexOf(item.tag + '') >= 0
                && (!item.children || (item.children.length === 1 && item.children[0].node === 'text'))) {
                const attrs = this.parseNodeAttr(item.attribute, 'text');
                nextStr = !item.children ? '' : item.children[0].text + '';
                return `<text${attrs}>${nextStr}</text>`;
            }
            const attr = this.parseNodeAttr(item.attribute);
            if (item.tag && this.exclude.test(item.tag)) {
                return `<${item.tag}${attr}>${nextStr}</${item.tag}>`;
            }
            return `<view${attr}>${nextStr}</view>`;
        });
        const res = {
            template: content,
            func: this.renderFunc(this.existFunc),
        };
        this.existFunc = {};
        return res;
    }
    renderFunc(funcMap) {
        const funcItems = [];
        for (const key in funcMap) {
            if (Object.prototype.hasOwnProperty.call(funcMap, key)) {
                const item = this.existFunc[key];
                if (item.type === FuncType.BIND) {
                    funcItems.push(this.createInputFunc(key, item.properties[0], item.append));
                    continue;
                }
                if (item.type === FuncType.FUNC) {
                    funcItems.push(`${key}(){}`);
                    continue;
                }
                if (item.type === FuncType.TAP) {
                    const properties = item.properties;
                    funcItems.push(this.createTapFunc(key, properties[0], properties[1]));
                    continue;
                }
                if (item.type === FuncType.CONVERTER) {
                    const properties = item.properties;
                    funcItems.push(this.createTapCoverterFunc(key, properties[0], properties[1]));
                    continue;
                }
            }
        }
        return funcItems;
    }
    removeIfText(children, str) {
        if (!children || children.length > 1 || children[0].node !== 'text') {
            return str;
        }
        return children[0].text + '';
    }
    invertIf(value) {
        value = value.trim();
        if (value.charAt(0) === '!') {
            return value.substring(1);
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
    converterSrc(value, _, attrs) {
        attrs.set('src', '{{ ' + value + ' }}');
    }
    converterClass(value, _, attrs) {
        let cls = attrs.get('class') || '';
        if (typeof cls === 'object' && cls instanceof Array) {
            cls = cls.join(' ');
        }
        const block = [];
        if (cls.length > 1) {
            block.push('\'' + cls + ' \'');
        }
        value = value.trim();
        if (value.charAt(0) === '{') {
            const clsObj = {};
            value.substring(1, value.length - 1).split(',').forEach(item => {
                let [key, con] = (0, util_1.splitStr)(item, ':', 2);
                key = key.trim();
                con = con.trim();
                const isNot = con.charAt(0) === '!';
                const name = isNot ? con.substring(1).trim() : con;
                if (!Object.prototype.hasOwnProperty.call(clsObj, name)) {
                    clsObj[name] = ['', ''];
                }
                clsObj[name][isNot ? 1 : 0] += ' ' + key.replace(/''/g, '');
            });
            for (const key in clsObj) {
                if (Object.prototype.hasOwnProperty.call(clsObj, key)) {
                    block.push('(' + key + '?' + this.qStr(clsObj[key][0].trim()) + ':' + this.qStr(clsObj[key][1].trim()) + ')');
                }
            }
        }
        else if (value.charAt(0) === '[') {
            value.substring(1, value.length - 1).split(',').forEach(item => {
                block.push('\' \'');
                block.push('(' + item + ')');
            });
        }
        else {
            block.push('\' \'');
            block.push('(' + value + ')');
        }
        attrs.set('class', '{{ ' + block.join('+') + ' }}');
    }
    converterTap(value, attrKey = 'bindtap', attrs) {
        if (!attrKey) {
            attrKey = 'bindtap';
        }
        const addFun = (key, val) => {
            key = key.trim();
            let dataKey = (0, util_1.studly)(key);
            const f = 'tapItem' + dataKey;
            dataKey = dataKey.toLowerCase();
            if (!Object.prototype.hasOwnProperty.call(this.existFunc, f)) {
                this.existFunc[f] = {
                    type: FuncType.TAP,
                    properties: [key, dataKey],
                };
            }
            attrs.set(attrKey, f).set(`data-${dataKey}`, val);
        };
        let match = value.match(/(([\+\-]{2})|([\+\-\*\/]\=))/);
        if (match) {
            let [key, val] = (0, util_1.splitStr)(value, match[0], 2);
            if (match[1].charAt(1) !== '=') {
                val = '1';
            }
            key = key.trim();
            addFun(key, '{{' + key + match[0].charAt(0) + val + '}}');
            return;
        }
        if (value.indexOf('=') > 0 && !/[''].*=/.test(value)) {
            const [key, val] = (0, util_1.splitStr)(value, '=', 2);
            addFun(key, this.qv(val.trim()));
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
        const ext = {};
        const lines = [];
        args.split(',').forEach((item, i) => {
            const key = 'arg' + i;
            const val = this.qv(item.trim());
            lines.push(key);
            ext[`data-${key}`] = val;
        });
        const funcTo = 'converter' + func;
        if (!Object.prototype.hasOwnProperty.call(this.existFunc, funcTo)) {
            this.existFunc[funcTo] = {
                type: FuncType.CONVERTER,
                properties: [func, lines],
                amount: lines.length,
            };
        }
        else if (this.existFunc[funcTo].amount < lines.length) {
            this.existFunc[funcTo].properties = [func, lines];
            this.existFunc[funcTo].amount = lines.length;
        }
        attrs.set(attrKey, funcTo).set(ext);
        return;
    }
    createInputFunc(name, property, append = []) {
        const line = append.join('');
        return `    ${name}(event: InputEvent) {
            let data = this.data;
            data.${property} = event.detail.value;${line}
            this.setData(data);
        }`;
    }
    createTapFunc(name, property, val) {
        return `    ${name}(e: TouchEvent) {
            let data = this.data;
            data.${property} = e.currentTarget.dataset.${val};
            this.setData(data);
        }`;
    }
    createTapCoverterFunc(name, target, args) {
        const lines = [];
        args.forEach(item => {
            lines.push('e.currentTarget.dataset.' + item);
        });
        lines.push('e');
        const line = lines.join(', ');
        return `    ${name}(e: TouchEvent) {
            this.${target}(${line});
        }`;
    }
    q(v) {
        if (typeof v === 'object' && v instanceof Array) {
            v = v.join(' ');
        }
        return '\'' + v + '\'';
    }
    qStr(v) {
        if (/^[''](.+)['']$/.test(v)) {
            return v;
        }
        return '\'' + v + '\'';
    }
    qv(val) {
        if (/^[\d\.]+$/.test(val)) {
            return val;
        }
        const match = val.match(/^[''](.+)['']$/);
        if (match) {
            return match[1];
        }
        return '{{ ' + val + ' }}';
    }
    parseNodeAttr(attrs, tag = 'view') {
        if (!attrs) {
            return '';
        }
        const properties = attrs.clone();
        const keys = properties.keys();
        const sortKey = (prepare) => {
            keys.sort((a, b) => {
                return prepare.indexOf(b) - prepare.indexOf(a);
            });
        };
        if (tag === 'textarea') {
            sortKey(['value']);
        }
        const mapProperty = (cb) => {
            for (const key of keys) {
                if (properties.has(key)) {
                    cb(key, properties.get(key));
                }
            }
        };
        mapProperty((key, value) => {
            properties.delete(key);
            if (this.disallowAttrs.indexOf(key) >= 0) {
                return;
            }
            if (this.replaceAttrs.hasOwnProperty(key)) {
                const attr = this.replaceAttrs[key];
                if (typeof attr === 'function') {
                    attr.call(this, value, tag, properties);
                    return;
                }
                else if (typeof attr === 'boolean') {
                    return;
                }
                else {
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
            const name = this.parseEventName(key);
            if (name) {
                this.converterTap(value, name, properties);
                return;
            }
            else if (key.charAt(0) === ':') {
                key = key.substring(1);
                value = '{{ ' + value + ' }}';
            }
            properties.set(key, value);
        });
        const str = properties.toString();
        return str.trim().length > 0 ? ' ' + str : '';
    }
    parseEventName(name) {
        if (name.indexOf('bind:') === 0 || name.indexOf('bind') === 0) {
            return name;
        }
        if (name.charAt(0) === '@') {
            return 'bind:' + name.substring(1);
        }
        return undefined;
    }
    parseButton(node, str) {
        let attr = this.parseNodeAttr(node.attribute);
        if (['reset', 'submit'].indexOf(node.attr('type') + '') >= 0) {
            attr += ' form-type=' + this.q(node.attr('type'));
        }
        return `<button type='default'${attr}>${str}</button>`;
    }
    parseInput(node) {
        let type = node.attr('type') || 'text';
        if (type === 'password') {
            type = 'text';
            node.attr('password', 'true');
        }
        node.attr('type', type);
        if (['button', 'reset', 'submit'].indexOf(type + '') >= 0) {
            node.tag = 'button';
            return this.parseButton(node, node.attr('value') + '');
        }
        if (type === 'checkbox') {
            const attrs = this.parseNodeAttr(node.attribute, type);
            return `<checkbox${attrs}/>`;
        }
        if (type === 'radio') {
            const attrs = this.parseNodeAttr(node.attribute, type);
            return `<radio${attrs}/>`;
        }
        if (['text', 'number', 'idcard', 'digit'].indexOf(type + '') < 0) {
            type = 'text';
        }
        node.attr('type', type);
        const attr = this.parseNodeAttr(node.attribute, 'input');
        return `<input${attr}/>`;
    }
}
exports.WxmlCompiler = WxmlCompiler;
