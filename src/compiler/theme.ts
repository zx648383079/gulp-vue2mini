import { IThemeObject, IThemeOption } from '../parser/template/tokenizer';
import { StyleToken, StyleTokenizer, StyleTokenType } from '../tokenizer';
import { eachObject, regexReplace, splitStr, unStudly } from '../util';
import { Compiler } from './base';
import { StyleCompiler } from './style';

export class ThemeStyleCompiler implements Compiler<StyleToken[], string> {

    constructor(
        private autoDark = true,
        private useVar = false,
        private varPrefix = 'zre',
        private tokenizer = new StyleTokenizer(),
        private compiler = new StyleCompiler(),
    ) {

    }

    public render(data: StyleToken[]): string {
        return this.renderAny(data)[0];
    }

    /**
     * 给主题声明生成字符串
     * @param themeOption 
     * @param keys 
     * @returns 
     */
    public renderTheme(themeOption?: IThemeObject, keys?: string[]): string {
        if (!themeOption || !this.useVar) {
            return '';
        }
        return this.compiler.render(this.formatThemeHeader(themeOption, keys));
    }

    /**
     * 编译主题，同时引入主题声明
     * @param content 
     * @param themeOption 
     * @returns 
     */
    public renderString(content: string, themeOption?: IThemeObject): string {
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

    public renderAny(items: StyleToken[]): [string, IThemeObject, string[]];
    public renderAny(items: StyleToken[], themeOption: IThemeObject): [string, IThemeObject, string[]];
    public renderAny(content: string): [string, IThemeObject, string[]];
    public renderAny(content: string, themeOption: IThemeObject): [string, IThemeObject, string[]];
    /**
     * 编译主题，不加主题声明
     * @param content 
     * @param themeOption 
     * @returns 返回 string, 主题，主题声明字段
     */
    public renderAny(content: string|StyleToken[], themeOption?: IThemeObject): [string, IThemeObject, string[]] {
        let tokens: StyleToken[];
        if (typeof content !== 'object') {
            if (content.trim().length < 1) {
                return [content, themeOption!, []];
            }
            this.tokenizer.autoIndent(content);
            tokens = this.tokenizer.render(content);
        } else {
            tokens = content;
        }
        const [items, theme, keys] = this.themeCss(tokens, themeOption);
        return [this.compiler.render(items), theme, keys];
    }

    private themeCss(items: StyleToken[], themeOption?: IThemeObject): [StyleToken[], IThemeObject, string[]] {
        if (!themeOption) {
            [themeOption, items] = this.separateThemeStyle(items);
        }
        const [finishItems, appendItems, _, keys] = this.splitThemeStyle(themeOption!, items);
        if (appendItems.length < 1 || this.useVar) {
            return [finishItems, themeOption!, keys];
        }
        Object.keys(themeOption!).forEach(theme => {
            if (theme === 'default') {
                return;
            }
            const children = this.cloneStyle(themeOption!, appendItems, theme);
            const cls = '.theme-' + theme;
            for (const item of children) {
                if (item.type !== StyleTokenType.STYLE_GROUP) {
                    continue;
                }
                if ((item.name as string[])[0].indexOf('@media') >= 0) {
                    finishItems.push({...item, children: [
                        {
                            type: StyleTokenType.STYLE_GROUP,
                            name: [cls],
                            children: [...item.children as StyleToken[]]
                        }
                    ]});
                    continue;
                }
                item.name = (item.name as string[]).map(i => {
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
                children: this.cloneStyle(themeOption!, appendItems, 'dark')
            });
        }
        return [finishItems, themeOption!, keys];
    }

    private formatThemeHeader(themeOption: IThemeObject, keys?: string[]): StyleToken[] {
        if (typeof keys !== 'undefined' && keys.length === 0) {
            return [];
        }
        const items: StyleToken[] = [];
        const toThemeVar = (data: IThemeOption, root: string): StyleToken => {
            const children: StyleToken[] = [];
            eachObject(data, (v, k) => {
                if (typeof keys !== 'undefined' && keys.indexOf(k as string) < 0) {
                    return;
                }
                children.push({
                    type: StyleTokenType.STYLE,
                    name: this.formatVarKey(k as any),
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

    private themeStyle(themeOption: IThemeObject, item: StyleToken, theme = 'default'): [string, string[]] {
        const keys: string[] = [];
        const res = regexReplace(item.content as string, /(,|\s|\(|^)@([a-zA-Z_\.]+)/g, match => {
            const [val, callKey] = this.themeStyleValue(themeOption, match[2], theme);
            if (callKey) {
                keys.push(callKey);
            }
            return match[1] + val;
        });
        return [res, keys];
    }

    private splitThemeStyle(themeOption: IThemeObject, data: StyleToken[]): [StyleToken[], StyleToken[], boolean, string[]] {
        const source = [];
        const append = [];
        const keys: string[] = [];
        let hasDefine = false;
        for (const item of data) {
            if (this.isThemeDef(item)) {
                hasDefine = true;
                continue;
            }
            if (this.isThemeStyle(item)) {
                const [val, callKeys] = this.themeStyle(themeOption, item);
                if (callKeys.length > 0) {
                    append.push({...item});
                    keys.push(...callKeys);
                }
                item.content = val as string;
            }
            if (item.type !== StyleTokenType.STYLE_GROUP || !item.children || item.children.length < 1) {
                source.push(item);
                continue;
            }
            let [s, a, _, callKeys] = this.splitThemeStyle(themeOption, item.children);
            if (a.length > 0) {
                append.push({...item, children: a});
            }
            if (callKeys.length > 0) {
                keys.push(...callKeys);
            }
            source.push({...item, children: s});
        }
        return [source, append, hasDefine, keys.filter((v, i, self) => self.indexOf(v) === i)];
    }

    private cloneStyle(themeOption: IThemeObject, data: StyleToken[], theme: string): StyleToken[] {
        const children = [];
        for (const item of data) {
            if (this.isThemeStyle(item)) {
                children.push({...item, content: this.themeStyle(themeOption, item, theme)[0] as string});
                continue;
            }
            if (item.type !== StyleTokenType.STYLE_GROUP) {
                children.push(item);
                continue;
            }
            children.push({...item, name: [...item.name as string[]], children: this.cloneStyle(themeOption, item.children as StyleToken[], theme)});
        }
        return children;
    }

    /**
     * 
     * @param themeOption 
     * @param name 
     * @param theme 
     * @returns [属性值, 引用的值名]
     */
    private themeStyleValue(themeOption: IThemeObject, name: string, theme = 'default'): [string, string|undefined] {
        if (themeOption![theme][name]) {
            return [
                this.useVar ? `var(${this.formatVarKey(name)})` : themeOption![theme][name]
                , name];
        }
        // 允许通过 theme.name 的方式直接访问值
        if (name.indexOf('.') >= 0) {
            [theme, name] = splitStr(name, '.', 2);
            if (themeOption![theme][name]) {
                return [themeOption![theme][name], undefined];
            }
        }
        throw new Error(`[${theme}].${name} is error value`);
    }

    private formatVarKey(name: string): string {
        return `--${this.varPrefix}-${unStudly(name)}`;
    }

    private isThemeStyle(item: StyleToken): boolean {
        if (item.type !== StyleTokenType.STYLE) {
            return false;
        }
        return /(,|\s|\(|^)@[a-z]/.test(item.content as string);
    }

    public separateThemeStyle(items: StyleToken[]): any[] {
        const themeOption: any = {};
        const appendTheme = (item: StyleToken) => {
            const name = (item.name as string[])[0].substring(7).trim();
            if (!themeOption[name]) {
                themeOption[name] = {};
            }
            item.children?.forEach(i => {
                if (i.type ===StyleTokenType.STYLE) {
                    themeOption[name][i.name as string] = i.content;
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

    private isThemeDef(item: StyleToken): boolean {
        return item.type === StyleTokenType.STYLE_GROUP && (item.name as string[])[0].indexOf('@theme ') === 0;
    }
}