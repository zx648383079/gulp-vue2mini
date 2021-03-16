import { LINE_SPLITE, splitLine } from '../types';

const CLASS_REG = /(export\s+(default\s+)?)?class\s+(\S+)\s+extends\s(WxPage|WxApp|WxComponent)[^\s\{]+/;

/**
 * 处理ts文件
 * @param content 内容
 */
export function parsePage(content: string, tplFuns?: string[]): string {
    content = content.replace(/import.+?from\s+.+?\.vue["'];/, '')
    .replace(/import.+?from\s+.+?typings.+?;/, '').replace(/@(WxJson|WxAppJson)\([\s\S]+?\)/, '');
    const match = content.match(CLASS_REG);
    if (!match) {
        return content;
    }
    content = parseMethodToObject(appendMethod(content, tplFuns, match[0], match[4].indexOf('Component') > 0), {
        methods: '@WxMethod',
        lifetimes: '@WxLifeTime',
        pageLifetimes: '@WxPageLifeTime',
    }).replace(match[0], 'class ' + match[3]);
    const reg = new RegExp('(Page|Component)\\(new\\s+' + match[3]);
    if (reg.test(content)) {
        return content;
    }
    return content + LINE_SPLITE + match[4].substr(2) + '(new ' + match[3] + '());';
}

export function parseJson(content: string, append: any): string| null {
    const match = content.match(/@(WxJson|WxAppJson)(\([\s\S]+?\))/);
    if (!match) {
        return null;
    }
    if (!append) {
        // tslint:disable-next-line: no-eval
        return JSON.stringify(eval(match[2].trim()));
    }
    // tslint:disable-next-line: no-eval
    return JSON.stringify(Object.assign({}, append, eval(match[2].trim())));
}

/**
 * 进行合并操作
 * @param content 内容
 * @param maps 方法
 * @param tplFuns 方法
 */
export function parseMethodToObject(content: string, maps: {[key: string]: string}): string {
    /**
     * 判断一行中字符串出现的次数
     */
    const strCount = (search: string, line: string): number => {
        return line.split(search).length - 1;
    };
    /**
     * 获取当前行应该的属性名
     */
    const getTag = (line: string) => {
        for (const key in maps) {
            if (maps.hasOwnProperty(key) && line.indexOf(maps[key]) >= 0) {
                return key;
            }
        }
        return;
    };
    const lines = splitLine(content);
    /**
     * {} 这个符号的未闭合的数
     */
    let num = 0;
    /**
     * 是否在属性名中
     */
    let inMethod = 0;
    /**
     * 属性名
     */
    let method: string | undefined;
    const data: {[key: string]: any} = {};
    /**
     * 当前属性名已有的内容
     */
    let block: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (inMethod === 0) {
            method = getTag(line);
            if (!method) {
                continue;
            }
            num = 0;
            inMethod = 1;
            lines[i] = '';
            block = [];
            if (!data.hasOwnProperty(method)) {
                data[method] = {
                    i,
                    items: []
                };
            }
            continue;
        }
        if (inMethod < 1) {
            continue;
        }
        const leftNum = strCount('{', line);
        num += leftNum - strCount('}', line);
        if (inMethod === 1) {
            block.push(line.replace(/public\s/, ''));
            lines[i] = '';
            if (leftNum > 0) {
                if (num === 0) {
                    data[method + ''].items.push(block.join(LINE_SPLITE));
                    inMethod = 0;
                    continue;
                }
                inMethod = 2;
                continue;
            }
            continue;
        }
        block.push(line);
        lines[i] = '';
        if (num === 0) {
            data[method + ''].items.push(block.join(LINE_SPLITE));
            inMethod = 0;
            continue;
        }
    }
    // 如果没有相关属性就把合并生成的属性插入第一个位置
    for (const key in data) {
        if (!data.hasOwnProperty(key)) {
            continue;
        }
        const reg = new RegExp(key + '[^=\\{\\}\\(\\)]*=\\s*\\{');
        if (!reg.test(content)) {
            lines[data[key].i] = key + '={' + data[key].items.join(',') + '}';
            delete data[key];
        }
    }
    content = lines.join(LINE_SPLITE);
    // 如果有就进行替换
    for (const key in data) {
        if (!data.hasOwnProperty(key)) {
            continue;
        }
        const reg = new RegExp(key + '[^=\\{\\}\\(\\)]*=\\s*\\{');
        content = content.replace(reg, key + '={' + data[key].items.join(',') + ',');
    }
    return content;
}

function appendMethod(content: string, tplFuns?: string[], classLine: string = '', isComponent: boolean = false): string {
    if (!tplFuns || tplFuns.length < 1) {
        return content;
    }
    let pos = content.indexOf(classLine);
    let code = '';
    while (pos < content.length) {
        code = content.charAt(++pos);
        if (code === '{') {
            break;
        }
    }
    if (isComponent) {
        const lines = [];
        for (const item of tplFuns) {
            lines.push('@WxMethod');
            lines.push(item);
        }
        tplFuns = lines;
    }
    return [content.substr(0, pos + 1)].concat(tplFuns, [content.substr(pos + 2)]).join(LINE_SPLITE);
}
