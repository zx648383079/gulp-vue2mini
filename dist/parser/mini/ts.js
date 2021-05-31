"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptParser = void 0;
var util_1 = require("../util");
var CLASS_REG = /(export\s+(default\s+)?)?class\s+(\S+)\s+extends\s(WxPage|WxApp|WxComponent)[^\s\{]+/;
var ScriptParser = (function () {
    function ScriptParser(project) {
        this.project = project;
    }
    ScriptParser.prototype.render = function (source, templateFunc) {
        var content = source.replace(/import.+?from\s+.+?\.vue["'];/, '')
            .replace(/import.+?from\s+.+?typings.+?;/, '').replace(/@(WxJson|WxAppJson)\([\s\S]+?\)/, '');
        var match = content.match(CLASS_REG);
        if (!match) {
            return { script: content };
        }
        content = this.parseMethodToObject(this.appendMethod(content, templateFunc, match[0], match[4].indexOf('Component') > 0), {
            methods: '@WxMethod',
            lifetimes: '@WxLifeTime',
            pageLifetimes: '@WxPageLifeTime',
        }).replace(match[0], 'class ' + match[3]);
        var reg = new RegExp('(Page|Component)\\(new\\s+' + match[3]);
        var res = {
            isApp: match[4] === 'WxApp',
            isComponent: match[4] === 'WxComponent',
            isPage: match[4] === 'WxPage',
            script: !reg.test(content) ? content + util_1.LINE_SPLITE + match[4].substr(2) + '(new ' + match[3] + '());' : content,
        };
        if (res.isApp || res.isPage || res.isComponent) {
            res.json = this.parseJson(source);
        }
        return res;
    };
    ScriptParser.prototype.parseJson = function (content) {
        var match = content.match(/@(WxJson|WxAppJson)(\([\s\S]+?\))/);
        if (!match) {
            return;
        }
        return match[2].trim();
    };
    ScriptParser.prototype.parseMethodToObject = function (content, maps) {
        var strCount = function (search, line) {
            return line.split(search).length - 1;
        };
        var getTag = function (line) {
            for (var key in maps) {
                if (maps.hasOwnProperty(key) && line.indexOf(maps[key]) >= 0) {
                    return key;
                }
            }
            return;
        };
        var lines = util_1.splitLine(content);
        var num = 0;
        var inMethod = 0;
        var method;
        var data = {};
        var block = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (inMethod === 0) {
                method = getTag(line);
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
            var leftNum = strCount('{', line);
            num += leftNum - strCount('}', line);
            if (inMethod === 1) {
                block.push(line.replace(/public\s/, ''));
                lines[i] = '';
                if (leftNum > 0) {
                    if (num === 0) {
                        data[method + ''].items.push(util_1.joinLine(block));
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
                data[method + ''].items.push(util_1.joinLine(block));
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
        content = util_1.joinLine(lines);
        for (var key in data) {
            if (!data.hasOwnProperty(key)) {
                continue;
            }
            var reg = new RegExp(key + '[^=\\{\\}\\(\\)]*=\\s*\\{');
            content = content.replace(reg, key + '={' + data[key].items.join(',') + ',');
        }
        return content;
    };
    ScriptParser.prototype.appendMethod = function (content, tplFuns, classLine, isComponent) {
        if (classLine === void 0) { classLine = ''; }
        if (isComponent === void 0) { isComponent = false; }
        if (!tplFuns || tplFuns.length < 1) {
            return content;
        }
        var pos = content.indexOf(classLine);
        var code = '';
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
        return util_1.joinLine([content.substr(0, pos + 1)].concat(tplFuns, [content.substr(pos + 2)]));
    };
    return ScriptParser;
}());
exports.ScriptParser = ScriptParser;
