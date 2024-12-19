import * as path from 'path';
import { CompilerFile, PluginCompiler, TemplateCompiler } from '../../compiler';
import { ElementToken, TemplateTokenizer } from '../../tokenizer';
import { joinLine } from '../../util';
import { REGEX_ASSET } from './tokenizer';
export class TemplateParser {
    project;
    constructor(project) {
        this.project = project;
    }
    tokenizer = new TemplateTokenizer();
    compiler = new TemplateCompiler();
    render(file) {
        const tokenizer = this.project.tokenizer;
        const page = tokenizer.render(file);
        if (!page.canRender) {
            return {
                template: '',
            };
        }
        let layout = null;
        let pageData = tokenizer.mergeData(page.data);
        const renderPage = (item, data) => {
            const lines = [];
            item.tokens.forEach(token => {
                if (token.type === 'comment' || token.type === 'layout' || token.type === 'set') {
                    return;
                }
                if (token.type === 'echo') {
                    lines.push(tokenizer.echoValue(pageData, token.content));
                    return;
                }
                if (token.type === 'content') {
                    lines.push(data);
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
                const next = tokenizer.render(new CompilerFile(token.content));
                if (next.isLayout) {
                    layout = next;
                    return;
                }
                pageData = tokenizer.mergeData(pageData, next.data);
                let amount = token.amount || 1;
                for (; amount > 0; amount--) {
                    lines.push(renderPage(next));
                }
            });
            return joinLine(lines);
        };
        let content = renderPage(page);
        if (layout) {
            pageData = tokenizer.mergeData(pageData, layout.data);
            content = renderPage(layout, content);
        }
        return {
            template: this.mergeStyle(content, file.src, file.mtime)
        };
    }
    mergeStyle(content, file, time) {
        const currentFolder = path.dirname(file);
        const replacePath = (text) => {
            return text.replace(REGEX_ASSET, ($0, _, $2) => {
                if ($2.indexOf('#') === 0 || $2.indexOf('javascript:') === 0) {
                    return $0;
                }
                if ($2.indexOf('://') >= 0) {
                    return $0;
                }
                if ($2.charAt(0) === '/') {
                    return $0;
                }
                const fileName = path.relative(currentFolder, $2).replace('\\', '/').replace(/\.ts$/, '.js').replace(/\.(scss|sass|less)$/, '.css');
                return $0.replace($2, fileName);
            });
        };
        const data = this.tokenizer.render(replacePath(content));
        let headers = [];
        let footers = [];
        let styles = [];
        let scripts = [];
        let styleLang = 'css';
        let scriptLang = 'js';
        const eachElement = (root) => {
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
                const l = root.attr('lang');
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
                scriptLang = lang;
            }
            root.ignore = true;
            if (root.children && root.children.length > 0) {
                scripts = scripts.concat(root.children);
            }
        };
        data.map(eachElement);
        let lines = [];
        styles.forEach(item => {
            if (item.text) {
                lines.push(item.text);
            }
        });
        let style = this.project.style.render(new CompilerFile(file, time, '', styleLang, joinLine(lines)));
        if (style.length > 0 && ['scss', 'sass'].indexOf(styleLang) >= 0) {
            style = PluginCompiler.sass(style, file, styleLang, {
                importer: this.project.style.importer,
            });
        }
        lines = [];
        scripts.forEach(item => {
            if (item.text) {
                lines.push(item.text);
            }
        });
        let script = this.project.script.render(joinLine(lines));
        if (script.length > 0 && scriptLang === 'ts') {
            script = PluginCompiler.ts(script, file);
        }
        const pushStyle = (root) => {
            if (root.node !== 'element') {
                return;
            }
            if (root.tag === 'head') {
                if (headers.length > 0) {
                    root.children = !root.children ? headers : root.children.concat(headers);
                }
                if (style.length > 0) {
                    root.children?.push(ElementToken.create('style', [ElementToken.text(style)]));
                }
                headers = [];
                return;
            }
            if (root.tag === 'body') {
                if (footers.length > 0) {
                    root.children = !root.children ? footers : root.children.concat(footers);
                }
                if (script.length > 0) {
                    root.children?.push(ElementToken.create('script', [ElementToken.text(script)]));
                }
                footers = [];
                return;
            }
            root.map(pushStyle);
        };
        data.map(pushStyle);
        this.compiler.indent = this.project.compilerMin ? '' : '    ';
        return this.compiler.render(data);
    }
    extractStyle(content) {
        const regex = /<style[\s\S]+?>([\s\S]+?)<\/style>/g;
        const items = [];
        let match;
        while (null !== (match = regex.exec(content))) {
            items.push(match[1]);
        }
        return items.join('\r\n');
    }
}
