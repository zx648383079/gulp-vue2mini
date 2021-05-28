"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinLine = exports.splitLine = exports.LINE_SPLITE = void 0;
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
