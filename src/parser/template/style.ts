import { blockToString, cssToJson, separateThemeStyle, themeCss } from '../css';
import { TemplateProject } from './project';
import * as path from 'path';
import { CompliperFile } from '../../compiler';

interface IThemeOption {
    [key: string]: {
        [name: string]: string;
    }
}

const REGEX_SASS_IMPORT = /@(import|use)\s+["'](.+?)["'];/g;

export class StyleParser {
    constructor(
        private project: TemplateProject
    ) {}

    private themeItems: IThemeOption = {};

    public get length() {
        return Object.keys(this.themeItems).length;
    }

    public get(theme: string) {
        return Object.prototype.hasOwnProperty.call(this.themeItems, theme) ? this.themeItems[theme] : undefined;
    }
    
    public render(file: CompliperFile): string {
        let content = this.project.fileContent(file);
        const needTheme = this.needTheme(content);
        const hasTheme = this.hasTheme(content);
        if (!needTheme && !hasTheme) {
            return content;
        }
        let blockItems = cssToJson(content);
        if (hasTheme) {
            const [theme, items] = separateThemeStyle(blockItems);
            this.pushTheme(theme);
            blockItems = items;
            this.project.link.lock(file.src, () => {
                this.project.link.trigger('theme', file.mtime);
            });
        }
        this.project.link.push('theme', file.src);
        content = blockToString(themeCss(blockItems, this.themeItems));
        if (file.type === 'scss' || file.type === 'sass') {
            this.sassImport(content, file.src);
        }
        return content;
    }

    public pushTheme(items: IThemeOption) {
        for (const key in items) {
            if (Object.prototype.hasOwnProperty.call(items, key)) {
                this.themeItems[key] = Object.assign(Object.prototype.hasOwnProperty.call(this.themeItems, key) ? this.themeItems[key] : {}, items[key]);
            }
        }
    }

    public extractTheme(content: string) {
        if (!this.hasTheme(content)) {
            return;
        }
        const [theme] = separateThemeStyle(cssToJson(content));
        this.pushTheme(theme);
    }

    private hasTheme(content: string): boolean {
        return content.indexOf('@theme ') >= 0;
    }

    private needTheme(content: string): boolean {
        return /:.+@[a-z]+/.test(content);
    }

    /**
     * 添加文件绑定
     * @param content 内容
     * @param file 文件
     */
     private sassImport(content: string, file: string) {
        if (content.length < 6) {
            return;
        }
        const ext = path.extname(file);
        const folder = path.dirname(file);
        let res;
        while (true) {
            res = REGEX_SASS_IMPORT.exec(content);
            if (!res) {
                break;
            }
            this.project.link.push(path.resolve(folder, res[2].indexOf('.') > 0 ? res[2] : ('_' + res[2] + ext)), file);
        }
    }
}