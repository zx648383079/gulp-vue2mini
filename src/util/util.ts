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
    const isUpperAlphabet = (v: string) => {
        if (v.length !== 1) {
            return false;
        }
        const code = v.charCodeAt(0);
        return code >= 65 && code <= 90;
    };
    const res = regexReplace(val, /([A-Z]|[\.\s_-]+)/g, match => {
        const v = isUpperAlphabet(match[0]) ? match[0].toLowerCase() : '';
        if (match.index < 1 && !isFirstLink) {
            return v;
        }
        return link + v;
    });
    if (link.length > 0 && !res.startsWith(link) && isFirstLink) {
        return link + res;
    }
    return res;
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
    if (!pattern.global) {
        throw new Error(`pattern must be global regex, like: ${pattern}g`);
    }
    const matches: RegExpExecArray[] = [];
    let match: RegExpExecArray|null;
    let lastIndex = -1;
    while (null !== (match = pattern.exec(content))) {
        if (match.index <= lastIndex) {
            // 陷入死循环
            break;
        }
        matches.push(match as RegExpExecArray);
        lastIndex = match.index;
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
 * @param knownExtensions 一些复杂的拓展名，['d.ts']
 * @returns 无 .
 */
export function getExtensionName(fileName: string, knownExtensions?: string[]): string {
    if (knownExtensions) {
		for (const ext of knownExtensions) {
            if (fileName.endsWith('.' + ext)) {
                return ext;
            }
		}
	}
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