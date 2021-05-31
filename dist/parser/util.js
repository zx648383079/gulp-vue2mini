"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studly = exports.firstUpper = exports.joinLine = exports.splitLine = exports.LINE_SPLITE = void 0;
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
