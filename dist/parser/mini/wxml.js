"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WxmlCompiler = void 0;
var tokenizer_1 = require("../../tokenizer");
var util_1 = require("../../util");
var FuncType;
(function (FuncType) {
    FuncType[FuncType["BIND"] = 0] = "BIND";
    FuncType[FuncType["TAP"] = 1] = "TAP";
    FuncType[FuncType["CONVERTER"] = 2] = "CONVERTER";
    FuncType[FuncType["FUNC"] = 3] = "FUNC";
})(FuncType || (FuncType = {}));
var WxmlCompiler = (function () {
    function WxmlCompiler(_, exclude, disallowAttrs) {
        if (exclude === void 0) { exclude = /^(.+[\-A-Z].+|[A-Z].+)$/; }
        if (disallowAttrs === void 0) { disallowAttrs = []; }
        var _this = this;
        this.exclude = exclude;
        this.disallowAttrs = disallowAttrs;
        this.tokenizer = new tokenizer_1.TemplateTokenizer();
        this.existFunc = {};
        this.replaceAttrs = {
            'v-if': function (value, _, attrs) {
                attrs.set('wx:if', '{{ ' + value + ' }}');
            },
            'v-model': function (value, tag, attrs) {
                var func = (0, util_1.studly)(value, false) + 'Changed';
                if (!Object.prototype.hasOwnProperty.call(_this.existFunc, func)) {
                    _this.existFunc[func] = {
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
                        _this.converterTap(val, key, attrs);
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
                _this.existFunc[func].append = append;
                attrs.set('value', '{{' + value + '}}');
                attrs.set(inputFunc, func);
            },
            'v-elseif': function (value, _, attrs) {
                attrs.set('wx:elif', '{{ ' + value + ' }}');
            },
            'v-else': 'wx:else',
            ':src': this.converterSrc,
            ':class': this.converterClass,
            'v-bind:class': this.converterClass,
            'v-bind:src': this.converterSrc,
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
                attrs.set('hidden', '{{ ' + _this.invertIf(value) + ' }}');
            },
            href: 'url',
            ':key': false,
            '@click': function (value, _, attrs) {
                _this.converterTap(value, 'bindtap', attrs);
            },
            '@click.stop': function (value, _, attrs) {
                if (typeof value === 'string') {
                    _this.converterTap(value, 'catchtap', attrs);
                    return;
                }
                var func = 'catchTaped';
                if (!Object.prototype.hasOwnProperty.call(_this.existFunc, func)) {
                    _this.existFunc[func] = {
                        type: FuncType.FUNC,
                    };
                }
                attrs.set('catchtap', func);
            },
            'v-on:click': function (value, _, attrs) {
                _this.converterTap(value, 'bindtap', attrs);
            },
            '(click)': function (value, _, attrs) {
                _this.converterTap(value, 'bindtap', attrs);
            },
            '@touchstart': function (value, _, attrs) {
                _this.converterTap(value, 'bindtouchstart', attrs);
            },
            '@touchmove': function (value, _, attrs) {
                _this.converterTap(value, 'bindtouchmove', attrs);
            },
            '@touchend': function (value, _, attrs) {
                _this.converterTap(value, 'bindtouchend', attrs);
            },
        };
    }
    WxmlCompiler.prototype.render = function (data) {
        if (typeof data !== 'object') {
            data = this.tokenizer.render(data);
        }
        this.existFunc = {};
        return this.renderFull(data);
    };
    WxmlCompiler.prototype.renderFull = function (json) {
        var _this = this;
        var content = json.toString(function (item, nextStr) {
            if (item.node === 'root') {
                return nextStr;
            }
            if (item.node === 'text') {
                if (/^\s+$/.test(item.text + '')) {
                    return '';
                }
                return "<text>".concat(item.text, "</text>");
            }
            if (item.node === 'comment') {
                return "<!-- ".concat(item.text, " -->");
            }
            if (item.node !== 'element') {
                return nextStr;
            }
            if (item.tag === 'img') {
                var attrs = _this.parseNodeAttr(item.attribute, 'image');
                return "<image".concat(attrs, "></image>");
            }
            if (item.tag === 'input') {
                return _this.parseInput(item);
            }
            if (item.tag === 'button') {
                return _this.parseButton(item, nextStr);
            }
            if (item.tag === 'form') {
                var attrs = _this.parseNodeAttr(item.attribute, item.tag);
                return "<form".concat(attrs, ">").concat(nextStr, "</form>");
            }
            if (['slider', 'icon', 'progress', 'switch', 'radio', 'checkbox', 'live-player', 'live-pusher'].indexOf(item.tag + '') >= 0) {
                var attrs = _this.parseNodeAttr(item.attribute, item.tag);
                return "<".concat(item.tag).concat(attrs, "/>");
            }
            if (['label', 'slot', 'style', 'text',
                'script', 'template', 'view', 'scroll-view', 'swiper', 'block',
                'swiper-item', 'movable-area', 'movable-view', 'cover-view', 'video',
                'rich-text', 'picker', 'picker-view', 'picker-view-column', 'checkbox-group', 'radio-group', 'editor', 'navigator', 'functional-page-navigator', 'audio', 'image', 'camera', 'map', 'canvas',
                'open-data', 'web-view', 'ad', 'official-account',
            ].indexOf(item.tag + '') >= 0) {
                var attrs = _this.parseNodeAttr(item.attribute, item.tag);
                nextStr = _this.removeIfText(item.children, nextStr);
                return "<".concat(item.tag).concat(attrs, ">").concat(nextStr, "</").concat(item.tag, ">");
            }
            if (item.tag === 'textarea') {
                if (nextStr.length > 0) {
                    item.attr('value', nextStr);
                }
                var attrs = _this.parseNodeAttr(item.attribute, item.tag);
                return "<textarea".concat(attrs, "/>");
            }
            if (item.tag === 'a') {
                var attrs = _this.parseNodeAttr(item.attribute, 'navigator');
                nextStr = _this.removeIfText(item.children, nextStr);
                return "<navigator".concat(attrs, ">").concat(nextStr, "</navigator>");
            }
            if (['i', 'span', 'strong', 'font', 'em', 'b'].indexOf(item.tag + '') >= 0
                && (!item.children || (item.children.length === 1 && item.children[0].node === 'text'))) {
                var attrs = _this.parseNodeAttr(item.attribute, 'text');
                nextStr = !item.children ? '' : item.children[0].text + '';
                return "<text".concat(attrs, ">").concat(nextStr, "</text>");
            }
            var attr = _this.parseNodeAttr(item.attribute);
            if (item.tag && _this.exclude.test(item.tag)) {
                return "<".concat(item.tag).concat(attr, ">").concat(nextStr, "</").concat(item.tag, ">");
            }
            return "<view".concat(attr, ">").concat(nextStr, "</view>");
        });
        var res = {
            template: content,
            func: this.renderFunc(this.existFunc),
        };
        this.existFunc = {};
        return res;
    };
    WxmlCompiler.prototype.renderFunc = function (funcMap) {
        var funcItems = [];
        for (var key in funcMap) {
            if (Object.prototype.hasOwnProperty.call(funcMap, key)) {
                var item = this.existFunc[key];
                if (item.type === FuncType.BIND) {
                    funcItems.push(this.createInputFunc(key, item.properties[0], item.append));
                    continue;
                }
                if (item.type === FuncType.FUNC) {
                    funcItems.push("".concat(key, "(){}"));
                    continue;
                }
                if (item.type === FuncType.TAP) {
                    var properties = item.properties;
                    funcItems.push(this.createTapFunc(key, properties[0], properties[1]));
                    continue;
                }
                if (item.type === FuncType.CONVERTER) {
                    var properties = item.properties;
                    funcItems.push(this.createTapCoverterFunc(key, properties[0], properties[1]));
                    continue;
                }
            }
        }
        return funcItems;
    };
    WxmlCompiler.prototype.removeIfText = function (children, str) {
        if (!children || children.length > 1 || children[0].node !== 'text') {
            return str;
        }
        return children[0].text + '';
    };
    WxmlCompiler.prototype.invertIf = function (value) {
        value = value.trim();
        if (value.charAt(0) === '!') {
            return value.substring(1);
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
        return "!(".concat(value, ")");
    };
    WxmlCompiler.prototype.converterSrc = function (value, _, attrs) {
        attrs.set('src', '{{ ' + value + ' }}');
    };
    WxmlCompiler.prototype.converterClass = function (value, _, attrs) {
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
            value.substring(1, value.length - 1).split(',').forEach(function (item) {
                var _a = item.split(':', 2), key = _a[0], con = _a[1];
                key = key.trim();
                con = con.trim();
                var isNot = con.charAt(0) === '!';
                var name = isNot ? con.substring(1).trim() : con;
                if (!Object.prototype.hasOwnProperty.call(clsObj_1, name)) {
                    clsObj_1[name] = ['', ''];
                }
                clsObj_1[name][isNot ? 1 : 0] += ' ' + key.replace(/''/g, '');
            });
            for (var key in clsObj_1) {
                if (Object.prototype.hasOwnProperty.call(clsObj_1, key)) {
                    block.push('(' + key + '?' + this.qStr(clsObj_1[key][0].trim()) + ':' + this.qStr(clsObj_1[key][1].trim()) + ')');
                }
            }
        }
        else if (value.charAt(0) === '[') {
            value.substring(1, value.length - 1).split(',').forEach(function (item) {
                block.push('\' \'');
                block.push('(' + item + ')');
            });
        }
        else {
            block.push('\' \'');
            block.push('(' + value + ')');
        }
        attrs.set('class', '{{ ' + block.join('+') + ' }}');
    };
    WxmlCompiler.prototype.converterTap = function (value, attrKey, attrs) {
        var _this = this;
        if (attrKey === void 0) { attrKey = 'bindtap'; }
        if (!attrKey) {
            attrKey = 'bindtap';
        }
        var addFun = function (key, val) {
            key = key.trim();
            var dataKey = (0, util_1.studly)(key);
            var f = 'tapItem' + dataKey;
            dataKey = dataKey.toLowerCase();
            if (!Object.prototype.hasOwnProperty.call(_this.existFunc, f)) {
                _this.existFunc[f] = {
                    type: FuncType.TAP,
                    properties: [key, dataKey],
                };
            }
            attrs.set(attrKey, f).set("data-".concat(dataKey), val);
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
            addFun(key, this.qv(val.trim()));
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
            var val = _this.qv(item.trim());
            lines.push(key);
            ext["data-".concat(key)] = val;
        });
        var funcTo = 'converter' + func;
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
    };
    WxmlCompiler.prototype.createInputFunc = function (name, property, append) {
        if (append === void 0) { append = []; }
        var line = append.join('');
        return "    ".concat(name, "(event: InputEvent) {\n            let data = this.data;\n            data.").concat(property, " = event.detail.value;").concat(line, "\n            this.setData(data);\n        }");
    };
    WxmlCompiler.prototype.createTapFunc = function (name, property, val) {
        return "    ".concat(name, "(e: TouchEvent) {\n            let data = this.data;\n            data.").concat(property, " = e.currentTarget.dataset.").concat(val, ";\n            this.setData(data);\n        }");
    };
    WxmlCompiler.prototype.createTapCoverterFunc = function (name, target, args) {
        var lines = [];
        args.forEach(function (item) {
            lines.push('e.currentTarget.dataset.' + item);
        });
        lines.push('e');
        var line = lines.join(', ');
        return "    ".concat(name, "(e: TouchEvent) {\n            this.").concat(target, "(").concat(line, ");\n        }");
    };
    WxmlCompiler.prototype.q = function (v) {
        if (typeof v === 'object' && v instanceof Array) {
            v = v.join(' ');
        }
        return '\'' + v + '\'';
    };
    WxmlCompiler.prototype.qStr = function (v) {
        if (/^[''](.+)['']$/.test(v)) {
            return v;
        }
        return '\'' + v + '\'';
    };
    WxmlCompiler.prototype.qv = function (val) {
        if (/^[\d\.]+$/.test(val)) {
            return val;
        }
        var match = val.match(/^[''](.+)['']$/);
        if (match) {
            return match[1];
        }
        return '{{ ' + val + ' }}';
    };
    WxmlCompiler.prototype.parseNodeAttr = function (attrs, tag) {
        var _this = this;
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
            if (_this.disallowAttrs.indexOf(key) >= 0) {
                return;
            }
            if (_this.replaceAttrs.hasOwnProperty(key)) {
                var attr = _this.replaceAttrs[key];
                if (typeof attr === 'function') {
                    attr.call(_this, value, tag, properties);
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
            var name = _this.parseEventName(key);
            if (name) {
                _this.converterTap(value, name, properties);
                return;
            }
            else if (key.charAt(0) === ':') {
                key = key.substring(1);
                value = '{{ ' + value + ' }}';
            }
            properties.set(key, value);
        });
        var str = properties.toString();
        return str.trim().length > 0 ? ' ' + str : '';
    };
    WxmlCompiler.prototype.parseEventName = function (name) {
        if (name.indexOf('bind:') === 0 || name.indexOf('bind') === 0) {
            return name;
        }
        if (name.charAt(0) === '@') {
            return 'bind:' + name.substring(1);
        }
        return undefined;
    };
    WxmlCompiler.prototype.parseButton = function (node, str) {
        var attr = this.parseNodeAttr(node.attribute);
        if (['reset', 'submit'].indexOf(node.attr('type') + '') >= 0) {
            attr += ' form-type=' + this.q(node.attr('type'));
        }
        return "<button type='default'".concat(attr, ">").concat(str, "</button>");
    };
    WxmlCompiler.prototype.parseInput = function (node) {
        var type = node.attr('type') || 'text';
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
            var attrs = this.parseNodeAttr(node.attribute, type);
            return "<checkbox".concat(attrs, "/>");
        }
        if (type === 'radio') {
            var attrs = this.parseNodeAttr(node.attribute, type);
            return "<radio".concat(attrs, "/>");
        }
        if (['text', 'number', 'idcard', 'digit'].indexOf(type + '') < 0) {
            type = 'text';
        }
        node.attr('type', type);
        var attr = this.parseNodeAttr(node.attribute, 'input');
        return "<input".concat(attr, "/>");
    };
    return WxmlCompiler;
}());
exports.WxmlCompiler = WxmlCompiler;
