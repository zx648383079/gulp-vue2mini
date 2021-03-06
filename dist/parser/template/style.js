"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StyleParser = void 0;
var path = require("path");
var compiler_1 = require("../../compiler");
var tokenizer_1 = require("../../tokenizer");
var compiler_2 = require("../../compiler");
var util_1 = require("../../util");
var StyleParser = (function () {
    function StyleParser(project) {
        this.project = project;
        this.themeItems = {};
        this.tokenizer = new tokenizer_1.StyleTokenizer();
        this.compiler = new compiler_2.ThemeStyleCompiler();
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
        var _this = this;
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
            this.project.link.lock(file.src, function () {
                _this.project.link.trigger('theme', file.mtime);
            });
        }
        this.project.link.push('theme', file.src);
        content = this.compiler.formatThemeCss(blockItems, this.themeItems);
        return this.renderImport(content, file);
    };
    StyleParser.prototype.pushTheme = function (items) {
        for (var key in items) {
            if (Object.prototype.hasOwnProperty.call(items, key)) {
                this.themeItems[key] = Object.assign(Object.prototype.hasOwnProperty.call(this.themeItems, key) ? this.themeItems[key] : {}, items[key]);
            }
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
        return util_1.regexReplace(content, /@(import|use)\s+["'](.+?)["'];*/g, function (match) {
            var importFile = path.resolve(folder, match[2].indexOf('.') > 0 ? match[2] : ('_' + match[2] + ext));
            _this.project.link.push(importFile, file.src);
            return _this.render(new compiler_1.CompilerFile(importFile, file.mtime));
        });
    };
    StyleParser.prototype.hasTheme = function (content) {
        return content.indexOf('@theme ') >= 0;
    };
    StyleParser.prototype.needTheme = function (content) {
        return /:.+@[a-z]+/.test(content);
    };
    StyleParser.prototype.importer = function (url, prev, done) {
        done({
            contents: this.render(new compiler_1.CompilerFile(url, 0)),
        });
    };
    return StyleParser;
}());
exports.StyleParser = StyleParser;
