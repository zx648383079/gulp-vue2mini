"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitStr = exports.getExtensionName = exports.regexReplace = exports.eachObject = exports.cloneObject = exports.isEmptyCode = exports.isLineCode = exports.eachFile = exports.unStudly = exports.studly = exports.firstUpper = exports.twoPad = exports.joinLine = exports.splitLine = exports.LINE_SPLITE = void 0;
var fs = require("fs");
var path = require("path");
var compiler_1 = require("../compiler");
exports.LINE_SPLITE = '\r\n';
var splitLine = function (content) {
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
var joinLine = function (lines) {
    return lines.join(exports.LINE_SPLITE);
};
exports.joinLine = joinLine;
function twoPad(n) {
    var str = n.toString();
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
function studly(val, isFirstUpper) {
    if (isFirstUpper === void 0) { isFirstUpper = true; }
    if (!val || val.length < 1) {
        return '';
    }
    var items = [];
    val.split(/[\.\s_-]+/).forEach(function (item) {
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
function unStudly(val, link, isFirstLink) {
    if (link === void 0) { link = '-'; }
    if (isFirstLink === void 0) { isFirstLink = false; }
    if (!val || val.length < 1) {
        return '';
    }
    var items = [];
    val.split(/[A-Z\s]/).forEach(function (item) {
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
    var dirInfo = fs.readdirSync(folder);
    dirInfo.forEach(function (item) {
        var location = path.join(folder, item);
        var info = fs.statSync(location);
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
        return val.map(function (item) {
            return cloneObject(item);
        });
    }
    var res = {};
    for (var key in val) {
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
        for (var i = 0; i < obj.length; i++) {
            if (cb(obj[i], i) === false) {
                return false;
            }
        }
        return;
    }
    for (var key in obj) {
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
    var matches = [];
    var match;
    while (null !== (match = pattern.exec(content))) {
        matches.push(match);
    }
    var block = [];
    for (var i = matches.length - 1; i >= 0; i--) {
        match = matches[i];
        block.push(content.substring(match.index + match[0].length));
        block.push(cb(match));
        content = content.substring(0, match.index);
    }
    return content + block.reverse().join('');
}
exports.regexReplace = regexReplace;
function getExtensionName(fileName) {
    var i = fileName.lastIndexOf('.');
    if (i < 0) {
        return '';
    }
    return fileName.substring(i + 1);
}
exports.getExtensionName = getExtensionName;
function splitStr(val, serach, count) {
    if (count === void 0) { count = 0; }
    if (count < 1) {
        return val.split(serach);
    }
    if (count == 1) {
        return [val];
    }
    var i = -1;
    var data = [];
    while (true) {
        if (count < 2) {
            data.push(val.substring(i));
            break;
        }
        var index = val.indexOf(serach, i);
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
