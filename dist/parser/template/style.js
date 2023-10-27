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
exports.StyleParser = void 0;
var path = require("path");
var compiler_1 = require("../../compiler");
var tokenizer_1 = require("../../tokenizer");
var compiler_2 = require("../../compiler");
var util_1 = require("../../util");
var StyleParser = (function () {
    function StyleParser(project) {
        var _this = this;
        var _a;
        this.project = project;
        this.themeItems = {};
        this.tokenizer = new tokenizer_1.StyleTokenizer();
        this.preppendItems = [];
        this.themeUsedKeys = [];
        this.importer = {
            canonicalize: function (url, _) {
                return new URL(url);
            },
            load: function (url) {
                var fileName = url.toString();
                var ext = (0, util_1.getExtensionName)(fileName);
                return {
                    contents: _this.renderPart(new compiler_1.CompilerFile(fileName, 0, undefined, ext)),
                    syntax: ext === 'sass' ? 'indented' : 'scss'
                };
            }
        };
        var varPrefix = (_a = this.project.options) === null || _a === void 0 ? void 0 : _a.prefix;
        this.compiler = new compiler_2.ThemeStyleCompiler(true, typeof varPrefix === 'string' && varPrefix.length > 0, varPrefix !== null && varPrefix !== void 0 ? varPrefix : 'zre');
    }
    Object.defineProperty(StyleParser.prototype, "length", {
        get: function () {
            return Object.keys(this.themeItems).length;
        },
        enumerable: false,
        configurable: true
    });
    StyleParser.prototype.get = function (theme) {
        return Object.prototype.hasOwnProperty.call(this.themeItems, theme) ? this.themeItems[theme] : undefined;
    };
    StyleParser.prototype.render = function (file) {
        this.preppendItems = [];
        this.themeUsedKeys = [];
        var content = this.renderPart(file, true);
        return __spreadArray(__spreadArray([], this.preppendItems, true), [this.compiler.renderTheme(this.themeItems, this.themeUsedKeys), content], false).join('\n');
    };
    StyleParser.prototype.renderPart = function (file, isEntry) {
        var _this = this;
        if (isEntry === void 0) { isEntry = false; }
        var content = file.content ? file.content : this.project.fileContent(file);
        var needTheme = this.needTheme(content);
        var hasTheme = this.hasTheme(content);
        if (!needTheme && !hasTheme) {
            return this.renderImport(content, file);
        }
        var blockItems = this.tokenizer.render(content);
        if (hasTheme) {
            var _a = this.compiler.separateThemeStyle(blockItems), theme = _a[0], items = _a[1];
            this.pushTheme(theme);
            blockItems = items;
            if (isEntry) {
                this.project.link.lock(file.src, function () {
                    _this.project.link.trigger('theme', file.mtime);
                });
            }
        }
        this.project.link.push('theme', file.src);
        var _b = this.compiler.renderAny(blockItems, this.themeItems), res = _b[0], _ = _b[1], keys = _b[2];
        if (keys.length > 0) {
            for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                var key = keys_1[_i];
                if (this.themeUsedKeys.indexOf(key) >= 0) {
                    continue;
                }
                this.themeUsedKeys.push(key);
            }
        }
        return this.renderImport(res, file);
    };
    StyleParser.prototype.pushTheme = function (items) {
        var _a;
        for (var key in items) {
            if (Object.prototype.hasOwnProperty.call(items, key)) {
                this.themeItems[key] = Object.assign(Object.prototype.hasOwnProperty.call(this.themeItems, key) ? this.themeItems[key] : {}, items[key]);
            }
        }
        if ((_a = this.project.options) === null || _a === void 0 ? void 0 : _a.debug) {
            this.project.logger.debug(items);
        }
    };
    StyleParser.prototype.extractTheme = function (content) {
        if (!this.hasTheme(content)) {
            return;
        }
        var theme = this.compiler.separateThemeStyle(this.tokenizer.render(content))[0];
        this.pushTheme(theme);
    };
    StyleParser.prototype.renderImport = function (content, file) {
        var _this = this;
        if (file.type !== 'scss' && file.type !== 'sass') {
            return content;
        }
        if (content.length < 6) {
            return content;
        }
        var ext = file.extname;
        var folder = file.dirname;
        return (0, util_1.regexReplace)(content, /@(import|use)\s+["'](.+?)["'];*/g, function (match) {
            if (match[2].startsWith('sass:')) {
                _this.preppendItems.push(match[0]);
                return '';
            }
            var importFile = path.resolve(folder, match[2].indexOf('.') > 0 ? match[2] : ('_' + match[2] + ext));
            _this.project.link.push(importFile, file.src);
            return _this.renderPart(new compiler_1.CompilerFile(importFile, file.mtime, undefined, (0, util_1.getExtensionName)(importFile)));
        });
    };
    StyleParser.prototype.hasTheme = function (content) {
        return content.indexOf('@theme ') >= 0;
    };
    StyleParser.prototype.needTheme = function (content) {
        return /:.+@[a-z]+/.test(content);
    };
    return StyleParser;
}());
exports.StyleParser = StyleParser;
