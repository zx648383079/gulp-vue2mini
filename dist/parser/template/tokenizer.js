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
exports.ThemeTokenizer = exports.REGEX_ASSET = void 0;
var cache_1 = require("../../util/cache");
var path = require("path");
var util_1 = require("../../util");
exports.REGEX_ASSET = /(src|href|action)=["']([^"'\>]+)/g;
var ThemeTokenizer = (function () {
    function ThemeTokenizer(project) {
        this.project = project;
        this.cachesFiles = new cache_1.CacheManger();
    }
    ThemeTokenizer.prototype.render = function (file) {
        var _this = this;
        var time = file.mtime;
        if (this.cachesFiles.has(file.src, time)) {
            return this.cachesFiles.get(file.src);
        }
        var tokens = [];
        var isLayout = false;
        var canRender = true;
        var currentFolder = file.dirname;
        var ext = file.extname;
        var pageData = {};
        var replacePath = function (text) {
            return text.replace(exports.REGEX_ASSET, function ($0, _, $2) {
                if ($2.indexOf('#') === 0 || $2.indexOf('javascript:') === 0) {
                    return $0;
                }
                if ($2.indexOf('://') >= 0) {
                    return $0;
                }
                if ($2.charAt(0) === '/') {
                    return $0;
                }
                return $0.replace($2, path.resolve(currentFolder, $2));
            });
        };
        (0, util_1.splitLine)(this.project.fileContent(file)).forEach(function (line, i) {
            var token = _this.converterToken(line);
            if (!token) {
                tokens.push({
                    type: 'text',
                    content: replacePath(line)
                });
                return;
            }
            if (token.type === 'set') {
                var _a = (0, util_1.splitStr)(token.content, '=', 2), key = _a[0], val = _a[1];
                pageData[key.trim()] = val;
                return;
            }
            if (token.type === 'comment' && i < 1) {
                token.type = 'layout';
                canRender = false;
            }
            if (token.type === 'content') {
                isLayout = true;
            }
            if (token.type === 'random') {
                token.content = replacePath(token.content);
            }
            if (token.type === 'extend') {
                if (token.content.indexOf('.') <= 0) {
                    token.content += ext;
                }
                token.content = path.resolve(currentFolder, token.content);
                _this.project.link.push(token.content, file.src);
            }
            tokens.push(token);
        });
        var page = {
            tokens: tokens,
            isLayout: isLayout,
            file: file.src,
            canRender: canRender,
            data: pageData
        };
        this.cachesFiles.set(file.src, page, time);
        return page;
    };
    ThemeTokenizer.prototype.converterToken = function (line) {
        var _a;
        line = line.trim();
        if (line.length < 0) {
            return;
        }
        if (line.charAt(0) !== '@') {
            return;
        }
        var content = line.substring(1);
        var comment = '';
        var i = content.indexOf(' ');
        if (i > 0) {
            comment = content.substring(i).trim();
            content = content.substring(0, i);
        }
        if (content.length < 1) {
            return;
        }
        if (content === 'theme') {
            return;
        }
        var type = 'extend';
        if (content === '@') {
            type = 'comment';
        }
        else if (content === '...') {
            type = 'content';
        }
        else if (content.charAt(0) === '~' && line.indexOf('@@') > 2) {
            type = 'random';
            content = line.substring(2);
        }
        else if (content.charAt(0) === '=') {
            type = 'echo';
            content = content.substring(1);
        }
        else if (content.indexOf('=') > 0) {
            type = 'set';
        }
        if (type === 'extend' && /[\<\>]/.test(content)) {
            return;
        }
        var amount = '1';
        if (type === 'extend' && content.indexOf('@') > 0) {
            _a = content.split('@'), content = _a[0], amount = _a[1];
        }
        return {
            type: type,
            content: content,
            comment: comment,
            amount: parseInt(amount, 10) || 1,
        };
    };
    ThemeTokenizer.prototype.mergeData = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        return Object.assign.apply(Object, __spreadArray([{}], items.filter(function (i) { return !!i; }), false));
    };
    ThemeTokenizer.prototype.echoValue = function (data, key) {
        key = key.trim();
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            return data[key];
        }
        throw new Error('[' + key + ']: page data error');
    };
    return ThemeTokenizer;
}());
exports.ThemeTokenizer = ThemeTokenizer;
