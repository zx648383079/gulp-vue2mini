import * as fs from 'fs';
import * as path from 'path';
import { CompliperFile } from '../compiler';
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

export function eachFile(folder: string, cb: (file: CompliperFile) => void) {
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
        cb(new CompliperFile(location, info.mtimeMs));
    });
}