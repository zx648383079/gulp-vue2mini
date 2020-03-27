"use strict";
exports.__esModule = true;
var html_1 = require("./html");
var attribute_1 = require("./attribute");
exports.wxmlFunc = [];
function createInputFunc(name, property) {
    return "    " + name + "(event: InputEvent) {\n        let data = this.data;\n        data." + property + " = event.detail.value;\n        this.setData(data);\n    }";
}
function createTapFunc(name, property, val) {
    return "    " + name + "(e: TouchEvent) {\n        let data = this.data;\n        data." + property + " = e.currentTarget.dataset." + val + ";\n        this.setData(data);\n    }";
}
function createTapCoverterFunc(name, target, args) {
    var lines = [];
    args.forEach(function (item) {
        lines.push('e.currentTarget.dataset.' + item);
    });
    var line = lines.join(', ');
    return "    " + name + "(e: TouchEvent) {\n        this." + target + "(" + line + ");\n    }";
}
function firstUpper(val) {
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
exports.firstUpper = firstUpper;
function studly(val, isFirstUpper) {
    if (isFirstUpper === void 0) { isFirstUpper = true; }
    if (!val || val.length < 1) {
        return '';
    }
    var items = [];
    val.split(/[\.\s_-]+/).forEach(function (item) {
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
exports.studly = studly;
function jsonToWxml(json, exclude) {
    if (exclude === void 0) { exclude = /^.+[\-A-Z].+$/; }
    exports.wxmlFunc = [];
    var disallow_attrs = [], replace_attrs = {
        'v-if': function (value) {
            return ['wx:if', '{{ ' + value + ' }}'];
        },
        'v-model': function (value) {
            var func = studly(value, false) + 'Changed';
            exports.wxmlFunc.push(createInputFunc(func, value));
            return ['value', '{{' + value + '}}', "bind:input=\"" + func + "\""];
        },
        'v-elseif': function (value) {
            return ['wx:elif', '{{ ' + value + ' }}'];
        },
        'v-else': 'wx:else',
        ':src': converterSrc,
        ':class': converterClass,
        'v-bind:class': converterClass,
        'v-bind:src': converterSrc,
        'v-for': function (value) {
            var index = 'index';
            var item = 'item';
            var match = value.match(/\(?([\w_]+)(,\s?([\w_]+)\))?\s+in\s+([\w_\.]+)/);
            if (match === null) {
                return ['wx:for', '{{ ' + value + ' }}'];
            }
            if (match[3]) {
                index = match[3];
            }
            item = match[1];
            return ['wx:for', '{{ ' + match[4] + ' }}', "wx:for-index=\"" + index + "\" wx:for-item=\"" + item + "\""];
        },
        'v-show': function (value) {
            value = value.trim();
            if (value.charAt(0) == '!') {
                value = value.substr(1);
            }
            else {
                value = '!' + value;
            }
            return ['hidden', '{{ ' + value + ' }}'];
        },
        'href': 'url',
        ':key': false,
        '@click': converterTap,
        'v-on:click': converterTap,
        '(click)': converterTap,
        '@touchstart': 'bindtouchstart',
        '@touchmove': 'bindtouchmove',
        '@touchend': 'bindtouchend'
    };
    return json.toString(function (item, content) {
        if (item.node === 'root') {
            return content;
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
        if (item.node != 'element') {
            return content;
        }
        if (item.tag == 'img') {
            var attr_1 = parseNodeAttr(item.attribute, 'image');
            return "<image" + attr_1 + "></image>";
        }
        if (item.tag == 'input') {
            return parseInput(item);
        }
        if (item.tag == 'button') {
            return parseButton(item, content);
        }
        if (item.tag == 'form') {
            var attr_2 = parseNodeAttr(item.attribute, item.tag);
            return "<form" + attr_2 + ">" + content + "</form>";
        }
        if (['slider', 'icon', 'progress', 'switch', 'radio', 'checkbox', 'live-player', 'live-pusher'].indexOf(item.tag + '') >= 0) {
            var attr_3 = parseNodeAttr(item.attribute, item.tag);
            return "<" + item.tag + attr_3 + "/>";
        }
        if (['label', 'slot', 'style',
            'script', 'template', 'view', 'scroll-view', 'swiper', 'block',
            'swiper-item', 'movable-area', 'movable-view', 'cover-view', 'video',
            'rich-text', 'picker', 'picker-view', 'picker-view-column', 'checkbox-group', 'radio-group', 'navigator', 'functional-page-navigator', 'audio', 'image', 'camera', 'map', 'canvas',
            'open-data', 'web-view', 'ad', 'official-account'
        ].indexOf(item.tag + '') >= 0) {
            var attr_4 = parseNodeAttr(item.attribute, item.tag);
            return "<" + item.tag + attr_4 + ">" + content + "</" + item.tag + ">";
        }
        if (item.tag == 'textarea') {
            item.attr('value', content);
            var attr_5 = parseNodeAttr(item.attribute, item.tag);
            return "<textarea" + attr_5 + "/>";
        }
        if (item.tag == 'a') {
            var attr_6 = parseNodeAttr(item.attribute, 'navigator');
            return "<navigator" + attr_6 + ">" + content + "</navigator>";
        }
        if (['i', 'span', 'strong', 'font', 'em', 'b'].indexOf(item.tag + '') >= 0
            && (!item.children || (item.children.length == 1 && item.children[0].node == 'text'))) {
            var attr_7 = parseNodeAttr(item.attribute, 'text');
            content = !item.children ? '' : item.children[0].text + '';
            return "<text" + attr_7 + ">" + content + "</text>";
        }
        var attr = parseNodeAttr(item.attribute);
        if (item.tag && exclude.test(item.tag)) {
            return "<" + item.tag + attr + ">" + content + "</" + item.tag + ">";
        }
        return "<view" + attr + ">" + content + "</view>";
    });
    function converterSrc(value) {
        return ['src', '{{ ' + value + ' }}'];
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
            value.substr(1, value.length - 2).split(',').forEach(function (item) {
                var _a = item.split(':', 2), key = _a[0], con = _a[1];
                block.push('(' + con + '? ' + qStr(key) + ': \'\')');
            });
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
        return ['class', '{{ ' + block.join('+') + ' }}'];
    }
    function converterTap(value) {
        if (value.indexOf('=') > 0) {
            var _a = value.split('=', 2), key = _a[0], val = _a[1];
            key = key.trim();
            val = qv(val.trim());
            var dataKey = studly(key);
            var func_1 = 'tapItem' + dataKey;
            dataKey = dataKey.toLowerCase();
            exports.wxmlFunc.push(createTapFunc(func_1, key, dataKey));
            return ['bindtap', func_1, "data-" + dataKey + "=\"" + val + "\""];
        }
        var match = value.match(/^([^\(\)]+)\((.*)\)$/);
        if (!match) {
            return ['bindtap', value];
        }
        var args = match[2].trim();
        var func = match[1].trim();
        if (args.length < 1) {
            return ['bindtap', func];
        }
        var ext = [];
        var lines = [];
        args.split(',').forEach(function (item, i) {
            var key = 'arg' + i;
            var val = qv(item.trim());
            lines.push(key);
            ext.push("data-" + key + "=\"" + val + "\"");
        });
        var funcTo = 'converter' + func;
        exports.wxmlFunc.push(createTapCoverterFunc(funcTo, func, lines));
        return ['bindtap', funcTo, ext.join(' ')];
    }
    function q(v) {
        if (typeof v === 'object' && v instanceof Array) {
            v = v.join(' ');
        }
        return '"' + v + '"';
    }
    function qStr(v) {
        if (/^['"](.+)['"]$/.test(v)) {
            return v;
        }
        return '\'' + v + '\'';
    }
    function qv(val) {
        if (/^[\d\.]+$/.test(val)) {
            return val;
        }
        var match = val.match(/^['"](.+)['"]$/);
        if (match) {
            return match[1];
        }
        return '{{ ' + val + ' }}';
    }
    function parseNodeAttr(attrs, tag) {
        if (tag === void 0) { tag = 'view'; }
        var str = '';
        if (!attrs) {
            return str;
        }
        var attrsClone = attribute_1.Attribute.create({});
        attrs.map(function (key, value) {
            if (disallow_attrs.indexOf(key) >= 0) {
                return;
            }
            var ext = '';
            if (replace_attrs.hasOwnProperty(key)) {
                var attr = replace_attrs[key];
                if (typeof attr === 'function') {
                    var args = attr(value, tag, attrsClone);
                    key = args[0];
                    value = args[1];
                    if (args.length > 2) {
                        ext = ' ' + args[2];
                    }
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
                attrsClone.set(key, value);
                return;
            }
            if (Array.isArray(value)) {
                value = value.join(' ');
            }
            ;
            if (key.charAt(0) === '@') {
                key = 'bind:' + key.substr(1);
                if (value.indexOf('(') > 0) {
                    value = value.substring(0, value.indexOf('(') - 1);
                }
            }
            else if (key.charAt(0) === ':') {
                key = key.substr(1);
                value = '{{ ' + value + ' }}';
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
    function parseButton(node, content) {
        var attr = parseNodeAttr(node.attribute);
        if (['reset', 'submit'].indexOf(node.attr('type') + '') >= 0) {
            attr += ' form-type=' + q(node.attr('type'));
        }
        return "<button type=\"default\"" + attr + ">" + content + "</button>";
    }
    function parseInput(node) {
        var type = node.attr('type') || 'text';
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
            var attr_8 = parseNodeAttr(node.attribute, type);
            return "<checkbox" + attr_8 + "/>";
        }
        if (type == 'radio') {
            var attr_9 = parseNodeAttr(node.attribute, type);
            return "<radio" + attr_9 + "/>";
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
