"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.LINE_SPLITE = "\r\n";
var CLASS_REG = /(export\s+(default\s+)?)?class\s+(\S+)\s+extends\s(WxPage|WxApp|WxComponent)[^\s\{]+/;
function parsePage(content, tplFuns) {
    content = content.replace(/import.+?from\s+.+?\.vue["'];/, '')
        .replace(/import.+?from\s+.+?typings.+?;/, '').replace(/@(WxJson|WxAppJson)\([\s\S]+?\)/, '');
    var match = content.match(CLASS_REG);
    if (!match) {
        return content;
    }
    content = parseMethodToObject(appendMethod(content, tplFuns, match[0], match[4].indexOf('Component') > 0), {
        'methods': '@WxMethod',
        'lifetimes': '@WxLifeTime',
        'pageLifetimes': '@WxPageLifeTime'
    }).replace(match[0], 'class ' + match[3]);
    var reg = new RegExp('(Page|Component)\\(new\\s+' + match[3]);
    if (reg.test(content)) {
        return content;
    }
    return content + exports.LINE_SPLITE + match[4].substr(2) + '(new ' + match[3] + '());';
}
exports.parsePage = parsePage;
function parseJson(content, append) {
    var match = content.match(/@(WxJson|WxAppJson)(\([\s\S]+?\))/);
    if (!match) {
        return null;
    }
    if (!append) {
        return JSON.stringify(eval(match[2].trim()));
    }
    return JSON.stringify(Object.assign({}, append, eval(match[2].trim())));
}
exports.parseJson = parseJson;
function parseMethodToObject(content, maps) {
    var str_count = function (search, line) {
        return line.split(search).length - 1;
    }, get_tag = function (line) {
        for (var key in maps) {
            if (maps.hasOwnProperty(key) && line.indexOf(maps[key]) >= 0) {
                return key;
            }
        }
        return;
    }, lines = content.split(exports.LINE_SPLITE), num = 0, inMethod = 0, method, data = {}, block = [];
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (inMethod === 0) {
            method = get_tag(line);
            if (!method) {
                continue;
            }
            num = 0;
            inMethod = 1;
            lines[i] = '';
            block = [];
            if (!data.hasOwnProperty(method)) {
                data[method] = {
                    i: i,
                    items: []
                };
            }
            continue;
        }
        if (inMethod < 1) {
            continue;
        }
        var leftNum = str_count('{', line);
        num += leftNum - str_count('}', line);
        if (inMethod === 1) {
            block.push(line.replace(/public\s/, ''));
            lines[i] = '';
            if (leftNum > 0) {
                if (num === 0) {
                    data[method + ''].items.push(block.join(exports.LINE_SPLITE));
                    inMethod = 0;
                    continue;
                }
                inMethod = 2;
                continue;
            }
            continue;
        }
        block.push(line);
        lines[i] = '';
        if (num === 0) {
            data[method + ''].items.push(block.join(exports.LINE_SPLITE));
            inMethod = 0;
            continue;
        }
    }
    for (var key in data) {
        if (!data.hasOwnProperty(key)) {
            continue;
        }
        var reg = new RegExp(key + '[^=\\{\\}\\(\\)]*=\\s*\\{');
        if (!reg.test(content)) {
            lines[data[key].i] = key + '={' + data[key].items.join(',') + '}';
            delete data[key];
        }
    }
    content = lines.join(exports.LINE_SPLITE);
    for (var key in data) {
        if (!data.hasOwnProperty(key)) {
            continue;
        }
        var reg = new RegExp(key + '[^=\\{\\}\\(\\)]*=\\s*\\{');
        content = content.replace(reg, key + '={' + data[key].items.join(',') + ',');
    }
    return content;
}
exports.parseMethodToObject = parseMethodToObject;
function appendMethod(content, tplFuns, classLine, isComponent) {
    if (classLine === void 0) { classLine = ''; }
    if (isComponent === void 0) { isComponent = false; }
    if (!tplFuns || tplFuns.length < 1) {
        return content;
    }
    var pos = content.indexOf(classLine), code = '';
    while (pos < content.length) {
        code = content.charAt(++pos);
        if (code === '{') {
            break;
        }
    }
    if (isComponent) {
        var lines = [];
        for (var _i = 0, tplFuns_1 = tplFuns; _i < tplFuns_1.length; _i++) {
            var item = tplFuns_1[_i];
            lines.push('@WxMethod');
            lines.push(item);
        }
        tplFuns = lines;
    }
    return __spreadArrays([content.substr(0, pos + 1)], tplFuns, [content.substr(pos + 2)]).join(exports.LINE_SPLITE);
}