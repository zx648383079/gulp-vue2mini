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
    StyleParser.prototype.render = function (content, file, lang) {
        if (lang === void 0) { lang = 'css'; }
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
        }
        content = css_1.blockToString(css_1.themeCss(blockItems, this.themeItems));
        if (lang === 'scss' || lang === 'sass') {
            this.sassImport(content, file);
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
