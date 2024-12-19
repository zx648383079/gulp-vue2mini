import { StyleTokenizer, StyleTokenType } from '../tokenizer';
import { eachObject, regexReplace, splitStr, unStudly } from '../util';
import { StyleCompiler } from './style';
export class ThemeStyleCompiler {
    autoDark;
    useVar;
    varPrefix;
    tokenizer;
    compiler;
    constructor(autoDark = true, useVar = false, varPrefix = 'zre', tokenizer = new StyleTokenizer(), compiler = new StyleCompiler()) {
        this.autoDark = autoDark;
        this.useVar = useVar;
        this.varPrefix = varPrefix;
        this.tokenizer = tokenizer;
        this.compiler = compiler;
    }
    render(data) {
        return this.renderAny(data)[0];
    }
    renderTheme(themeOption, keys) {
        if (!themeOption || !this.useVar) {
            return '';
        }
        return this.compiler.render(this.formatThemeHeader(themeOption, keys));
    }
    renderString(content, themeOption) {
        if (!this.useVar || !themeOption) {
            return this.renderAny(content)[0];
        }
        if (content.trim().length < 1) {
            return content;
        }
        this.tokenizer.autoIndent(content);
        let tokens = this.tokenizer.render(content);
        let [items, theme, keys] = this.themeCss(tokens, themeOption);
        return this.compiler.render([...this.formatThemeHeader(theme, keys), ...items]);
    }
    renderAny(content, themeOption) {
        let tokens;
        if (typeof content !== 'object') {
            if (content.trim().length < 1) {
                return [content, themeOption, []];
            }
            this.tokenizer.autoIndent(content);
            tokens = this.tokenizer.render(content);
        }
        else {
            tokens = content;
        }
        const [items, theme, keys] = this.themeCss(tokens, themeOption);
        return [this.compiler.render(items), theme, keys];
    }
    themeCss(items, themeOption) {
        if (!themeOption) {
            [themeOption, items] = this.separateThemeStyle(items);
        }
        const [finishItems, appendItems, _, keys] = this.splitThemeStyle(themeOption, items);
        if (appendItems.length < 1 || this.useVar) {
            return [finishItems, themeOption, keys];
        }
        Object.keys(themeOption).forEach(theme => {
            if (theme === 'default') {
                return;
            }
            const children = this.cloneStyle(themeOption, appendItems, theme);
            const cls = '.theme-' + theme;
            for (const item of children) {
                if (item.type !== StyleTokenType.STYLE_GROUP) {
                    continue;
                }
                if (item.name[0].indexOf('@media') >= 0) {
                    finishItems.push({ ...item, children: [
                            {
                                type: StyleTokenType.STYLE_GROUP,
                                name: [cls],
                                children: [...item.children]
                            }
                        ] });
                    continue;
                }
                item.name = item.name.map(i => {
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
                type: StyleTokenType.STYLE_GROUP,
                name: ['@media (prefers-color-scheme: dark)'],
                children: this.cloneStyle(themeOption, appendItems, 'dark')
            });
        }
        return [finishItems, themeOption, keys];
    }
    formatThemeHeader(themeOption, keys) {
        if (typeof keys !== 'undefined' && keys.length === 0) {
            return [];
        }
        const items = [];
        const toThemeVar = (data, root) => {
            const children = [];
            eachObject(data, (v, k) => {
                if (typeof keys !== 'undefined' && keys.indexOf(k) < 0) {
                    return;
                }
                children.push({
                    type: StyleTokenType.STYLE,
                    name: this.formatVarKey(k),
                    content: v
                });
            });
            return {
                type: StyleTokenType.STYLE_GROUP,
                name: root,
                children,
            };
        };
        eachObject(themeOption, (data, key) => {
            if (key === 'default') {
                items.push(toThemeVar(data, ':root'));
                return;
            }
            items.push(toThemeVar(data, '.theme-' + key));
            if (key === 'dark' && this.autoDark) {
                items.push({
                    type: StyleTokenType.STYLE_GROUP,
                    name: ['@media (prefers-color-scheme: dark)'],
                    children: [toThemeVar(data, ':root')]
                });
            }
        });
        return items;
    }
    themeStyle(themeOption, item, theme = 'default') {
        const keys = [];
        const res = regexReplace(item.content, /(,|\s|\(|^)@([a-zA-Z_\.]+)/g, match => {
            const [val, callKey] = this.themeStyleValue(themeOption, match[2], theme);
            if (callKey) {
                keys.push(callKey);
            }
            return match[1] + val;
        });
        return [res, keys];
    }
    splitThemeStyle(themeOption, data) {
        const source = [];
        const append = [];
        const keys = [];
        let hasDefine = false;
        for (const item of data) {
            if (this.isThemeDef(item)) {
                hasDefine = true;
                continue;
            }
            if (this.isThemeStyle(item)) {
                const [val, callKeys] = this.themeStyle(themeOption, item);
                if (callKeys.length > 0) {
                    append.push({ ...item });
                    keys.push(...callKeys);
                }
                item.content = val;
            }
            if (item.type !== StyleTokenType.STYLE_GROUP || !item.children || item.children.length < 1) {
                source.push(item);
                continue;
            }
            let [s, a, _, callKeys] = this.splitThemeStyle(themeOption, item.children);
            if (a.length > 0) {
                append.push({ ...item, children: a });
            }
            if (callKeys.length > 0) {
                keys.push(...callKeys);
            }
            source.push({ ...item, children: s });
        }
        return [source, append, hasDefine, keys.filter((v, i, self) => self.indexOf(v) === i)];
    }
    cloneStyle(themeOption, data, theme) {
        const children = [];
        for (const item of data) {
            if (this.isThemeStyle(item)) {
                children.push({ ...item, content: this.themeStyle(themeOption, item, theme)[0] });
                continue;
            }
            if (item.type !== StyleTokenType.STYLE_GROUP) {
                children.push(item);
                continue;
            }
            children.push({ ...item, name: [...item.name], children: this.cloneStyle(themeOption, item.children, theme) });
        }
        return children;
    }
    themeStyleValue(themeOption, name, theme = 'default') {
        if (themeOption[theme][name]) {
            return [
                this.useVar ? `var(${this.formatVarKey(name)})` : themeOption[theme][name],
                name
            ];
        }
        if (name.indexOf('.') >= 0) {
            [theme, name] = splitStr(name, '.', 2);
            if (themeOption[theme][name]) {
                return [themeOption[theme][name], undefined];
            }
        }
        throw new Error(`[${theme}].${name} is error value`);
    }
    formatVarKey(name) {
        return `--${this.varPrefix}-${unStudly(name)}`;
    }
    isThemeStyle(item) {
        if (item.type !== StyleTokenType.STYLE) {
            return false;
        }
        return /(,|\s|\(|^)@[a-z]/.test(item.content);
    }
    separateThemeStyle(items) {
        const themeOption = {};
        const appendTheme = (item) => {
            const name = item.name[0].substring(7).trim();
            if (!themeOption[name]) {
                themeOption[name] = {};
            }
            item.children?.forEach(i => {
                if (i.type === StyleTokenType.STYLE) {
                    themeOption[name][i.name] = i.content;
                }
            });
        };
        const sourceItems = [];
        for (const item of items) {
            if (this.isThemeDef(item)) {
                appendTheme(item);
                continue;
            }
            sourceItems.push(item);
        }
        return [themeOption, sourceItems];
    }
    isThemeDef(item) {
        return item.type === StyleTokenType.STYLE_GROUP && item.name[0].indexOf('@theme ') === 0;
    }
}
