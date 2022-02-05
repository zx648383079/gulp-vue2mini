import { IThemeObject } from '../parser/template/tokenizer';
import { StyleToken, StyleTokenizer, StyleTokenType } from '../tokenizer';
import { regexReplace } from '../util';
import { Compiler } from './base';
import { StyleCompiler } from './style';

export class ThemeStyleCompiler implements Compiler<StyleToken[], string> {

    constructor(
        private autoDark = true,
        private tokenizer = new StyleTokenizer(),
        private compiler = new StyleCompiler(),
    ) {

    }

    public render(data: StyleToken[]): string {
        return this.formatThemeCss(data);
    }

    public themeCss(items: StyleToken[], themeOption?: IThemeObject): StyleToken[] {
        if (!themeOption) {
            [themeOption, items] = this.separateThemeStyle(items);
        }
        const [finishItems, appendItems] = this.splitThemeStyle(themeOption!, items);
        if (appendItems.length < 1) {
            return finishItems;
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
        return finishItems;
    }

    private themeStyle(themeOption: IThemeObject, item: StyleToken, theme = 'default'): string {
        return regexReplace(item.content as string, /(,|\s|\(|^)@([a-zA-Z_\.]+)/g, match => {
            return match[1] + this.themeStyleValue(themeOption, match[2], theme);
        });
    }

    private splitThemeStyle(themeOption: IThemeObject, data: StyleToken[]): StyleToken[][] {
        const source = [];
        const append = [];
        for (const item of data) {
            if (this.isThemeDef(item)) {
                continue;
            }
            if (this.isThemeStyle(item)) {
                append.push({...item});
                item.content = this.themeStyle(themeOption, item);
            }
            if (item.type !== StyleTokenType.STYLE_GROUP || !item.children || item.children.length < 1) {
                source.push(item);
                continue;
            }
            let [s, a] = this.splitThemeStyle(themeOption, item.children);
            if (a.length > 0) {
                append.push({...item, children: a});
            }
            source.push({...item, children: s});
        }
        return [source, append];
    }

    private cloneStyle(themeOption: IThemeObject, data: StyleToken[], theme: string): StyleToken[] {
        const children = [];
        for (const item of data) {
            if (this.isThemeStyle(item)) {
                children.push({...item, content: this.themeStyle(themeOption, item, theme)});
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

    private themeStyleValue(themeOption: IThemeObject, name: string, theme = 'default'): string {
        if (themeOption![theme][name]) {
            return themeOption![theme][name];
        }
        // 允许通过 theme.name 的方式直接访问值
        if (name.indexOf('.') >= 0) {
            [theme, name] = name.split('.', 2);
            if (themeOption![theme][name]) {
                return themeOption![theme][name];
            }
        }
        throw `[${theme}].${name} is error value`;
    }

    private isThemeStyle(item: StyleToken): boolean {
        if (item.type !== StyleTokenType.STYLE) {
            return false;
        }
        return /(,|\s|\(|^)@[a-z]/.test(item.content as string);
    }

    public formatThemeCss(items: StyleToken[]): string;
    public formatThemeCss(items: StyleToken[], themeOption: IThemeObject): string;
    public formatThemeCss(content: string): string;
    public formatThemeCss(content: string, themeOption: IThemeObject): string;
    public formatThemeCss(content: string|StyleToken[], themeOption?: IThemeObject): string {
        let items: StyleToken[];
        if (typeof content !== 'object') {
            if (content.trim().length < 1) {
                return content;
            }
            this.tokenizer.autoIndent(content);
            items = this.tokenizer.render(content);
        } else {
            items = content;
        }
        items = this.themeCss(items, themeOption);
        return this.compiler.render(items);
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