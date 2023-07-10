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
    function ThemeStyleCompiler(autoDark, useVar, varPrefix, tokenizer, compiler) {
        if (autoDark === void 0) { autoDark = true; }
        if (useVar === void 0) { useVar = false; }
        if (varPrefix === void 0) { varPrefix = 'zre'; }
        if (tokenizer === void 0) { tokenizer = new tokenizer_1.StyleTokenizer(); }
        if (compiler === void 0) { compiler = new style_1.StyleCompiler(); }
        this.autoDark = autoDark;
        this.useVar = useVar;
        this.varPrefix = varPrefix;
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
        var _b = this.splitThemeStyle(themeOption, items), finishItems = _b[0], appendItems = _b[1], hasThemeDefine = _b[2];
        if (appendItems.length < 1) {
            return finishItems;
        }
        if (this.useVar) {
            if (hasThemeDefine) {
                return finishItems;
            }
            return __spreadArray(__spreadArray([], this.formatThemeHeader(themeOption), true), finishItems, true);
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
    ThemeStyleCompiler.prototype.formatThemeHeader = function (themeOption) {
        var _this = this;
        var items = [];
        var toThemeVar = function (data, root) {
            var children = [];
            (0, util_1.eachObject)(data, function (v, k) {
                children.push({
                    type: tokenizer_1.StyleTokenType.STYLE,
                    name: _this.formatVarKey(k),
                    content: v
                });
            });
            return {
                type: tokenizer_1.StyleTokenType.STYLE_GROUP,
                name: root,
                children: children,
            };
        };
        (0, util_1.eachObject)(themeOption, function (data, key) {
            if (key === 'default') {
                items.push(toThemeVar(data, ':root'));
                return;
            }
            items.push(toThemeVar(data, '.theme-' + key));
            if (key === 'dark' && _this.autoDark) {
                items.push({
                    type: tokenizer_1.StyleTokenType.STYLE_GROUP,
                    name: ['@media (prefers-color-scheme: dark)'],
                    children: [toThemeVar(data, ':root')]
                });
            }
        });
        return items;
    };
    ThemeStyleCompiler.prototype.themeStyle = function (themeOption, item, theme) {
        var _this = this;
        if (theme === void 0) { theme = 'default'; }
        var hasCall = false;
        var res = (0, util_1.regexReplace)(item.content, /(,|\s|\(|^)@([a-zA-Z_\.]+)/g, function (match) {
            var _a = _this.themeStyleValue(themeOption, match[2], theme), val = _a[0], isCall = _a[1];
            if (isCall) {
                hasCall = true;
            }
            return match[1] + val;
        });
        return [res, hasCall];
    };
    ThemeStyleCompiler.prototype.splitThemeStyle = function (themeOption, data) {
        var source = [];
        var append = [];
        var hasDefine = false;
        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
            var item = data_1[_i];
            if (this.isThemeDef(item)) {
                hasDefine = true;
                continue;
            }
            if (this.isThemeStyle(item)) {
                var _a = this.themeStyle(themeOption, item), val = _a[0], isCall = _a[1];
                if (isCall) {
                    append.push(__assign({}, item));
                }
                item.content = val;
            }
            if (item.type !== tokenizer_1.StyleTokenType.STYLE_GROUP || !item.children || item.children.length < 1) {
                source.push(item);
                continue;
            }
            var _b = this.splitThemeStyle(themeOption, item.children), s = _b[0], a = _b[1];
            if (a.length > 0) {
                append.push(__assign(__assign({}, item), { children: a }));
            }
            source.push(__assign(__assign({}, item), { children: s }));
        }
        return [source, append, hasDefine];
    };
    ThemeStyleCompiler.prototype.cloneStyle = function (themeOption, data, theme) {
        var children = [];
        for (var _i = 0, data_2 = data; _i < data_2.length; _i++) {
            var item = data_2[_i];
            if (this.isThemeStyle(item)) {
                children.push(__assign(__assign({}, item), { content: this.themeStyle(themeOption, item, theme)[0] }));
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
            return [
                this.useVar ? "var(".concat(this.formatVarKey(name), ")") : themeOption[theme][name],
                true
            ];
        }
        if (name.indexOf('.') >= 0) {
            _a = (0, util_1.splitStr)(name, '.', 2), theme = _a[0], name = _a[1];
            if (themeOption[theme][name]) {
                return [themeOption[theme][name], false];
            }
        }
        throw new Error("[".concat(theme, "].").concat(name, " is error value"));
    };
    ThemeStyleCompiler.prototype.formatVarKey = function (name) {
        return "--".concat(this.varPrefix, "-").concat((0, util_1.unStudly)(name));
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
