"use strict";
exports.__esModule = true;
var fs = require("fs");
var path = require("path");
var BLOCK_TYPE;
(function (BLOCK_TYPE) {
    BLOCK_TYPE[BLOCK_TYPE["NONE"] = 0] = "NONE";
    BLOCK_TYPE[BLOCK_TYPE["TAG"] = 1] = "TAG";
    BLOCK_TYPE[BLOCK_TYPE["ATTR"] = 2] = "ATTR";
    BLOCK_TYPE[BLOCK_TYPE["ATTR_VALUE"] = 3] = "ATTR_VALUE";
    BLOCK_TYPE[BLOCK_TYPE["END_TAG"] = 4] = "END_TAG";
})(BLOCK_TYPE || (BLOCK_TYPE = {}));
var LINE_SPLITE = "\r\n";
function htmlToJson(content) {
    var pos = -1, isNodeBegin = function () {
        var po = pos, code, status = BLOCK_TYPE.TAG, attrTag = '';
        while (po < content.length) {
            code = content.charAt(++po);
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
    }, getNodeEndTag = function (i) {
        var code, tag = '';
        code = content.charAt(++i);
        if (code !== '/') {
            return false;
        }
        while (i < content.length) {
            code = content.charAt(++i);
            if (code === '>') {
                return tag;
            }
            if (['<', '"', '\'', '(', ')', '{', '}', '='].indexOf(code) >= 0) {
                return false;
            }
            tag += code;
        }
        return false;
    }, isNodeEnd = function () {
        var tag = getNodeEndTag(pos);
        if (typeof tag !== 'string') {
            return false;
        }
        pos += 2 + tag.length;
        return true;
    }, isComment = function () {
        if (content.substr(pos, 3) !== '!--') {
            return false;
        }
        return content.indexOf('-->', pos + 3) > 0;
    }, getCommentElement = function () {
        var start = pos + 3;
        var end = content.indexOf('-->', start);
        var text = content.substr(start, end - start);
        pos += end + 3;
        return { node: 'comment', text: text };
    }, getTextElement = function () {
        var text = '', code;
        while (pos < content.length) {
            code = content.charAt(++pos);
            if (code === '<' && isNodeBegin()) {
                pos--;
                break;
            }
            text += code;
        }
        if (text.length < 1) {
            return false;
        }
        return { node: 'text', text: text.trim() };
    }, backslashedCount = function () {
        var po = pos, code, count = 0;
        while (po < content.length) {
            code = content.charAt(--po);
            if (code === '\\') {
                count++;
                continue;
            }
            return count;
        }
        return count;
    }, isEmpty = function (code) {
        return code === ' ' || code === "\r" || code === "\n" || code === "\t";
    }, moveEndTag = function (tag) {
        var po = pos, code;
        while (po < content.length) {
            code = content.charAt(++po);
            if (isEmpty(code)) {
                continue;
            }
            if (code === '<') {
                break;
            }
        }
        var endTag = getNodeEndTag(po);
        if (typeof endTag !== 'string') {
            return;
        }
        if (endTag.trim() !== tag) {
            return;
        }
        pos = po + 2 + endTag.length;
    }, getElement = function () {
        var tag = '', attrs = {}, code, status = BLOCK_TYPE.TAG, name = '', value = '', endAttr;
        while (pos < content.length) {
            code = content.charAt(++pos);
            if (code === '>' && (status === BLOCK_TYPE.TAG || status === BLOCK_TYPE.ATTR)) {
                if (status === BLOCK_TYPE.ATTR && name !== '') {
                    attrs[name] = true;
                    name = '';
                }
                if (['area', 'base', 'basefont', 'br', 'col', 'frame', 'hr', 'img', 'input', 'link', 'meta', 'param', 'embed', 'command', 'keygen', 'source', 'track', 'wbr'].indexOf(tag) >= 0) {
                    moveEndTag(tag);
                    return {
                        node: 'element',
                        tag: tag.trim(),
                        attrs: attrs
                    };
                }
                var children = parserElements();
                if (children.length < 1) {
                    return {
                        node: 'element',
                        tag: tag.trim(),
                        attrs: attrs
                    };
                }
                return {
                    node: 'element',
                    tag: tag.trim(),
                    attrs: attrs,
                    children: children
                };
            }
            if (code === '/') {
                if (status === BLOCK_TYPE.ATTR || status === BLOCK_TYPE.TAG) {
                    if (content.charAt(pos + 1) === '>') {
                        pos++;
                        break;
                    }
                    continue;
                }
                if (!endAttr && status == BLOCK_TYPE.ATTR_VALUE) {
                    if (content.charAt(pos++) == '>') {
                        status = BLOCK_TYPE.NONE;
                        attrs[name] = value;
                        name = '';
                        value = '';
                        pos++;
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
                    pos++;
                    continue;
                }
                endAttr = undefined;
                continue;
            }
            if (endAttr && code === endAttr && status == BLOCK_TYPE.ATTR_VALUE) {
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
            attrs: attrs
        };
    }, parserElement = function () {
        var code;
        while (pos < content.length) {
            code = content.charAt(++pos);
            if (isEmpty(code)) {
                continue;
            }
            if (code !== '<') {
                pos--;
                return getTextElement();
            }
            if (isNodeEnd()) {
                return true;
            }
            if (isComment()) {
                return getCommentElement();
            }
            if (!isNodeBegin()) {
                pos--;
                return getTextElement();
            }
            return getElement();
        }
        return false;
    }, parserElements = function () {
        var items = [];
        while (pos < content.length) {
            var item = parserElement();
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
exports.htmlToJson = htmlToJson;
function jsonToWxml(json, exclude) {
    if (exclude === void 0) { exclude = /^.+[\-A-Z].+$/; }
    if (json instanceof Array) {
        return json.map(function (item) {
            return jsonToWxml(item);
        }).join('');
    }
    if (json.node == 'text') {
        if (/^\s+$/.test(json.text + '')) {
            return '';
        }
        return "<text>" + json.text + "</text>";
    }
    var child = json.children ? jsonToWxml(json.children) : '';
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
    if (json.node === 'root') {
        return child;
    }
    if (json.node === 'comment') {
        return '<!--' + json.text + '-->';
    }
    if (json.node != 'element') {
        return child;
    }
    if (json.tag == 'img') {
        var attr_1 = parseNodeAttr(json.attrs, 'image');
        return "<image" + attr_1 + "></image>";
    }
    if (json.tag == 'input') {
        return parseInput(json);
    }
    if (json.tag == 'button') {
        return parseButton(json);
    }
    if (json.tag == 'form') {
        var attr_2 = parseNodeAttr(json.attrs, json.tag);
        return "<form" + attr_2 + ">" + child + "</form>";
    }
    if (['slider', 'icon', 'progress', 'switch', 'radio', 'checkbox', 'live-player', 'live-pusher'].indexOf(json.tag + '') >= 0) {
        var attr_3 = parseNodeAttr(json.attrs, json.tag);
        return "<" + json.tag + attr_3 + "/>";
    }
    child = parseChildren(json);
    if (['label', 'slot', 'style',
        'script', 'template', 'view', 'scroll-view', 'swiper', 'block',
        'swiper-item', 'movable-area', 'movable-view', 'cover-view', 'video',
        'rich-text', 'picker', 'picker-view', 'picker-view-column', 'checkbox-group', 'radio-group', 'navigator', 'functional-page-navigator', 'audio', 'image', 'camera', 'map', 'canvas',
        'open-data', 'web-view', 'ad', 'official-account'
    ].indexOf(json.tag + '') >= 0) {
        var attr_4 = parseNodeAttr(json.attrs, json.tag);
        return "<" + json.tag + attr_4 + ">" + child + "</" + json.tag + ">";
    }
    if (json.tag == 'textarea') {
        json.attrs = Object.assign({}, json.attrs, {
            vlaue: child
        });
        var attr_5 = parseNodeAttr(json.attrs, json.tag);
        return "<textarea" + attr_5 + "/>";
    }
    if (json.tag == 'a') {
        var attr_6 = parseNodeAttr(json.attrs, 'navigator');
        return "<navigator" + attr_6 + ">" + child + "</navigator>";
    }
    if (['i', 'span', 'strong', 'font', 'em', 'b'].indexOf(json.tag + '') >= 0
        && (!json.children || (json.children.length == 1 && json.children[0].node == 'text'))) {
        var attr_7 = parseNodeAttr(json.attrs, 'text');
        return "<text" + attr_7 + ">" + child + "</text>";
    }
    var attr = parseNodeAttr(json.attrs);
    if (json.tag && exclude.test(json.tag)) {
        return "<" + json.tag + attr + ">" + child + "</" + json.tag + ">";
    }
    return "<view" + attr + ">" + child + "</view>";
    function q(v) {
        return '"' + v + '"';
    }
    function parseChildren(node) {
        if (!node.children) {
            return '';
        }
        if (node.children.length == 1 && node.children[0].node == 'text') {
            return node.children[0].text + '';
        }
        return jsonToWxml(node.children);
    }
    function parseNodeAttr(attrs, tag) {
        if (tag === void 0) { tag = 'view'; }
        var str = '';
        if (!attrs) {
            return str;
        }
        for (var key in attrs) {
            if (!attrs.hasOwnProperty(key)) {
                continue;
            }
            if (disallow_attrs.indexOf(key) >= 0) {
                continue;
            }
            var value = attrs[key];
            var ext = '';
            if (replace_attrs.hasOwnProperty(key)) {
                var attr_8 = replace_attrs[key];
                if (typeof attr_8 === 'function') {
                    var args = attr_8(value, tag);
                    key = args[0];
                    value = args[1];
                    if (args.length > 2) {
                        ext = ' ' + args[2];
                    }
                }
                else if (typeof attr_8 === 'boolean') {
                    continue;
                }
                else {
                    key = attr_8;
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
        }
        return str;
    }
    function parseButton(node) {
        var attr = parseNodeAttr(node.attrs);
        if (node.attrs && ['reset', 'submit'].indexOf(node.attrs.type + '') >= 0) {
            attr += ' form-type=' + q(node.attrs.type);
        }
        var text = parseChildren(node);
        return "<button type=\"default\"" + attr + ">" + text + "</button>";
    }
    function parseInput(node) {
        if (!node.attrs) {
            node.attrs = {
                type: 'text'
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
            var attr_9 = parseNodeAttr(node.attrs, node.attrs.type);
            return "<checkbox" + attr_9 + "/>";
        }
        if (node.attrs.type == 'radio') {
            var attr_10 = parseNodeAttr(node.attrs, node.attrs.type);
            return "<radio" + attr_10 + "/>";
        }
        if (['text', 'number', 'idcard', 'digit'].indexOf(node.attrs.type + '') < 0) {
            node.attrs.type = 'text';
        }
        var attr = parseNodeAttr(node.attrs, 'input');
        return "<input" + attr + "/>";
    }
}
exports.jsonToWxml = jsonToWxml;
function htmlToWxml(content) {
    var elements = htmlToJson(content);
    return jsonToWxml(elements);
}
exports.htmlToWxml = htmlToWxml;
function parsePage(content) {
    content = content.replace(/import.+?from\s+.+?\.vue["'];/, '')
        .replace(/import.+?from\s+.+?typings.+?;/, '').replace(/@WxJson\([\s\S]+?\)/, '');
    var match = content.match(/(export\s+(default\s+)?)?class\s+(\S+)\s+extends\s(WxPage|WxComponent)[^\s\{]+/);
    if (!match) {
        return content;
    }
    content = parseMethodToObject(content, {
        'methods': '@WxMethod',
        'lifetimes': '@WxLifeTime',
        'pageLifetimes': '@WxPageLifeTime'
    }).replace(match[0], 'class ' + match[3]);
    var reg = new RegExp('(Page|Component)\\(new\\s+' + match[3]);
    if (reg.test(content)) {
        return content;
    }
    return content + LINE_SPLITE + (match[4].indexOf('Page') > 0 ? 'Page' : 'Component') + '(new ' + match[3] + '());';
}
exports.parsePage = parsePage;
function parseJson(content, append) {
    var match = content.match(/@WxJson(\([\s\S]+?\))/);
    if (!match) {
        return null;
    }
    return JSON.stringify(Object.assign({}, append, eval(match[1].trim())));
}
exports.parseJson = parseJson;
function parseMethodToObject(content, maps) {
    var str_count = function (search, line) {
        return line.split(search).length - 1;
    }, get_tag = function (line) {
        for (var key in maps) {
            if (maps.hasOwnProperty(key) && line.indexOf(maps[key]) >= 0) {
                return key;
            }
        }
        return;
    }, lines = content.split(LINE_SPLITE), num = 0, inMethod = 0, method, data = {}, block = [];
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
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
                    i: i,
                    items: []
                };
            }
            continue;
        }
        if (inMethod < 1) {
            continue;
        }
        var leftNum = str_count('{', line);
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
    for (var key in data) {
        if (!data.hasOwnProperty(key)) {
            continue;
        }
        var reg = new RegExp(key + '[^=\\{\\}\\(\\)]*=\\s*\\{');
        if (!reg.test(content)) {
            lines[data[key].i] = key + '={' + data[key].items.join(',') + '}';
            delete data[key];
        }
    }
    content = lines.join(LINE_SPLITE);
    for (var key in data) {
        if (!data.hasOwnProperty(key)) {
            continue;
        }
        var reg = new RegExp(key + '[^=\\{\\}\\(\\)]*=\\s*\\{');
        content = content.replace(reg, key + '={' + data[key].items.join(',') + ',');
    }
    return content;
}
exports.parseMethodToObject = parseMethodToObject;
function ttfToBase64(file) {
    var content = fs.readFileSync(file);
    return 'url(\'data:font/truetype;charset=utf-8;base64,' + content.toString('base64') + '\') format(\'truetype\')';
}
exports.ttfToBase64 = ttfToBase64;
function replaceTTF(content, folder) {
    var reg = /@font-face\s*\{[^\{\}]+\}/g;
    var matches = content.match(reg);
    if (!matches || matches.length < 1) {
        return content;
    }
    var nameReg = /font-family:\s*[^;\{\}\(\)]+/;
    var ttfReg = /url\(\s*['"]?([^\(\)]+\.ttf)/;
    for (var _i = 0, matches_1 = matches; _i < matches_1.length; _i++) {
        var macth = matches_1[_i];
        var nameMatch = macth.match(nameReg);
        if (!nameMatch) {
            continue;
        }
        var name_1 = nameMatch[0];
        var ttfMatch = macth.match(ttfReg);
        if (!ttfMatch) {
            continue;
        }
        var ttf = ttfMatch[1];
        ttf = path.resolve(folder, ttf);
        ttf = ttfToBase64(ttf);
        content = content.replace(macth, "@font-face {\n            " + name_1 + ";\n            src: " + ttf + ";\n        }");
    }
    return content;
}
exports.replaceTTF = replaceTTF;
function preImport(content) {
    var matches = content.match(/(@import.+;)/g);
    if (!matches || matches.length < 1) {
        return content;
    }
    for (var _i = 0, matches_2 = matches; _i < matches_2.length; _i++) {
        var item = matches_2[_i];
        if (item.indexOf('.scss') < 0 && item.indexOf('.sass') < 0) {
            continue;
        }
        content = content.replace(item, '/** parser[' + item + ']parser **/');
    }
    return content;
}
exports.preImport = preImport;
function endImport(content) {
    var matches = content.match(/\/\*\*\s{0,}parser\[(@.+)\]parser\s{0,}\*\*\//g);
    if (!matches || matches.length < 1) {
        return content;
    }
    for (var _i = 0, matches_3 = matches; _i < matches_3.length; _i++) {
        var item = matches_3[_i];
        content = content.replace(item[0], item[1].replace('.scss', '.wxss').replace('.sass', '.wxss').replace('/src/', '/'));
    }
    return content;
}
exports.endImport = endImport;
