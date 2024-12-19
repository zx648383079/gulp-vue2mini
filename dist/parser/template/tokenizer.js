import { CacheManger } from '../../util/cache';
import * as path from 'path';
import { splitLine, splitStr } from '../../util';
export const REGEX_ASSET = /(src|href|action)=["']([^"'\>]+)/g;
export class ThemeTokenizer {
    project;
    constructor(project) {
        this.project = project;
    }
    cachesFiles = new CacheManger();
    render(file) {
        const time = file.mtime;
        if (this.cachesFiles.has(file.src, time)) {
            return this.cachesFiles.get(file.src);
        }
        const tokens = [];
        let isLayout = false;
        let canRender = true;
        const currentFolder = file.dirname;
        const ext = file.extname;
        const pageData = {};
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
                const [key, val] = splitStr(token.content, '=', 2);
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
    converterToken(line) {
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
        let type = 'extend';
        if (content === '@') {
            type = 'comment';
        }
        else if (content === '...') {
            type = 'content';
        }
        else if (content.charAt(0) === '~' && line.indexOf('@@') > 2) {
            type = 'random';
            content = line.substring(2);
        }
        else if (content.charAt(0) === '=') {
            type = 'echo';
            content = content.substring(1);
        }
        else if (content.indexOf('=') > 0) {
            type = 'set';
            content = line.substring(1);
            comment = '';
        }
        if (type === 'extend' && /[\<\>]/.test(content)) {
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
    mergeData(...items) {
        return Object.assign({}, ...items.filter(i => !!i));
    }
    echoValue(data, key) {
        key = key.trim();
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            return data[key];
        }
        throw new Error('[' + key + ']: page data error');
    }
}
