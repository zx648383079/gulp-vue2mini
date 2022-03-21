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
    ) {}

    private themeItems: IThemeObject = {};
    private tokenizer = new StyleTokenizer();
    private compiler = new ThemeStyleCompiler();

    public get length() {
        return Object.keys(this.themeItems).length;
    }

    public get(theme: string) {
        return Object.prototype.hasOwnProperty.call(this.themeItems, theme) ? this.themeItems[theme] : undefined;
    }
    
    public render(file: CompilerFile): string {
        let content = file.content ? file.content : this.project.fileContent(file);
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
            this.project.link.lock(file.src, () => {
                this.project.link.trigger('theme', file.mtime);
            });
        }
        this.project.link.push('theme', file.src);
        content = this.compiler.formatThemeCss(blockItems, this.themeItems);
        return this.renderImport(content, file);
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
            const importFile = path.resolve(folder, match[2].indexOf('.') > 0 ? match[2] : ('_' + match[2] + ext));
            this.project.link.push(importFile, file.src);
            return this.render(new CompilerFile(importFile, file.mtime));
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
            return {
                contents: this.render(new CompilerFile(fileName, 0)),
                syntax: getExtensionName(fileName) === 'sass' ? 'indented' : 'scss'
            };
        }
    };
}