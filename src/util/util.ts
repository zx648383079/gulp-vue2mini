import * as fs from 'fs';
import * as path from 'path';
import { CompilerFile } from '../compiler';
export const LINE_SPLITE = '\r\n';

/**
 * 根据换行符拆分文本
 * @param content 内容
 * @returns 所有行
 */
export const splitLine = (content: string): string[] => {
    if (content.indexOf(LINE_SPLITE) >= 0) {
        return content.split(LINE_SPLITE);
    }
    if (content.indexOf('\n') >= 0) {
        return content.split('\n');
    }
    if (content.indexOf('\r') >= 0) {
        return content.split('\r');
    }
    return [content];
};

/**
 * 合并行
 * @param lines 行
 * @returns 内容
 */
export const joinLine = (lines: string[]): string => {
    return lines.join(LINE_SPLITE);
};

export function twoPad(n: number): string {
    const str = n.toString();
    return str[1] ? str : '0' + str;
}

/**
 * 首字母大写
 */
 export function firstUpper(val: string): string {
    if (!val) {
        return '';
    }
    val = val.trim();
    if (val.length < 1) {
        return '';
    }
    if (val.length === 1) {
        return val.toUpperCase();
    }
    return val.substring(0, 1).toUpperCase() + val.substring(1);
}

/**
 * 转化成驼峰
 * @param val 字符串
 * @param isFirstUpper 第一个字母是否大写
 */
export function studly(val: string, isFirstUpper: boolean = true): string {
    if (!val || val.length < 1) {
        return '';
    }
    const items: string[] = [];
    val.split(/[\.\s_-]+/).forEach(item => {
        if (item.length < 1) {
            return;
        }
        if (!isFirstUpper && items.length < 1) {
            items.push(item);
            return;
        }
        items.push(firstUpper(item));
    });
    return items.join('');
}

export function unStudly(val: string, link = '-', isFirstLink = false): string {
    if (!val || val.length < 1) {
        return '';
    }
    const items: string[] = [];
    val.split(/[A-Z\s]/).forEach(item => {
        if (item.length < 1) {
            return;
        }
        if (!isFirstLink && items.length < 1) {
            items.push(item);
            return;
        }
        items.push(link);
        if (item.trim().length > 0) {
            items.push(item.toLowerCase());
        }
    });
    return items.join('');
}

export function eachFile(folder: string, cb: (file: CompilerFile) => void) {
    if (!folder) {
        return;
    }
    const dirInfo = fs.readdirSync(folder);
    dirInfo.forEach(item => {
        const location = path.join(folder, item);
        const info = fs.statSync(location);
        if (info.isDirectory()) {
            eachFile(location, cb);
            return;
        }
        cb(new CompilerFile(location, info.mtimeMs));
    });
}

/**
 * 是否是换行符
 * @param code 
 * @returns 
 */
export function isLineCode(code: string) {
    return code === '\r' || code === '\n';
}

/**
 * 判断是否是空字符
 * @param code 
 * @returns 
 */
export function isEmptyCode(code: string) {
    return code === ' ' || isLineCode(code) || code === '\t';
}



/**
 * 深层次复制对象
 */
export function cloneObject<T>(val: T): T {
    if (typeof val !== 'object') {
        return val;
    }
    if (val instanceof Array) {
        return val.map(item => {
            return cloneObject(item);
        }) as any;
    }
    const res: any = {};
    for (const key in val) {
        if (Object.prototype.hasOwnProperty.call(val, key)) {
            res[key] = cloneObject(val[key]);
        }
    }
    return res;
}

/**
 * 遍历对象属性或数组
 */
export function eachObject(obj: any, cb: (val: any, key?: string|number) => void|false): any {
    if (typeof obj !== 'object') {
        return cb(obj, undefined);
    }
    if (obj instanceof Array) {
        for (let i = 0; i < obj.length; i++) {
            if (cb(obj[i], i) === false) {
                return false;
            }
        }
        return;
    }
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            if (cb(obj[key], key) === false) {
                return false;
            }
        }
    }
}

/**
 * 正则匹配替换
 * @param content 
 * @param pattern 
 * @param cb 
 * @returns 
 */
export function regexReplace(content: string, pattern: RegExp, cb: (match: RegExpExecArray) => string): string {
    if (content.length < 1) {
        return content;
    }
    const matches: RegExpExecArray[] = [];
    let match: RegExpExecArray|null;
    while (null !== (match = pattern.exec(content))) {
        matches.push(match as RegExpExecArray);
    }
    const block: string[] = [];
    for (let i = matches.length - 1; i >= 0; i--) {
        match = matches[i];
        block.push(content.substring(match.index + match[0].length));
        block.push(cb(match));
        content = content.substring(0, match.index);
    }
    return content + block.reverse().join('');
}

/**
 * 获取拓展名
 * @param fileName 
 * @returns 无.
 */
export function getExtensionName(fileName: string): string {
    const i = fileName.lastIndexOf('.');
    if (i < 0) {
        return '';
    }
    return fileName.substring(i + 1);
}

/**
 * 根据字符分割字符串
 * @param val 待分割的字符串
 * @param serach 分割标识
 * @param count 分割段数
 * @returns 不一定等于分割段数
 */
export function splitStr(val: string, serach: string, count: number = 0): string[] {
    if (count < 1 ) {
        return val.split(serach);
    }
    if (count == 1) {
        return [val];
    }
    let i = -1;
    const data: string[] = [];
    while(true) {
        if (count < 2) {
            data.push(val.substring(i));
            break;
        }
        const index = val.indexOf(serach, i);
        if (index < 0) {
            data.push(val.substring(i));
            break;
        }
        data.push(val.substring(i, index));
        count -- ;
        i = index + serach.length;
    }
    return data;
}

/**
 * 根据文件路径，生成输出路径 支持 * 匹配单文件夹 支持 ** 支持多文件夹
 * @param input src/b/c/aa.js
 * @param output dist/ * /
 * @returns dist/c/aa.js
 */
export function renderOutputRule(input: string, output: string): string {
    if (!output.endsWith('/')) {
        return output;
    }
    const data = input.split(/[\\\/]/g);
    const items = output.split('/');
    items[items.length - 1] = data[data.length - 1];
    const res: string[] = [];
    items.forEach((v, i) => {
        if (v === '**') {
            const count = data.length - res.length - items.length + i + 1;
            for (let j = 0; j < count; j++) {
                res.push('*');
            }
            return;
        }
        res.push(v);
    });
    let remove = res.length - data.length;
    for (let i = res.length - 1; i >= 0; i--) {
        if (res[i] !== '*') {
            continue;
        }
        if (remove > 0) {
            res.splice(i, 1);
            remove --;
            continue;
        }
        res[i] = data[data.length - res.length + i];
    }
    return res.join('/');
}