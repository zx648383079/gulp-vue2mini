import { CacheManger } from '../../util/cache';
import * as path from 'path';
import { TemplateProject } from './project';
import { CompilerFile } from '../../compiler';
import { splitLine } from '../../util';
import { Compiler } from '../../compiler';

export type TYPE_MAP = 'text' | 'comment' | 'extend' | 'script' | 'style' | 'layout' | 'content' | 'random' | 'theme' | 'set' | 'echo';
export const REGEX_ASSET = /(src|href|action)=["']([^"'\>]+)/g;

export interface IPageData {
    [key: string]: string;
}

export interface IToken {
    type: TYPE_MAP;
    content: string;
    comment?: string;
    amount?: number;
}

export interface IPage {
    isLayout: boolean;
    canRender: boolean;
    file: string;
    tokens: IToken[];
    data: IPageData;
}

export interface IThemeOption {
    [key: string]: string;
}

export interface IThemeObject {
    [key: string]: IThemeOption;
}

export class ThemeTokenizer implements Compiler<CompilerFile, IPage> {

    constructor(
        private project: TemplateProject
    ) {}

    private cachesFiles = new CacheManger<IPage>();
    
    /**
     * 将文件内容转成功token
     * @param file 
     * @returns 
     */
    public render(file: CompilerFile): IPage {
        const time = file.mtime;
        if (this.cachesFiles.has(file.src, time)) {
            return this.cachesFiles.get(file.src) as IPage;
        }
        const tokens: IToken[] = [];
        let isLayout = false;
        let canRender = true;
        const currentFolder = file.dirname;
        const ext = file.extname;
        const pageData: IPageData = {};
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
        splitLine(this.project.fileContent(file)).forEach((line, i) => {
            const token = this.converterToken(line);
            if (!token) {
                tokens.push({
                    type: 'text',
                    content: replacePath(line)
                });
                return;
            }
            if (token.type === 'set') {
                const [key, val] = token.content.split('=', 2);
                pageData[key.trim()] = val;
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
                this.project.link.push(token.content, file.src);
            }
            tokens.push(token);
        });
        const page = {
            tokens,
            isLayout,
            file: file.src,
            canRender,
            data: pageData
        };
        this.cachesFiles.set(file.src, page, time);
        return page;
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
        let content = line.substring(1);
        let comment = '';
        const i = content.indexOf(' ');
        if (i > 0) {
            comment = content.substring(i).trim();
            content = content.substring(0, i);
        }
        if (content.length < 1) {
            return;
        }
        if (content === 'theme') {
            return;
        }
        let type: TYPE_MAP = 'extend';
        if (content === '@') {
            type = 'comment';
        } else if (content === '...') {
            type = 'content';
        } else if (content.charAt(0) === '~' && line.indexOf('@@') > 2) {
            type = 'random';
            content = line.substring(2);
        } else if (content.charAt(0) === '=') {
            type = 'echo';
            content = content.substring(1);
        } else if (content.indexOf('=') > 0) {
            type = 'set';
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

    public mergeData(...items: IPageData[]): IPageData {
        return Object.assign({}, ...items.filter(i => !!i));
    }

    public echoValue(data: IPageData, key: string): string {
        key = key.trim();
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            return data[key];
        }
        throw new Error('[' + key + ']: page data error');
    }
}