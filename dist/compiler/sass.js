"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SassCompiler = void 0;
var tokenizer_1 = require("../tokenizer");
var util_1 = require("../util");
var style_1 = require("./style");
var SassCompiler = (function () {
    function SassCompiler(tokenizer, compiler) {
        if (tokenizer === void 0) { tokenizer = new tokenizer_1.StyleTokenizer(); }
        if (compiler === void 0) { compiler = new style_1.StyleCompiler(); }
        this.tokenizer = tokenizer;
        this.compiler = compiler;
    }
    SassCompiler.prototype.render = function (data) {
        if (typeof data !== 'object') {
            this.tokenizer.autoIndent(data);
            data = this.tokenizer.render(data);
        }
        return this.compiler.render(this.splitBlock(data));
    };
    SassCompiler.prototype.splitRuleName = function (name) {
        name = name.trim();
        if (name.length < 2) {
            return [name];
        }
        var tags = {
            '[': ']',
            '(': ')',
        };
        var args = [];
        var tag = '';
        var pos = 0;
        if (name.charAt(pos) === '&') {
            var k = name.charAt(pos + 1);
            var i = pos + 1;
            while (i < name.length) {
                if (name.charAt(++i) !== k) {
                    break;
                }
            }
            tag = name.substring(pos, i);
            pos = i + 1;
        }
        var appendTag = function () {
            var item = tag.trim();
            tag = '';
            if (item.length < 1) {
                return;
            }
            var c = item.charAt(0);
            if (c === '&') {
                args.push(item);
                return;
            }
            if (c === '>' || c === '+' || c === '~') {
                args.push('&' + item);
                return;
            }
            args.push(item);
        };
        var startTag = '';
        var endTag = '';
        var endCount = 0;
        while (pos < name.length) {
            var code = name.charAt(pos);
            pos++;
            if (endCount > 0) {
                tag += code;
                if (code === startTag) {
                    endCount++;
                }
                else if (code === endTag) {
                    endCount--;
                }
                continue;
            }
            if (Object.prototype.hasOwnProperty.call(tags, code)) {
                startTag = code;
                endTag = tags[code];
                endCount = 1;
                tag += code;
                continue;
            }
            if (code === '>' || code === '~' || code === '+') {
                appendTag();
                var i = pos;
                while (i < name.length) {
                    if (!(0, util_1.isEmptyCode)(name.charAt(i))) {
                        break;
                    }
                    i++;
                }
                tag = (args.length > 0 ? '&' : '') + code;
                pos = i;
                continue;
            }
            if (code === '.') {
                appendTag();
                tag = (args.length > 0 && !(0, util_1.isEmptyCode)(name.charAt(pos - 2)) ? '&' : '') + code;
                continue;
            }
            if (code === ':') {
                appendTag();
                var i = pos;
                while (i < name.length) {
                    if (name.charAt(++i) !== ':') {
                        break;
                    }
                }
                tag = (args.length > 0 ? '&' : '') + name.substring(pos - 1, i);
                pos = i;
                continue;
            }
            if ((0, util_1.isEmptyCode)(code)) {
                appendTag();
                tag = '';
                continue;
            }
            tag += code;
        }
        appendTag();
        return args;
    };
    SassCompiler.prototype.splitBlock = function (items) {
        var _this = this;
        var data = [];
        var resetName = function (names, hasPrefix) {
            if (hasPrefix === void 0) { hasPrefix = false; }
            return names.map(function (val, j) {
                if (j === 0) {
                    return val.indexOf('&') === 0 && !hasPrefix ? val.substring(1) : val;
                }
                return val.indexOf('&') === 0 ? val.substring(1) : (' ' + val);
            }).join('');
        };
        var findTreeName = function (names) {
            if (names.length < 2) {
                return _this.splitRuleName(names[0]).map(function (i) {
                    return [i];
                });
            }
            var reverseArgs = [];
            var args = [];
            var cache = [];
            var getCacheName = function (i, j) {
                if (cache.length <= i) {
                    cache.push(_this.splitRuleName(names[i]));
                }
                var pos = j < 0 ? cache[i].length + j : j;
                if (pos >= cache[i].length) {
                    return '';
                }
                return cache[i][pos];
            };
            var getReverseName = function (i, j) {
                return getCacheName(i, -1 - j);
            };
            var index = 0;
            var isEnd = false;
            while (true) {
                var name_1 = getCacheName(0, index);
                if (name_1 === '') {
                    break;
                }
                isEnd = false;
                for (var i = 1; i < names.length; i++) {
                    if (name_1 !== getCacheName(i, index)) {
                        isEnd = true;
                        break;
                    }
                }
                if (isEnd) {
                    break;
                }
                args.push([name_1]);
                index++;
            }
            index = 0;
            while (true) {
                var name_2 = getReverseName(0, index);
                if (name_2 === '' || cache[0].length - index - 1 <= args.length) {
                    break;
                }
                isEnd = false;
                for (var i = 1; i < names.length; i++) {
                    if (name_2 !== getReverseName(i, index)) {
                        isEnd = true;
                        break;
                    }
                    if (cache[i].length - index - 1 <= args.length) {
                        isEnd = true;
                        break;
                    }
                }
                if (isEnd) {
                    break;
                }
                reverseArgs.push([name_2]);
                index++;
            }
            if (reverseArgs.length < 1 && args.length < 1) {
                return [names];
            }
            reverseArgs.push(names.map(function (i, j) {
                var c = cache.length > j ? cache[j] : _this.splitRuleName(i);
                var start = args.length;
                var end = c.length - reverseArgs.length;
                return resetName(c.splice(start, end - start), start > 0);
            }));
            return __spreadArray(__spreadArray([], args, true), reverseArgs.reverse(), true);
        };
        var arrEq = function (a, b) {
            if (a.length !== b.length) {
                return false;
            }
            for (var _i = 0, a_1 = a; _i < a_1.length; _i++) {
                var i = a_1[_i];
                if (b.indexOf(i) < 0) {
                    return false;
                }
            }
            return true;
        };
        var mergeStyle = function (parent, children) {
            children.forEach(function (i) {
                if (i.type !== tokenizer_1.StyleTokenType.STYLE) {
                    parent.push(i);
                    return;
                }
                for (var _i = 0, parent_1 = parent; _i < parent_1.length; _i++) {
                    var j = parent_1[_i];
                    if (j.type === tokenizer_1.StyleTokenType.STYLE && j.name === i.name) {
                        j.content = i.content;
                        return;
                    }
                }
                parent.push(i);
            });
        };
        var appendBlock = function (names, children, parent) {
            if (names.length < 1) {
                mergeStyle(parent, children);
                return;
            }
            var name = names.shift();
            for (var _i = 0, parent_2 = parent; _i < parent_2.length; _i++) {
                var item = parent_2[_i];
                if (item.type !== tokenizer_1.StyleTokenType.STYLE_GROUP) {
                    continue;
                }
                if (!arrEq(name, item.name)) {
                    continue;
                }
                if (!item.children) {
                    item.children = [];
                }
                appendBlock(names, children, item.children);
                return;
            }
            var block = {
                type: tokenizer_1.StyleTokenType.STYLE_GROUP,
                name: name,
                children: []
            };
            parent.push(block);
            appendBlock(names, children, block.children);
        };
        var createTree = function (item, parent) {
            if (item.type !== tokenizer_1.StyleTokenType.STYLE_GROUP) {
                parent.push(item);
                return;
            }
            var name = findTreeName(typeof item.name === 'object' ? item.name : [item.name]);
            appendBlock(name, item.children, parent);
        };
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var item = items_1[_i];
            createTree(item, data);
        }
        return data;
    };
    return SassCompiler;
}());
exports.SassCompiler = SassCompiler;
