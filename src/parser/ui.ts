import { readFileSync, statSync } from "fs";
import { LINE_SPLITE } from "./ts";
import { CacheManger } from "./cache";
import * as path from "path";
import { htmlToJson, jsonToHtml } from "./html";
import { Element } from "./element";
import { Compiler } from "../compiler";

interface IPage {
    isLayout: boolean;
    canRender: boolean;
    file: string;
    tokens: IToken[];
}

interface IToken {
    type: 'text' | 'comment' | 'extend' | 'script' | 'style' | 'layout' | 'content'
    content: string,
    comment?: string,
}

const cachesFiles = new CacheManger<IPage>();
const REGEX_ASSET = /(src|href)=["']([^"'\>]+)/g;

function parseToken(file: string, content?: string): IPage {
    const time = statSync(file).mtimeMs;
    if (cachesFiles.has(file, time)) {
        return cachesFiles.get(file) as IPage;
    }
    if (!content) {
        content = readFileSync(file).toString();
    }
    let tokens:IToken[] = [];
    let isLayout = false;
    let canRender = true;
    const currentFolder = path.dirname(file);
    const replacePath = (text: string) => {
        return text.replace(REGEX_ASSET, ($0: string, _, $2: string) => {
            if ($2.indexOf('://') >= 0) {
                return $0;
            }
            if ($2.charAt(0) === '/') {
                return $0;
            }
            return $0.replace($2, path.resolve(currentFolder, $2));
        });
    };
    content.split(LINE_SPLITE).forEach((line, i) => {
        const token = converterToken(line);
        if (!token) {
            tokens.push({
                type: 'text',
                content: replacePath(line)
            });
            return;
        }
        if (token.type === 'comment' && i < 1) {
            token.type = 'layout';
            canRender = false;
        }
        if (token.type === 'content') {
            isLayout = true;
        }
        tokens.push(token);
    });
    const page = {
        tokens,
        isLayout,
        file,
        canRender
    };
    cachesFiles.set(file, page, time);
    return page;
}

export function renderFile(file: string, content?: string): string {
    const page = parseToken(file, content);
    if (!page.canRender) {
        return '';
    }
    const ext = path.extname(file);
    let layout: IPage | null = null;
    const renderPage = (item: IPage, data?: string) => {
        let lines: string[] = [];
        item.tokens.forEach(token => {
            if (token.type == 'comment' || token.type === 'layout') {
                return;
            }
            if (token.type == 'content') {
                lines.push(data as string);
                return;
            }
            if (token.type === 'text') {
                lines.push(token.content);
                return;
            }
            if (token.type !== 'extend') {
                lines.push(token.content);
                return;
            }
            let args = token.content.split('@');
            if (args[0].indexOf('.') <= 0) {
                args[0] += ext;
            }
            let amount = args.length > 1 ? parseInt(args[1], 10) : 1;
            let extendFile = path.resolve(path.dirname(item.file), args[0]);
            const next = parseToken(extendFile);
            if (next.isLayout) {
                layout = next;
                return;
            }
            const nextStr = renderPage(next);
            for (; amount > 0; amount --) {
                lines.push(nextStr);
            }
        });
        return lines.join(LINE_SPLITE);
    };
    content = renderPage(page);
    return mergeStyle(layout ? renderPage(layout, content) : content, file);
}

export function mergeStyle(content: string, file: string): string {
    const currentFolder = path.dirname(file);
    const replacePath = (text: string) => {
        return text.replace(REGEX_ASSET, ($0: string, _, $2: string) => {
            if ($2.indexOf('://') >= 0) {
                return $0;
            }
            // 未考虑linux
            if ($2.charAt(0) === '/') {
                return $0;
            }
            return $0.replace($2, path.relative(currentFolder, $2).replace('\\', '/'));
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
            const lang = root.attr('lang');
            if (lang && lang !== 'css') {
                styleLang = lang as string;
            }
            if (root.children) {
                styles.push(...root.children);
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
        if (root.children) {
            scripts.push(...root.children);
        }
    }
    data.map(eachElement);
    let lines: string[] = [];
    styles.forEach(item => {
        if (item.text) {
            lines.push(item.text as string);
        }
    });
    let style = lines.join(LINE_SPLITE);
    if (style.length > 0 && ['scss', 'sass'].indexOf(styleLang) >= 0) {
        style = Compiler.sass(style, file, styleLang);
    }
    lines = [];
    scripts.forEach(item => {
        if (item.text) {
            lines.push(item.text as string);
        }
    });
    let script = lines.join(LINE_SPLITE);
    if (script.length > 0 && scriptLang === 'ts') {
        script = Compiler.ts(script, file);
    }
    
    const pushStyle = (root: Element) => {
        if (root.node !== 'element') {
            return;
        }
        if (root.tag === 'head') {
            root.children?.push(...headers);
            if (style.length > 0) {
                root.children?.push(Element.create('style', [Element.text(style)]))
            }
            headers = [];
            return;
        }
        if (root.tag === 'body') {
            root.children?.push(...footers);
            if (script.length > 0) {
                root.children?.push(Element.create('script', [Element.text(script)]))
            }
            return;
        }
        root.map(pushStyle);
    };
    data.map(pushStyle);
    return jsonToHtml(data);
}

function converterToken(line: string): IToken | undefined {
    line = line.trim();
    if (line.length < 0) {
        return;
    }
    if (line.charAt(0) !== '@') {
        return;
    }
    let content = line.substr(1);
    let comment = '';
    const i = content.indexOf(' ')
    if (i > 0) {
        comment = content.substr(i).trim();
        content = content.substr(0, i);
    }
    if (content.length < 1) {
        return;
    }
    let type: 'extend' | 'comment' | 'content' = 'extend';
    if (content === '@') {
        type = 'comment';
    } else if (content === '...') {
        type = 'content'
    }
    return {
        type,
        content,
        comment
    };
}