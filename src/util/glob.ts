import { globSync } from 'glob';

function isGlobPattern(input: string): boolean {
    return input.indexOf('*') >= 0 || input.indexOf('?') >= 0 || input.indexOf('[') >= 0 || input.indexOf('(') >= 0 || input.indexOf('{') >= 0;
}

/**
 * 获取文件
 * @param input 
 * @returns 
 */
export function glob(input: string[]): string[] {
    const items = [];
    for (const item of input) {
        if (!isGlobPattern(item)) {
            items.push(item);
            continue;
        }
        items.push(...globSync(item));
    }
    return items;
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