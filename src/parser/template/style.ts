import { TemplateProject } from './project';
import * as path from 'path';
import { CompilerFile } from '../../compiler';
import { StyleTokenizer } from '../../tokenizer';
import { ThemeStyleCompiler } from '../../compiler';
import { getExtensionName, regexReplace } from '../../util';
import { Importer } from 'sass';
import { IThemeObject } from './tokenizer';



export class StyleParser {
    constructor(
        private project: TemplateProject
    ) {
        const varPrefix = this.project.options?.prefix;
        this.compiler = new ThemeStyleCompiler(true, typeof varPrefix === 'string' && varPrefix.length > 0, varPrefix ?? 'zre');
    }

    private themeItems: IThemeObject = {};
    private tokenizer = new StyleTokenizer();
    private compiler: ThemeStyleCompiler;
    private preppendItems: string[] = [];
    private themeUsedKeys: string[] = [];

    public get length() {
        return Object.keys(this.themeItems).length;
    }

    public get(theme: string) {
        return Object.prototype.hasOwnProperty.call(this.themeItems, theme) ? this.themeItems[theme] : undefined;
    }
    
    public render(file: CompilerFile): string {
        this.preppendItems = [];
        this.themeUsedKeys = [];
        const content = this.renderPart(file, true);
        return [...this.preppendItems, this.compiler.renderTheme(this.themeItems, this.themeUsedKeys), content].filter(i => !!i).join('\n');
    }

    private renderPart(file: CompilerFile, isEntry = false): string {
        const content = typeof file.content !== 'undefined' ? file.content : this.project.fileContent(file);
        const needTheme = this.needTheme(content);
        const hasTheme = this.hasTheme(content);
        if (!needTheme && !hasTheme) {
            return this.renderImport(content, file);
        }
        let blockItems = this.tokenizer.render(content);
        if (hasTheme) {
            const [theme, items] = this.compiler.separateThemeStyle(blockItems);
            this.pushTheme(theme);
            blockItems = items;
            if (isEntry) {
                // 只有初始文件才会触发
                this.project.link.lock(file.src, () => {
                    this.project.link.trigger('theme', file.mtime);
                });
            }
        }
        this.project.link.push('theme', file.src);
        let [res, _, keys] = this.compiler.renderAny(blockItems, this.themeItems);
        if (keys.length > 0) {
            for (const key of keys) {
                if (this.themeUsedKeys.indexOf(key) >= 0) {
                    continue;
                }
                this.themeUsedKeys.push(key);
            }
        }
        return this.renderImport(res, file);
    }

    public pushTheme(items: IThemeObject) {
        for (const key in items) {
            if (Object.prototype.hasOwnProperty.call(items, key)) {
                this.themeItems[key] = Object.assign(Object.prototype.hasOwnProperty.call(this.themeItems, key) ? this.themeItems[key] : {}, items[key]);
            }
        }
        if (this.project.options?.debug) {
            this.project.logger.debug(items);
        }
    }

    public extractTheme(content: string) {
        if (!this.hasTheme(content)) {
            return;
        }
        const [theme] = this.compiler.separateThemeStyle(this.tokenizer.render(content));
        this.pushTheme(theme);
    }

    private renderImport(content: string, file: CompilerFile) {
        if (file.type !== 'scss' && file.type !== 'sass') {
            return content;
        }
        if (content.length < 6) {
            return content;
        }
        const ext = file.extname;
        const folder = file.dirname;
        return regexReplace(content, /@(import|use)\s+["'](.+?)["'];*/g, match => {
            if (match[2].startsWith('sass:')) {
                this.preppendItems.push(match[0]);
                return '';
            }
            const importFile = path.resolve(folder, match[2].indexOf('.') > 0 ? match[2] : ('_' + match[2] + ext));
            this.project.link.push(importFile, file.src);
            return this.renderPart(new CompilerFile(importFile, file.mtime, undefined, getExtensionName(importFile)));
        });
    }

    private hasTheme(content: string): boolean {
        return content.indexOf('@theme ') >= 0;
    }

    private needTheme(content: string): boolean {
        return /:.+@[a-z]+/.test(content);
    }

    public importer: Importer<'sync'> = {
        canonicalize: (url: string, _: {fromImport: boolean}) => {
            return new URL(url);
        },
        load: url => {
            const fileName = url.toString();
            const ext = getExtensionName(fileName);
            return {
                contents: this.renderPart(new CompilerFile(fileName, 0, undefined, ext)),
                syntax: ext === 'sass' ? 'indented' : 'scss'
            };
        }
    };
}