import { CompliperFile } from '../../compiler';
import { CacheManger } from '../cache';
import * as path from 'path';
import { splitLine } from '../util';
import { TemplateProject } from './project';

export type TYPE_MAP = 'text' | 'comment' | 'extend' | 'script' | 'style' | 'layout' | 'content' | 'random' | 'theme';
export const REGEX_ASSET = /(src|href|action)=["']([^"'\>]+)/g;

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
}

export interface IThemeOption {
    [key: string]: string;
}

export interface IThemeObject {
    [key: string]: IThemeOption;
}

export class TemplateTokenizer {

    constructor(
        private project: TemplateProject
    ) {}

    private cachesFiles = new CacheManger<IPage>();
    
    /**
     * 将文件内容转成功token
     * @param file 
     * @returns 
     */
    public render(file: CompliperFile): IPage {
        const time = file.mtime;
        if (this.cachesFiles.has(file.src, time)) {
            return this.cachesFiles.get(file.src) as IPage;
        }
        const tokens: IToken[] = [];
        let isLayout = false;
        let canRender = true;
        const currentFolder = file.dirname;
        const ext = file.extname;
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
            canRender
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
        if (content === 'theme') {
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
}