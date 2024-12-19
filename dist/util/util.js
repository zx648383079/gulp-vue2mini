import * as fs from 'fs';
import * as path from 'path';
import { CompilerFile } from '../compiler';
export const LINE_SPLITE = '\r\n';
export const splitLine = (content) => {
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
export const joinLine = (lines) => {
    return lines.join(LINE_SPLITE);
};
export function twoPad(n) {
    const str = n.toString();
    return str[1] ? str : '0' + str;
}
export function firstUpper(val) {
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
export function studly(val, isFirstUpper = true) {
    if (!val || val.length < 1) {
        return '';
    }
    const items = [];
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
export function unStudly(val, link = '-', isFirstLink = false) {
    if (!val || val.length < 1) {
        return '';
    }
    const isUpperAlphabet = (v) => {
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
export function eachFile(folder, cb) {
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
export function isLineCode(code) {
    return code === '\r' || code === '\n';
}
export function isEmptyCode(code) {
    return code === ' ' || isLineCode(code) || code === '\t';
}
export function cloneObject(val) {
    if (typeof val !== 'object') {
        return val;
    }
    if (val instanceof Array) {
        return val.map(item => {
            return cloneObject(item);
        });
    }
    const res = {};
    for (const key in val) {
        if (Object.prototype.hasOwnProperty.call(val, key)) {
            res[key] = cloneObject(val[key]);
        }
    }
    return res;
}
export function eachObject(obj, cb) {
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
export function regexReplace(content, pattern, cb) {
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
export function getExtensionName(fileName, knownExtensions) {
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
export function splitStr(val, serach, count = 0) {
    if (count < 1) {
        return val.split(serach);
    }
    if (count == 1) {
        return [val];
    }
    let i = -1;
    const data = [];
    while (true) {
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
        count--;
        i = index + serach.length;
    }
    return data;
}
