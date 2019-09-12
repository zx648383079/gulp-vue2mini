"use strict";
exports.__esModule = true;
var LINE_SPLITE = "\r\n";
function parsePage(content) {
    content = content.replace(/import.+?from\s+.+?\.vue["'];/, '')
        .replace(/import.+?from\s+.+?typings.+?;/, '').replace(/@WxJson\([\s\S]+?\)/, '');
    var match = content.match(/(export\s+(default\s+)?)?class\s+(\S+)\s+extends\s(WxPage|WxComponent)[^\s\{]+/);
    if (!match) {
        return content;
    }
    content = parseMethodToObject(content, {
        'methods': '@WxMethod',
        'lifetimes': '@WxLifeTime',
        'pageLifetimes': '@WxPageLifeTime'
    }).replace(match[0], 'class ' + match[3]);
    var reg = new RegExp('(Page|Component)\\(new\\s+' + match[3]);
    if (reg.test(content)) {
        return content;
    }
    return content + LINE_SPLITE + (match[4].indexOf('Page') > 0 ? 'Page' : 'Component') + '(new ' + match[3] + '());';
}
exports.parsePage = parsePage;
function parseJson(content, append) {
    var match = content.match(/@WxJson(\([\s\S]+?\))/);
    if (!match) {
        return null;
    }
    return JSON.stringify(Object.assign({}, append, eval(match[1].trim())));
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
    }, lines = content.split(LINE_SPLITE), num = 0, inMethod = 0, method, data = {}, block = [];
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
                    data[method + ''].items.push(block.join(LINE_SPLITE));
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
            data[method + ''].items.push(block.join(LINE_SPLITE));
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
    content = lines.join(LINE_SPLITE);
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
