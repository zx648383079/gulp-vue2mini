import * as fs from 'fs';
import { LINE_SPLITE } from '../types';
import { CacheManger } from '../cache';
import * as path from 'path';
import { htmlToJson, jsonToHtml } from '../html';
import { Element } from '../element';
import { Compiler, consoleLog, ICompliper } from '../../compiler';
import * as UglifyJS from 'uglify-js';
import * as CleanCSS from 'clean-css';

interface IPage {
    isLayout: boolean;
    canRender: boolean;
    file: string;
    tokens: IToken[];
}

type TYPE_MAP = 'text' | 'comment' | 'extend' | 'script' | 'style' | 'layout' | 'content' | 'random';

interface IToken {
    type: TYPE_MAP;
    content: string;
    comment?: string;
    amount?: number;
}

const REGEX_ASSET = /(src|href|action)=["']([^"'\>]+)/g;
const REGEX_SASS_IMPORT = /@import\s+["'](.+?)["'];/g;

export class TemplateProject implements ICompliper {

    constructor(
        public inputFolder: string,
        public outputFolder: string,
        public options?: any
    ) {
    }

    private linkFiles: {[key: string]: string[]} = {}; // 关联文件

    private cachesFiles = new CacheManger<IPage>();

    /**
     * 触发更新
     * @param key 触发文件
     * @param mtime 文件的更改时间
     */
    private triggerLinkFile(key: string, mtime: number) {
        if (!Object.prototype.hasOwnProperty.call(this.linkFiles, key)) {
            return;
        }
        this.linkFiles[key].forEach(file => {
            if (file) {
                this.compileAFile(file, mtime);
            }
        });
    }

    /**
     * 添加链接文件
     * @param key 触发文件
     * @param file 目标包含触发文件
     */
    private addLinkFile(key: string, file: string) {
        if (!Object.prototype.hasOwnProperty.call(this.linkFiles, key)) {
            this.linkFiles[key] = [file];
            return;
        }
        if (this.linkFiles[key].indexOf(file) >= 0) {
            return;
        }
        this.linkFiles[key].push(file);
    }

    /**
     * 根据一行内容提取token
     * @param line 内容
     */
    private converterToken(line: string): IToken | undefined {
        line = line.trim();
        if (line.length < 0) {
            return;
        }
        if (line.charAt(0) !== '@') {
            return;
        }
        let content = line.substr(1);
        let comment = '';
        const i = content.indexOf(' ');
        if (i > 0) {
            comment = content.substr(i).trim();
            content = content.substr(0, i);
        }
        if (content.length < 1) {
            return;
        }
        let type: TYPE_MAP = 'extend';
        if (content === '@') {
            type = 'comment';
        } else if (content === '...') {
            type = 'content';
        } else if (content.indexOf('~') === 0 && line.indexOf('@@') > 2) {
            type = 'random';
            content = line.substr(2);
        }
        if (type === 'extend' && /[\<\>]/.test(content)) {
            // 如果包含 <> 字符则不符合规则
            return;
        }
        let amount = '1';
        if (type === 'extend' && content.indexOf('@') > 0) {
            [content, amount] = content.split('@');
        }
        return {
            type,
            content,
            comment,
            amount: parseInt(amount, 10) || 1,
        };
    }

    /**
     * 将文件内容转成功token
     * @param file 文件路径
     * @param content 文件的内容
     */
    private parseToken(file: string, content?: string): IPage {
        const time = fs.statSync(file).mtimeMs;
        if (this.cachesFiles.has(file, time)) {
            return this.cachesFiles.get(file) as IPage;
        }
        if (!content) {
            content = fs.readFileSync(file).toString();
        }
        const tokens: IToken[] = [];
        let isLayout = false;
        let canRender = true;
        const currentFolder = path.dirname(file);
        const ext = path.extname(file);
        const replacePath = (text: string) => {
            return text.replace(REGEX_ASSET, ($0: string, _, $2: string) => {
                if ($2.indexOf('#') === 0 || $2.indexOf('javascript:') === 0) {
                    return $0;
                }
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
            const token = this.converterToken(line);
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
            if (token.type === 'random') {
                token.content = replacePath(token.content);
            }
            if (token.type === 'extend') {
                if (token.content.indexOf('.') <= 0) {
                    token.content += ext;
                }
                token.content = path.resolve(currentFolder, token.content);
                this.addLinkFile(token.content, file);
            }
            tokens.push(token);
        });
        const page = {
            tokens,
            isLayout,
            file,
            canRender
        };
        this.cachesFiles.set(file, page, time);
        return page;
    }

    /**
     * 编译一个文件
     * @param file 文件路径
     * @param content 内容
     */
    public renderFile(file: string, content?: string): string {
        const page = this.parseToken(file, content);
        if (!page.canRender) {
            return '';
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
                const next = this.parseToken(token.content);
                if (next.isLayout) {
                    layout = next;
                    return;
                }
                let amount = token.amount || 1;
                for (; amount > 0; amount --) {
                    lines.push(renderPage(next));
                }
            });
            return lines.join(LINE_SPLITE);
        };
        content = renderPage(page);
        return this.mergeStyle(layout ? renderPage(layout, content) : content, file);
    }
    /**
     * 合并脚本和样式
     * @param content 内容
     * @param file 文件
     */
    private mergeStyle(content: string, file: string): string {
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
        return jsonToHtml(data, this.options && this.options.min ? '' : '    ');
    }

    /**
     * 添加文件绑定
     * @param content 内容
     * @param file 文件
     */
    private getSassImport(content: string, file: string) {
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
            this.addLinkFile(path.resolve(folder, res[1].indexOf('.') > 0 ? res[1] : ('_' + res[1] + ext)), file);
        }
    }

    public compileFile(src: string) {
        this.compileAFile(src);
    }

    /**
     * compileFile
     * @param mtime 更新时间
     */
    public compileAFile(src: string, mtime?: number) {
        const ext = path.extname(src);
        let dist = this.outputFile(src);
        const extMaps: any = {
            '.ts': '.js',
            '.scss': '.css',
            '.sass': '.css',
        };
        if (Object.prototype.hasOwnProperty.call(extMaps, ext)) {
            dist = dist.replace(ext, extMaps[ext]);
        }
        if (mtime && mtime > 0 && fs.existsSync(dist) && fs.statSync(dist).mtimeMs >= mtime) {
            // 判断时间是否更新
            return;
        }
        const distFolder = path.dirname(dist);
        let content = '';
        if (ext === '.ts') {
            content = Compiler.ts(fs.readFileSync(src).toString(), src);
            if (content && content.length > 0 && this.options && this.options.min) {
                content = UglifyJS.minify(content).code;
            }
        } else if (ext === '.scss' || ext === '.sass') {
            this.triggerLinkFile(src, mtime || fs.statSync(src).mtimeMs);
            const name = path.basename(src);
            if (name.indexOf('_') === 0) {
                return;
            }
            content = fs.readFileSync(src).toString();
            this.getSassImport(content, src);
            content = Compiler.sass(content, src, ext.substr(1));
            if (content && content.length > 0 && this.options && this.options.min) {
                content = new CleanCSS().minify(content).styles;
            }
        } else if (ext === '.html') {
            this.triggerLinkFile(src, mtime || fs.statSync(src).mtimeMs);
            content = this.renderFile(src);
        } else {
            this.mkIfNotFolder(distFolder);
            fs.copyFileSync(src, dist);
            return;
        }
        if (content.length < 1) {
            return;
        }
        this.mkIfNotFolder(distFolder);
        fs.writeFileSync(dist, content);
        this.logFile(src);
    }

    /**
     * mkIfNotFolder
     */
    public mkIfNotFolder(folder: string) {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, {recursive: true});
        }
    }

    /**
     * outputFile
     */
    public outputFile(file: string) {
        return path.resolve(this.outputFolder, path.relative(this.inputFolder, file));
    }

    public unlink(src: string) {
        const dist = this.outputFile(src);
        if (fs.existsSync(dist)) {
            fs.unlinkSync(dist);
        }
    }

    /**
     * logFile
     */
    public logFile(file: string, tip = 'Finished') {
        consoleLog(file, tip, this.inputFolder);
    }
}
