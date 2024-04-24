"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitStr = exports.getExtensionName = exports.regexReplace = exports.eachObject = exports.cloneObject = exports.isEmptyCode = exports.isLineCode = exports.eachFile = exports.unStudly = exports.studly = exports.firstUpper = exports.twoPad = exports.joinLine = exports.splitLine = exports.LINE_SPLITE = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const compiler_1 = require("../compiler");
exports.LINE_SPLITE = '\r\n';
const splitLine = (content) => {
    if (content.indexOf(exports.LINE_SPLITE) >= 0) {
        return content.split(exports.LINE_SPLITE);
    }
    if (content.indexOf('\n') >= 0) {
        return content.split('\n');
    }
    if (content.indexOf('\r') >= 0) {
        return content.split('\r');
    }
    return [content];
};
exports.splitLine = splitLine;
const joinLine = (lines) => {
    return lines.join(exports.LINE_SPLITE);
};
exports.joinLine = joinLine;
function twoPad(n) {
    const str = n.toString();
    return str[1] ? str : '0' + str;
}
exports.twoPad = twoPad;
function firstUpper(val) {
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
exports.firstUpper = firstUpper;
function studly(val, isFirstUpper = true) {
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
exports.studly = studly;
function unStudly(val, link = '-', isFirstLink = false) {
    if (!val || val.length < 1) {
        return '';
    }
    const items = [];
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
exports.unStudly = unStudly;
function eachFile(folder, cb) {
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
        cb(new compiler_1.CompilerFile(location, info.mtimeMs));
    });
}
exports.eachFile = eachFile;
function isLineCode(code) {
    return code === '\r' || code === '\n';
}
exports.isLineCode = isLineCode;
function isEmptyCode(code) {
    return code === ' ' || isLineCode(code) || code === '\t';
}
exports.isEmptyCode = isEmptyCode;
function cloneObject(val) {
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
exports.cloneObject = cloneObject;
function eachObject(obj, cb) {
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
exports.eachObject = eachObject;
function regexReplace(content, pattern, cb) {
    if (content.length < 1) {
        return content;
    }
    const matches = [];
    let match;
    while (null !== (match = pattern.exec(content))) {
        matches.push(match);
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
exports.regexReplace = regexReplace;
function getExtensionName(fileName, knownExtensions) {
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
exports.getExtensionName = getExtensionName;
function splitStr(val, serach, count = 0) {
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
exports.splitStr = splitStr;
