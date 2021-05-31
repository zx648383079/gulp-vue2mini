"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateParser = exports.htmlToWxml = exports.jsonToWxml = void 0;
var html_1 = require("../html");
var util_1 = require("../util");
var FuncType;
(function (FuncType) {
    FuncType[FuncType["BIND"] = 0] = "BIND";
    FuncType[FuncType["TAP"] = 1] = "TAP";
    FuncType[FuncType["CONVERTER"] = 2] = "CONVERTER";
    FuncType[FuncType["FUNC"] = 3] = "FUNC";
})(FuncType || (FuncType = {}));
function createInputFunc(name, property, append) {
    if (append === void 0) { append = []; }
    var line = append.join('');
    return "    " + name + "(event: InputEvent) {\n        let data = this.data;\n        data." + property + " = event.detail.value;" + line + "\n        this.setData(data);\n    }";
}
function createTapFunc(name, property, val) {
    return "    " + name + "(e: TouchEvent) {\n        let data = this.data;\n        data." + property + " = e.currentTarget.dataset." + val + ";\n        this.setData(data);\n    }";
}
function createTapCoverterFunc(name, target, args) {
    var lines = [];
    args.forEach(function (item) {
        lines.push('e.currentTarget.dataset.' + item);
    });
    lines.push('e');
    var line = lines.join(', ');
    return "    " + name + "(e: TouchEvent) {\n        this." + target + "(" + line + ");\n    }";
}
function jsonToWxml(json, exclude, wxmlFunc) {
    if (exclude === void 0) { exclude = /^(.+[\-A-Z].+|[A-Z].+)$/; }
    if (wxmlFunc === void 0) { wxmlFunc = []; }
    var existFunc = {};
    var disallowAttrs = [];
    var replaceAttrs = {
        'v-if': function (value, _, attrs) {
            attrs.set('wx:if', '{{ ' + value + ' }}');
        },
        'v-model': function (value, tag, attrs) {
            var func = util_1.studly(value, false) + 'Changed';
            if (!Object.prototype.hasOwnProperty.call(existFunc, func)) {
                existFunc[func] = {
                    type: FuncType.BIND,
                    properties: [value],
                };
            }
            var getFunc = function (keys) {
                var args = [];
                for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                    var key = keys_1[_i];
                    var val = attrs.get(key);
                    if (!val) {
                        continue;
                    }
                    converterTap(val, key, attrs);
                    args.push('this.' + attrs.get(key) + '(e);');
                    attrs.delete(key);
                }
                return args;
            };
            var inputFunc;
            var append;
            if (['picker', 'switch', 'slider'].indexOf(tag) >= 0) {
                inputFunc = 'bindchange';
                append = getFunc([inputFunc, '@change']);
            }
            else {
                inputFunc = 'bindinput';
                append = getFunc([inputFunc, 'bind:input', '@input']);
            }
            existFunc[func].append = append;
            attrs.set('value', '{{' + value + '}}');
            attrs.set(inputFunc, func);
        },
        'v-elseif': function (value, _, attrs) {
            attrs.set('wx:elif', '{{ ' + value + ' }}');
        },
        'v-else': 'wx:else',
        ':src': converterSrc,
        ':class': converterClass,
        'v-bind:class': converterClass,
        'v-bind:src': converterSrc,
        'v-for': function (value, _, attrs) {
            var index = 'index';
            var item = 'item';
            var match = value.match(/\(?([\w_]+)(,\s?([\w_]+)\))?\s+in\s+([\w_\.]+)/);
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
        'v-show': function (value, _, attrs) {
            attrs.set('hidden', '{{ ' + invertIf(value) + ' }}');
        },
        href: 'url',
        ':key': false,
        '@click': function (value, _, attrs) {
            converterTap(value, 'bindtap', attrs);
        },
        '@click.stop': function (value, _, attrs) {
            if (typeof value === 'string') {
                converterTap(value, 'catchtap', attrs);
                return;
            }
            var func = 'catchTaped';
            if (!Object.prototype.hasOwnProperty.call(existFunc, func)) {
                existFunc[func] = {
                    type: FuncType.FUNC,
                };
            }
            attrs.set('catchtap', func);
        },
        'v-on:click': function (value, _, attrs) {
            converterTap(value, 'bindtap', attrs);
        },
        '(click)': function (value, _, attrs) {
            converterTap(value, 'bindtap', attrs);
        },
        '@touchstart': function (value, _, attrs) {
            converterTap(value, 'bindtouchstart', attrs);
        },
        '@touchmove': function (value, _, attrs) {
            converterTap(value, 'bindtouchmove', attrs);
        },
        '@touchend': function (value, _, attrs) {
            converterTap(value, 'bindtouchend', attrs);
        },
    };
    var content = json.toString(function (item, nextStr) {
        if (item.node === 'root') {
            return nextStr;
        }
        if (item.node === 'text') {
            if (/^\s+$/.test(item.text + '')) {
                return '';
            }
            return "<text>" + item.text + "</text>";
        }
        if (item.node === 'comment') {
            return "<!-- " + item.text + " -->";
        }
        if (item.node !== 'element') {
            return nextStr;
        }
        if (item.tag === 'img') {
            var attrs = parseNodeAttr(item.attribute, 'image');
            return "<image" + attrs + "></image>";
        }
        if (item.tag === 'input') {
            return parseInput(item);
        }
        if (item.tag === 'button') {
            return parseButton(item, nextStr);
        }
        if (item.tag === 'form') {
            var attrs = parseNodeAttr(item.attribute, item.tag);
            return "<form" + attrs + ">" + nextStr + "</form>";
        }
        if (['slider', 'icon', 'progress', 'switch', 'radio', 'checkbox', 'live-player', 'live-pusher'].indexOf(item.tag + '') >= 0) {
            var attrs = parseNodeAttr(item.attribute, item.tag);
            return "<" + item.tag + attrs + "/>";
        }
        if (['label', 'slot', 'style', 'text',
            'script', 'template', 'view', 'scroll-view', 'swiper', 'block',
            'swiper-item', 'movable-area', 'movable-view', 'cover-view', 'video',
            'rich-text', 'picker', 'picker-view', 'picker-view-column', 'checkbox-group', 'radio-group', 'editor', 'navigator', 'functional-page-navigator', 'audio', 'image', 'camera', 'map', 'canvas',
            'open-data', 'web-view', 'ad', 'official-account',
        ].indexOf(item.tag + '') >= 0) {
            var attrs = parseNodeAttr(item.attribute, item.tag);
            nextStr = removeIfText(item.children, nextStr);
            return "<" + item.tag + attrs + ">" + nextStr + "</" + item.tag + ">";
        }
        if (item.tag === 'textarea') {
            if (nextStr.length > 0) {
                item.attr('value', nextStr);
            }
            var attrs = parseNodeAttr(item.attribute, item.tag);
            return "<textarea" + attrs + "/>";
        }
        if (item.tag === 'a') {
            var attrs = parseNodeAttr(item.attribute, 'navigator');
            nextStr = removeIfText(item.children, nextStr);
            return "<navigator" + attrs + ">" + nextStr + "</navigator>";
        }
        if (['i', 'span', 'strong', 'font', 'em', 'b'].indexOf(item.tag + '') >= 0
            && (!item.children || (item.children.length === 1 && item.children[0].node === 'text'))) {
            var attrs = parseNodeAttr(item.attribute, 'text');
            nextStr = !item.children ? '' : item.children[0].text + '';
            return "<text" + attrs + ">" + nextStr + "</text>";
        }
        var attr = parseNodeAttr(item.attribute);
        if (item.tag && exclude.test(item.tag)) {
            return "<" + item.tag + attr + ">" + nextStr + "</" + item.tag + ">";
        }
        return "<view" + attr + ">" + nextStr + "</view>";
    });
    for (var key in existFunc) {
        if (Object.prototype.hasOwnProperty.call(existFunc, key)) {
            var item = existFunc[key];
            if (item.type === FuncType.BIND) {
                wxmlFunc.push(createInputFunc(key, item.properties[0], item.append));
                continue;
            }
            if (item.type === FuncType.FUNC) {
                wxmlFunc.push(key + "(){}");
                continue;
            }
            if (item.type === FuncType.TAP) {
                var properties = item.properties;
                wxmlFunc.push(createTapFunc(key, properties[0], properties[1]));
                continue;
            }
            if (item.type === FuncType.CONVERTER) {
                var properties = item.properties;
                wxmlFunc.push(createTapCoverterFunc(key, properties[0], properties[1]));
                continue;
            }
        }
    }
    return content;
    function removeIfText(children, str) {
        if (!children || children.length > 1 || children[0].node !== 'text') {
            return str;
        }
        return children[0].text + '';
    }
    function invertIf(value) {
        value = value.trim();
        if (value.charAt(0) === '!') {
            return value.substr(1);
        }
        var maps = [
            ['<=', '>'],
            ['=<', '>'],
            ['>=', '<'],
            ['=>', '<'],
            ['==', '!='],
            ['>', '<='],
            ['<', '>='],
        ];
        for (var _i = 0, maps_1 = maps; _i < maps_1.length; _i++) {
            var item = maps_1[_i];
            if (value.indexOf(item[0]) > 0) {
                return value.replace(item[0], item[1]);
            }
        }
        return "!(" + value + ")";
    }
    function converterSrc(value, _, attrs) {
        attrs.set('src', '{{ ' + value + ' }}');
    }
    function converterClass(value, _, attrs) {
        var cls = attrs.get('class') || '';
        if (typeof cls === 'object' && cls instanceof Array) {
            cls = cls.join(' ');
        }
        var block = [];
        if (cls.length > 1) {
            block.push('\'' + cls + ' \'');
        }
        value = value.trim();
        if (value.charAt(0) === '{') {
            var clsObj_1 = {};
            value.substr(1, value.length - 2).split(',').forEach(function (item) {
                var _a = item.split(':', 2), key = _a[0], con = _a[1];
                key = key.trim();
                con = con.trim();
                var isNot = con.charAt(0) === '!';
                var name = isNot ? con.substr(1).trim() : con;
                if (!Object.prototype.hasOwnProperty.call(clsObj_1, name)) {
                    clsObj_1[name] = ['', ''];
                }
                clsObj_1[name][isNot ? 1 : 0] += ' ' + key.replace(/''/g, '');
            });
            for (var key in clsObj_1) {
                if (Object.prototype.hasOwnProperty.call(clsObj_1, key)) {
                    block.push('(' + key + '?' + qStr(clsObj_1[key][0].trim()) + ':' + qStr(clsObj_1[key][1].trim()) + ')');
                }
            }
        }
        else if (value.charAt(0) === '[') {
            value.substr(1, value.length - 2).split(',').forEach(function (item) {
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
    function converterTap(value, attrKey, attrs) {
        if (attrKey === void 0) { attrKey = 'bindtap'; }
        if (!attrKey) {
            attrKey = 'bindtap';
        }
        var addFun = function (key, val) {
            key = key.trim();
            var dataKey = util_1.studly(key);
            var f = 'tapItem' + dataKey;
            dataKey = dataKey.toLowerCase();
            if (!Object.prototype.hasOwnProperty.call(existFunc, f)) {
                existFunc[f] = {
                    type: FuncType.TAP,
                    properties: [key, dataKey],
                };
            }
            attrs.set(attrKey, f).set("data-" + dataKey, val);
        };
        var match = value.match(/(([\+\-]{2})|([\+\-\*\/]\=))/);
        if (match) {
            var _a = value.split(match[0], 2), key = _a[0], val = _a[1];
            if (match[1].charAt(1) !== '=') {
                val = '1';
            }
            key = key.trim();
            addFun(key, '{{' + key + match[0].charAt(0) + val + '}}');
            return;
        }
        if (value.indexOf('=') > 0 && !/[''].*=/.test(value)) {
            var _b = value.split('=', 2), key = _b[0], val = _b[1];
            addFun(key, qv(val.trim()));
            return;
        }
        match = value.match(/^([^\(\)]+)\((.*)\)$/);
        if (!match) {
            attrs.set(attrKey, value);
            return;
        }
        var args = match[2].trim();
        var func = match[1].trim();
        if (args.length < 1) {
            attrs.set(attrKey, func);
            return;
        }
        var ext = {};
        var lines = [];
        args.split(',').forEach(function (item, i) {
            var key = 'arg' + i;
            var val = qv(item.trim());
            lines.push(key);
            ext["data-" + key] = val;
        });
        var funcTo = 'converter' + func;
        if (!Object.prototype.hasOwnProperty.call(existFunc, funcTo)) {
            existFunc[funcTo] = {
                type: FuncType.CONVERTER,
                properties: [func, lines],
                amount: lines.length,
            };
        }
        else if (existFunc[funcTo].amount < lines.length) {
            existFunc[funcTo].properties = [func, lines];
            existFunc[funcTo].amount = lines.length;
        }
        attrs.set(attrKey, funcTo).set(ext);
        return;
    }
    function q(v) {
        if (typeof v === 'object' && v instanceof Array) {
            v = v.join(' ');
        }
        return '\'' + v + '\'';
    }
    function qStr(v) {
        if (/^[''](.+)['']$/.test(v)) {
            return v;
        }
        return '\'' + v + '\'';
    }
    function qv(val) {
        if (/^[\d\.]+$/.test(val)) {
            return val;
        }
        var match = val.match(/^[''](.+)['']$/);
        if (match) {
            return match[1];
        }
        return '{{ ' + val + ' }}';
    }
    function parseNodeAttr(attrs, tag) {
        if (tag === void 0) { tag = 'view'; }
        if (!attrs) {
            return '';
        }
        var properties = attrs.clone();
        var keys = properties.keys();
        var sortKey = function (prepare) {
            keys.sort(function (a, b) {
                return prepare.indexOf(b) - prepare.indexOf(a);
            });
        };
        if (tag === 'textarea') {
            sortKey(['value']);
        }
        var mapProperty = function (cb) {
            for (var _i = 0, keys_2 = keys; _i < keys_2.length; _i++) {
                var key = keys_2[_i];
                if (properties.has(key)) {
                    cb(key, properties.get(key));
                }
            }
        };
        mapProperty(function (key, value) {
            properties.delete(key);
            if (disallowAttrs.indexOf(key) >= 0) {
                return;
            }
            if (replaceAttrs.hasOwnProperty(key)) {
                var attr = replaceAttrs[key];
                if (typeof attr === 'function') {
                    attr(value, tag, properties);
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
            var name = parseEventName(key);
            if (name) {
                converterTap(value, name, properties);
                return;
            }
            else if (key.charAt(0) === ':') {
                key = key.substr(1);
                value = '{{ ' + value + ' }}';
            }
            properties.set(key, value);
        });
        var str = properties.toString();
        return str.trim().length > 0 ? ' ' + str : '';
    }
    function parseEventName(name) {
        if (name.indexOf('bind:') === 0 || name.indexOf('bind') === 0) {
            return name;
        }
        if (name.charAt(0) === '@') {
            return 'bind:' + name.substr(1);
        }
        return undefined;
    }
    function parseButton(node, str) {
        var attr = parseNodeAttr(node.attribute);
        if (['reset', 'submit'].indexOf(node.attr('type') + '') >= 0) {
            attr += ' form-type=' + q(node.attr('type'));
        }
        return "<button type='default'" + attr + ">" + str + "</button>";
    }
    function parseInput(node) {
        var type = node.attr('type') || 'text';
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
            var attrs = parseNodeAttr(node.attribute, type);
            return "<checkbox" + attrs + "/>";
        }
        if (type === 'radio') {
            var attrs = parseNodeAttr(node.attribute, type);
            return "<radio" + attrs + "/>";
        }
        if (['text', 'number', 'idcard', 'digit'].indexOf(type + '') < 0) {
            type = 'text';
        }
        node.attr('type', type);
        var attr = parseNodeAttr(node.attribute, 'input');
        return "<input" + attr + "/>";
    }
}
exports.jsonToWxml = jsonToWxml;
function htmlToWxml(content) {
    var element = html_1.htmlToJson(content);
    return jsonToWxml(element);
}
exports.htmlToWxml = htmlToWxml;
var TemplateParser = (function () {
    function TemplateParser(project, exclude) {
        if (exclude === void 0) { exclude = /^(.+[\-A-Z].+|[A-Z].+)$/; }
        this.project = project;
        this.exclude = exclude;
    }
    TemplateParser.prototype.render = function (content) {
        var func = [];
        var template = jsonToWxml(typeof content === 'object' ? content : html_1.htmlToJson(content), this.exclude, func);
        return {
            template: template,
            func: func,
        };
    };
    return TemplateParser;
}());
exports.TemplateParser = TemplateParser;
