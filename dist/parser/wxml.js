"use strict";
exports.__esModule = true;
var html_1 = require("./html");
function jsonToWxml(json, exclude) {
    if (exclude === void 0) { exclude = /^.+[\-A-Z].+$/; }
    var disallow_attrs = [], replace_attrs = {
        'v-if': function (value) {
            return ['wx:if', '{{ ' + value + ' }}'];
        },
        'v-model': function (value) {
            return ['value', '{{' + value + '}}', "bind:input=\"" + value + "Changed\""];
        },
        'v-elseif': function (value) {
            return ['wx:elif', '{{ ' + value + ' }}'];
        },
        'v-else': 'wx:else',
        ':src': function (value) {
            return ['src', '{{ ' + value + ' }}'];
        },
        'v-bind:src': function (value) {
            return ['src', '{{ ' + value + ' }}'];
        },
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
        '@click': 'bindtap',
        'v-on:click': 'bindtap',
        '(click)': 'bindtap',
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
    function q(v) {
        return '"' + v + '"';
    }
    function parseNodeAttr(attrs, tag) {
        if (tag === void 0) { tag = 'view'; }
        var str = '';
        if (!attrs) {
            return str;
        }
        attrs.map(function (key, value) {
            if (disallow_attrs.indexOf(key) >= 0) {
                return;
            }
            var ext = '';
            if (replace_attrs.hasOwnProperty(key)) {
                var attr = replace_attrs[key];
                if (typeof attr === 'function') {
                    var args = attr(value, tag);
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
                str += ' ' + key + ext;
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
            str += ' ' + key + '=' + q(value) + ext;
        });
        return str;
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
