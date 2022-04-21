"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.ThemeStyleCompiler = void 0;
var tokenizer_1 = require("../tokenizer");
var util_1 = require("../util");
var style_1 = require("./style");
var ThemeStyleCompiler = (function () {
    function ThemeStyleCompiler(autoDark, tokenizer, compiler) {
        if (autoDark === void 0) { autoDark = true; }
        if (tokenizer === void 0) { tokenizer = new tokenizer_1.StyleTokenizer(); }
        if (compiler === void 0) { compiler = new style_1.StyleCompiler(); }
        this.autoDark = autoDark;
        this.tokenizer = tokenizer;
        this.compiler = compiler;
    }
    ThemeStyleCompiler.prototype.render = function (data) {
        return this.formatThemeCss(data);
    };
    ThemeStyleCompiler.prototype.themeCss = function (items, themeOption) {
        var _a;
        var _this = this;
        if (!themeOption) {
            _a = this.separateThemeStyle(items), themeOption = _a[0], items = _a[1];
        }
        var _b = this.splitThemeStyle(themeOption, items), finishItems = _b[0], appendItems = _b[1];
        if (appendItems.length < 1) {
            return finishItems;
        }
        Object.keys(themeOption).forEach(function (theme) {
            if (theme === 'default') {
                return;
            }
            var children = _this.cloneStyle(themeOption, appendItems, theme);
            var cls = '.theme-' + theme;
            for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
                var item = children_1[_i];
                if (item.type !== tokenizer_1.StyleTokenType.STYLE_GROUP) {
                    continue;
                }
                if (item.name[0].indexOf('@media') >= 0) {
                    finishItems.push(__assign(__assign({}, item), { children: [
                            {
                                type: tokenizer_1.StyleTokenType.STYLE_GROUP,
                                name: [cls],
                                children: __spreadArray([], item.children, true)
                            }
                        ] }));
                    continue;
                }
                item.name = item.name.map(function (i) {
                    if (i.trim() === 'body') {
                        return 'body' + cls;
                    }
                    return cls + ' ' + i;
                });
                finishItems.push(item);
            }
        });
        if (this.autoDark && Object.prototype.hasOwnProperty.call(themeOption, 'dark')) {
            finishItems.push({
                type: tokenizer_1.StyleTokenType.STYLE_GROUP,
                name: ['@media (prefers-color-scheme: dark)'],
                children: this.cloneStyle(themeOption, appendItems, 'dark')
            });
        }
        return finishItems;
    };
    ThemeStyleCompiler.prototype.themeStyle = function (themeOption, item, theme) {
        var _this = this;
        if (theme === void 0) { theme = 'default'; }
        return (0, util_1.regexReplace)(item.content, /(,|\s|\(|^)@([a-zA-Z_\.]+)/g, function (match) {
            return match[1] + _this.themeStyleValue(themeOption, match[2], theme);
        });
    };
    ThemeStyleCompiler.prototype.splitThemeStyle = function (themeOption, data) {
        var source = [];
        var append = [];
        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
            var item = data_1[_i];
            if (this.isThemeDef(item)) {
                continue;
            }
            if (this.isThemeStyle(item)) {
                append.push(__assign({}, item));
                item.content = this.themeStyle(themeOption, item);
            }
            if (item.type !== tokenizer_1.StyleTokenType.STYLE_GROUP || !item.children || item.children.length < 1) {
                source.push(item);
                continue;
            }
            var _a = this.splitThemeStyle(themeOption, item.children), s = _a[0], a = _a[1];
            if (a.length > 0) {
                append.push(__assign(__assign({}, item), { children: a }));
            }
            source.push(__assign(__assign({}, item), { children: s }));
        }
        return [source, append];
    };
    ThemeStyleCompiler.prototype.cloneStyle = function (themeOption, data, theme) {
        var children = [];
        for (var _i = 0, data_2 = data; _i < data_2.length; _i++) {
            var item = data_2[_i];
            if (this.isThemeStyle(item)) {
                children.push(__assign(__assign({}, item), { content: this.themeStyle(themeOption, item, theme) }));
                continue;
            }
            if (item.type !== tokenizer_1.StyleTokenType.STYLE_GROUP) {
                children.push(item);
                continue;
            }
            children.push(__assign(__assign({}, item), { name: __spreadArray([], item.name, true), children: this.cloneStyle(themeOption, item.children, theme) }));
        }
        return children;
    };
    ThemeStyleCompiler.prototype.themeStyleValue = function (themeOption, name, theme) {
        var _a;
        if (theme === void 0) { theme = 'default'; }
        if (themeOption[theme][name]) {
            return themeOption[theme][name];
        }
        if (name.indexOf('.') >= 0) {
            _a = (0, util_1.splitStr)(name, '.', 2), theme = _a[0], name = _a[1];
            if (themeOption[theme][name]) {
                return themeOption[theme][name];
            }
        }
        throw new Error("[".concat(theme, "].").concat(name, " is error value"));
    };
    ThemeStyleCompiler.prototype.isThemeStyle = function (item) {
        if (item.type !== tokenizer_1.StyleTokenType.STYLE) {
            return false;
        }
        return /(,|\s|\(|^)@[a-z]/.test(item.content);
    };
    ThemeStyleCompiler.prototype.formatThemeCss = function (content, themeOption) {
        var items;
        if (typeof content !== 'object') {
            if (content.trim().length < 1) {
                return content;
            }
            this.tokenizer.autoIndent(content);
            items = this.tokenizer.render(content);
        }
        else {
            items = content;
        }
        items = this.themeCss(items, themeOption);
        return this.compiler.render(items);
    };
    ThemeStyleCompiler.prototype.separateThemeStyle = function (items) {
        var themeOption = {};
        var appendTheme = function (item) {
            var _a;
            var name = item.name[0].substring(7).trim();
            if (!themeOption[name]) {
                themeOption[name] = {};
            }
            (_a = item.children) === null || _a === void 0 ? void 0 : _a.forEach(function (i) {
                if (i.type === tokenizer_1.StyleTokenType.STYLE) {
                    themeOption[name][i.name] = i.content;
                }
            });
        };
        var sourceItems = [];
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var item = items_1[_i];
            if (this.isThemeDef(item)) {
                appendTheme(item);
                continue;
            }
            sourceItems.push(item);
        }
        return [themeOption, sourceItems];
    };
    ThemeStyleCompiler.prototype.isThemeDef = function (item) {
        return item.type === tokenizer_1.StyleTokenType.STYLE_GROUP && item.name[0].indexOf('@theme ') === 0;
    };
    return ThemeStyleCompiler;
}());
exports.ThemeStyleCompiler = ThemeStyleCompiler;
