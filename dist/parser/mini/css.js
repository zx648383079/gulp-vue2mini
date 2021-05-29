"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StyleParser = exports.endImport = exports.preImport = exports.replaceTTF = exports.ttfToBase64 = void 0;
var fs = require("fs");
var path = require("path");
function ttfToBase64(file) {
    var content = fs.readFileSync(file);
    return 'url(\'data:font/truetype;charset=utf-8;base64,' + content.toString('base64') + '\') format(\'truetype\')';
}
exports.ttfToBase64 = ttfToBase64;
function replaceTTF(content, folder) {
    var reg = /@font-face\s*\{[^\{\}]+\}/g;
    var matches = content.match(reg);
    if (!matches || matches.length < 1) {
        return content;
    }
    var nameReg = /font-family:\s*[^;\{\}\(\)]+/;
    var ttfReg = /url\(\s*['"]?([^\(\)]+\.ttf)/;
    for (var _i = 0, matches_1 = matches; _i < matches_1.length; _i++) {
        var macth = matches_1[_i];
        var nameMatch = macth.match(nameReg);
        if (!nameMatch) {
            continue;
        }
        var name_1 = nameMatch[0];
        var ttfMatch = macth.match(ttfReg);
        if (!ttfMatch) {
            continue;
        }
        var ttf = ttfMatch[1];
        ttf = path.resolve(folder, ttf);
        ttf = ttfToBase64(ttf);
        content = content.replace(macth, "@font-face {\n            " + name_1 + ";\n            src: " + ttf + ";\n        }");
    }
    return content;
}
exports.replaceTTF = replaceTTF;
function preImport(content) {
    var matches = content.match(/(@import.+;)/g);
    if (!matches || matches.length < 1) {
        return content;
    }
    for (var _i = 0, matches_2 = matches; _i < matches_2.length; _i++) {
        var item = matches_2[_i];
        if (item.indexOf('.scss') < 0 && item.indexOf('.sass') < 0) {
            continue;
        }
        content = content.replace(item, '/** parser[' + item + ']parser **/');
    }
    return content;
}
exports.preImport = preImport;
function endImport(content) {
    var matches = content.match(/\/\*\*\s{0,}parser\[(@.+)\]parser\s{0,}\*\*\//g);
    if (!matches || matches.length < 1) {
        return content;
    }
    for (var _i = 0, matches_3 = matches; _i < matches_3.length; _i++) {
        var item = matches_3[_i];
        content = content.replace(item[0], item[1].replace('.scss', '.wxss').replace('.sass', '.wxss').replace('/src/', '/'));
    }
    return content;
}
exports.endImport = endImport;
var StyleParser = (function () {
    function StyleParser() {
    }
    return StyleParser;
}());
exports.StyleParser = StyleParser;
