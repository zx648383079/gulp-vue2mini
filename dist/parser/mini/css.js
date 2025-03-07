"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StyleParser = void 0;
exports.ttfToBase64 = ttfToBase64;
exports.replaceTTF = replaceTTF;
exports.preImport = preImport;
exports.endImport = endImport;
const fs = require("fs");
const path = require("path");
function ttfToBase64(file) {
    const content = fs.readFileSync(file);
    return 'url(\'data:font/truetype;charset=utf-8;base64,' + content.toString('base64') + '\') format(\'truetype\')';
}
function replaceTTF(content, folder) {
    const reg = /@font-face\s*\{[^\{\}]+\}/g;
    const matches = content.match(reg);
    if (!matches || matches.length < 1) {
        return content;
    }
    const nameReg = /font-family:\s*[^;\{\}\(\)]+/;
    const ttfReg = /url\(\s*['"]?([^\(\)]+\.ttf)/;
    for (const macth of matches) {
        const nameMatch = macth.match(nameReg);
        if (!nameMatch) {
            continue;
        }
        const name = nameMatch[0];
        const ttfMatch = macth.match(ttfReg);
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
function preImport(content) {
    const matches = content.match(/(@import.+;)/g);
    if (!matches || matches.length < 1) {
        return content;
    }
    for (const item of matches) {
        if (item.indexOf('.scss') < 0 && item.indexOf('.sass') < 0) {
            continue;
        }
        content = content.replace(item, '/** parser[' + item + ']parser **/');
    }
    return content;
}
function endImport(content) {
    const matches = content.match(/\/\*\*\s{0,}parser\[(@.+)\]parser\s{0,}\*\*\//g);
    if (!matches || matches.length < 1) {
        return content;
    }
    for (const item of matches) {
        content = content.replace(item[0], item[1].replace('.scss', '.wxss').replace('.sass', '.wxss').replace('/src/', '/'));
    }
    return content;
}
class StyleParser {
    constructor(_) { }
    render(content, _) {
        return content;
    }
}
exports.StyleParser = StyleParser;
