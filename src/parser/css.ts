import * as fs from 'fs';
import * as path from 'path';
/**
 * ttf文件 转 base64
 * @param file 
 */
export function ttfToBase64(file: string): string {
    const content = fs.readFileSync(file);
    return 'url(\'data:font/truetype;charset=utf-8;base64,'+ content.toString('base64') +'\') format(\'truetype\')';
}

/**
 * 替换字体使用
 * @param content 
 * @param folder 
 */
export function replaceTTF(content: string, folder: string): string {
    const reg = /@font-face\s*\{[^\{\}]+\}/g;
    let matches = content.match(reg);
    if (!matches || matches.length < 1) {
        return content;
    }
    const nameReg = /font-family:\s*[^;\{\}\(\)]+/;
    const ttfReg = /url\(\s*['"]?([^\(\)]+\.ttf)/;
    for (const macth of matches) {
        let nameMatch = macth.match(nameReg);
        if (!nameMatch) {
            continue;
        }
        let name = nameMatch[0];
        
        let ttfMatch = macth.match(ttfReg);
        if (!ttfMatch) {
            continue;
        }
        let ttf = ttfMatch[1];
        ttf = path.resolve(folder, ttf);
        ttf = ttfToBase64(ttf);
        content = content.replace(macth, `@font-face {
            ${name};
            src: ${ttf};
        }`);
    }
    return content;
}

export function preImport(content: string): string {
    let matches = content.match(/(@import.+;)/g);
    if (!matches || matches.length < 1) {
        return content;
    }
    for (const item of matches) {
        if (item.indexOf('.scss') < 0 && item.indexOf('.sass') < 0) {
            continue;
        }
        content = content.replace(item, '/** parser['+ item +']parser **/');
    }
    return content;
}

export function endImport(content: string): string {
    let matches = content.match(/\/\*\*\s{0,}parser\[(@.+)\]parser\s{0,}\*\*\//g);
    if (!matches || matches.length < 1) {
        return content;
    }
    for (const item of matches) {
        content = content.replace(item[0], item[1].replace('.scss', '.wxss').replace('.sass', '.wxss').replace('/src/', '/'));
    }
    return content;
}