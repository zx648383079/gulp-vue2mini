import * as path from 'path';
import { Compiler, CompliperFile } from '../../compiler';
import { htmlToJson, jsonToHtml } from '../html';
import { joinLine } from '../util';
import { TemplateProject } from './project';
import { IPage, REGEX_ASSET } from './tokenizer';
import { Element } from '../element';

interface ITemplateResultItem {
    type: string;
    content: string;
}

interface ITemplateResult {
    template: string;
    style?: ITemplateResultItem;
    script?: ITemplateResultItem;
}

export class TemplateParser {
    constructor(
        private project: TemplateProject
    ) {}

    public render(file: CompliperFile): ITemplateResult {
        const page = this.project.tokenizer.render(file);
        if (!page.canRender) {
            return {
                template: '',
            };
        }

        let layout: IPage | null = null;
        const renderPage = (item: IPage, data?: string) => {
            const lines: string[] = [];
            item.tokens.forEach(token => {
                if (token.type === 'comment' || token.type === 'layout') {
                    return;
                }
                if (token.type === 'content') {
                    lines.push(data as string);
                    return;
                }
                if (token.type === 'text') {
                    lines.push(token.content);
                    return;
                }
                if (token.type === 'random') {
                    const args = token.content.split('@@');
                    lines.push(args[Math.floor(Math.random() * args.length)]);
                    return;
                }
                if (token.type !== 'extend') {
                    lines.push(token.content);
                    return;
                }
                const next = this.project.tokenizer.render(new CompliperFile(token.content));
                if (next.isLayout) {
                    layout = next;
                    return;
                }
                let amount = token.amount || 1;
                for (; amount > 0; amount --) {
                    lines.push(renderPage(next));
                }
            });
            return joinLine(lines);
        };
        const content = renderPage(page);
        return {
            template: this.mergeStyle(layout ? renderPage(layout, content) : content, file.src, file.mtime)
        };
    }

    /**
     * 合并脚本和样式
     * @param content 内容
     * @param file 文件
     */
     private mergeStyle(content: string, file: string, time: number): string {
        const currentFolder = path.dirname(file);
        const replacePath = (text: string) => {
            return text.replace(REGEX_ASSET, ($0: string, _, $2: string) => {
                if ($2.indexOf('#') === 0 || $2.indexOf('javascript:') === 0) {
                    return $0;
                }
                if ($2.indexOf('://') >= 0) {
                    return $0;
                }
                // 未考虑linux
                if ($2.charAt(0) === '/') {
                    return $0;
                }
                const fileName = path.relative(currentFolder, $2).replace('\\', '/').replace(/\.ts$/, '.js').replace(/\.(scss|sass|less)$/, '.css');
                return $0.replace($2, fileName);
            });
        };
        const data = htmlToJson(replacePath(content));
        let headers: Element[] = [];
        let footers: Element[] = [];
        let styles: Element[] = [];
        let scripts: Element[] = [];
        let styleLang = 'css';
        let scriptLang = 'js';
        const eachElement = (root: Element) => {
            if (root.node !== 'element') {
                root.map(eachElement);
                return;
            }
            if (root.tag === 'link') {
                headers.push(root.clone());
                root.ignore = true;
                return;
            }
            if (root.tag === 'style') {
                root.ignore = true;
                const l = root.attr('lang') as string;
                if (l && l !== 'css') {
                    styleLang = l;
                }
                if (root.children && root.children.length > 0) {
                    styles = styles.concat(root.children);
                }
                return;
            }
            if (root.tag !== 'script') {
                root.map(eachElement);
                return;
            }
            if (root.attr('src')) {
                footers.push(root.clone());
                root.ignore = true;
                return;
            }
            const lang = root.attr('lang');
            if (lang && lang !== 'js') {
                scriptLang = lang as string;
            }
            root.ignore = true;
            if (root.children && root.children.length > 0) {
                scripts = scripts.concat(root.children);
            }
        };
        data.map(eachElement);
        let lines: string[] = [];
        styles.forEach(item => {
            if (item.text) {
                lines.push(item.text as string);
            }
        });
        let style = this.project.style.render(new CompliperFile(file + styleLang, time, '', styleLang, joinLine(lines)));
        if (style.length > 0 && ['scss', 'sass'].indexOf(styleLang) >= 0) {
            style = Compiler.sass(style, file, styleLang);
        }
        lines = [];
        scripts.forEach(item => {
            if (item.text) {
                lines.push(item.text as string);
            }
        });
        let script = this.project.script.render(joinLine(lines));
        if (script.length > 0 && scriptLang === 'ts') {
            script = Compiler.ts(script, file);
        }

        const pushStyle = (root: Element) => {
            if (root.node !== 'element') {
                return;
            }
            if (root.tag === 'head') {
                if (headers.length > 0) {
                    root.children = !root.children ? headers : root.children.concat(headers);
                }
                if (style.length > 0) {
                    root.children?.push(Element.create('style', [Element.text(style)]));
                }
                headers = [];
                return;
            }
            if (root.tag === 'body') {
                if (footers.length > 0) {
                    root.children = !root.children ? footers : root.children.concat(footers);
                }
                if (script.length > 0) {
                    root.children?.push(Element.create('script', [Element.text(script)]));
                }
                footers = [];
                return;
            }
            root.map(pushStyle);
        };
        data.map(pushStyle);
        return jsonToHtml(data, this.project.compliperMin ? '' : '    ');
    }

    public extractStyle(content: string): string {
        const regex = /<style[\s\S]+?>([\s\S]+?)<\/style>/g;
        const items = [];
        let match: RegExpExecArray|null;
        while (null !== (match = regex.exec(content))) {
            items.push(match[1]);
        }
        return items.join('\r\n');
    }
}