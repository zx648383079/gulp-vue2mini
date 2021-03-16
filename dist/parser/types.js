"use strict";
exports.__esModule = true;
exports.splitLine = exports.LINE_SPLITE = void 0;
exports.LINE_SPLITE = '\r\n';
var splitLine = function (content) {
    if (content.indexOf(exports.LINE_SPLITE) > 0) {
        return content.split(exports.LINE_SPLITE);
    }
    if (content.indexOf('\n')) {
        return content.split('\n');
    }
    if (content.indexOf('\r')) {
        return content.split('\r');
    }
    return [content];
};
exports.splitLine = splitLine;
