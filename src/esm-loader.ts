import * as fs from 'fs';
import * as path from 'path';

function eachFile(folder: string, cb: (file: string) => void) {
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
        cb(location);
    });
}
export function regexReplace(content: string, pattern: RegExp, cb: (match: RegExpExecArray) => string): string {
    if (content.length < 1) {
        return content;
    }
    if (!pattern.global) {
        throw new Error(`pattern must be global regex, like: ${pattern}g`);
    }
    const matches = [];
    let match;
    let lastIndex = -1;
    while (null !== (match = pattern.exec(content))) {
        if (match.index <= lastIndex) {
            break;
        }
        matches.push(match);
        lastIndex = match.index;
    }
    const block = [];
    for (let i = matches.length - 1; i >= 0; i--) {
        match = matches[i];
        block.push(content.substring(match.index + match[0].length));
        block.push(cb(match));
        content = content.substring(0, match.index);
    }
    return content + block.reverse().join('');
}

function AddImportExtension(content: string, entry: string, extension: string) {
    entry = path.dirname(entry);
    return regexReplace(content, /((import|export) .* from\s+['"])(\.{1,2}\/.*)(?=['"])/g, macth => {
        if (macth[3].endsWith('.' + extension)) {
            return macth[0];
        }
        const fullPath = path.join(entry, macth[3]);
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
            return `${macth[1]}${macth[3]}/index.${extension}`;
        }
        return `${macth[1]}${macth[3]}.${extension}`;
    });
}

eachFile(path.join(process.cwd(), 'dist'), file => {
    if (!file.endsWith('.js')) {
        return;
    }
    fs.readFile(file, "utf8", (_, content) => {
        const res = AddImportExtension(content, file, 'js');
        if (res === content) {
            return;
        }
        fs.writeFile(file, res, () => {});
    });
});