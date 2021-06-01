"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StyleParser = void 0;
var css_1 = require("../css");
var path = require("path");
var REGEX_SASS_IMPORT = /@(import|use)\s+["'](.+?)["'];/g;
var StyleParser = (function () {
    function StyleParser(project) {
        this.project = project;
        this.themeItems = {};
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
        var content = this.project.fileContent(file);
        var needTheme = this.needTheme(content);
        var hasTheme = this.hasTheme(content);
        if (!needTheme && !hasTheme) {
            return content;
        }
        var blockItems = css_1.cssToJson(content);
        if (hasTheme) {
            var _a = css_1.separateThemeStyle(blockItems), theme = _a[0], items = _a[1];
            this.pushTheme(theme);
            blockItems = items;
            this.project.link.lock(file.src, function () {
                _this.project.link.trigger('theme', file.mtime);
            });
        }
        this.project.link.push('theme', file.src);
        content = css_1.blockToString(css_1.themeCss(blockItems, this.themeItems));
        if (file.type === 'scss' || file.type === 'sass') {
            this.sassImport(content, file.src);
        }
        return content;
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
        var theme = css_1.separateThemeStyle(css_1.cssToJson(content))[0];
        this.pushTheme(theme);
    };
    StyleParser.prototype.hasTheme = function (content) {
        return content.indexOf('@theme ') >= 0;
    };
    StyleParser.prototype.needTheme = function (content) {
        return /:.+@[a-z]+/.test(content);
    };
    StyleParser.prototype.sassImport = function (content, file) {
        if (content.length < 6) {
            return;
        }
        var ext = path.extname(file);
        var folder = path.dirname(file);
        var res;
        while (true) {
            res = REGEX_SASS_IMPORT.exec(content);
            if (!res) {
                break;
            }
            this.project.link.push(path.resolve(folder, res[2].indexOf('.') > 0 ? res[2] : ('_' + res[2] + ext)), file);
        }
    };
    return StyleParser;
}());
exports.StyleParser = StyleParser;
