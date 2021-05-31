"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VueParser = void 0;
var html_1 = require("../html");
var element_1 = require("../element");
var util_1 = require("../util");
var VueParser = (function () {
    function VueParser(project) {
        this.project = project;
    }
    VueParser.prototype.render = function (content, ext, srcFile) {
        if (ext === 'json') {
            return { json: content };
        }
        if (['less', 'css', 'wxss', 'scss', 'sass'].indexOf(ext) >= 0) {
            return { style: { type: ext, content: this.project.style.render(content, srcFile) } };
        }
        if ('js' === ext) {
            return { script: { type: ext, content: content } };
        }
        if ('ts' === ext) {
            return this.splitTsFile(content, []);
        }
        var data = html_1.htmlToJson(content);
        if (!data.children) {
            return {};
        }
        var items = {
            html: [],
            style: {
                type: 'css',
                lines: [],
            },
            script: {
                type: 'js',
                lines: [],
            }
        };
        for (var _i = 0, _a = data.children; _i < _a.length; _i++) {
            var item = _a[_i];
            if (['style', 'script'].indexOf(item.tag) >= 0) {
                if (item.children && item.children.length > 0) {
                    items[item.tag].lines.push(item.children[0].text);
                    if (item.attribute && item.attribute.items.lang) {
                        items[item.tag].type = item.attribute.items.lang;
                    }
                }
                continue;
            }
            if (item.tag !== 'template' || (item.attribute && item.attribute.items && Object.keys(item.attribute.items).length > 0)) {
                items.html.push(item);
                continue;
            }
            if (item.children && item.children.length > 0) {
                items.html = [].concat(items.html, item.children);
            }
        }
        var res = {};
        if (items.style.lines.length > 0) {
            res.style = { type: items.style.type, content: this.project.style.render(util_1.joinLine(items.style.lines), srcFile) };
        }
        var tplFuns = [];
        if (items.html.length > 0) {
            var wxml = this.project.template.render(new element_1.Element('root', undefined, undefined, items.html));
            res.template = wxml.template;
            tplFuns = wxml.func || [];
        }
        if (items.script.lines.length > 0) {
            var json = this.splitTsFile(util_1.joinLine(items.script.lines), tplFuns);
            res.script = { type: items.script.type, content: json.script ? json.script.content : '' };
            res.json = json.json;
        }
        if (res.script && res.script.isApp) {
            res.template = undefined;
        }
        return res;
    };
    VueParser.prototype.splitTsFile = function (content, tplfuns) {
        var res = this.project.script.render(content, tplfuns);
        var data = {
            script: {
                type: 'ts',
                content: res.script,
                isApp: res.isApp,
                isComponent: res.isComponent,
                isPage: res.isPage,
            },
        };
        data.json = res.json;
        return data;
    };
    return VueParser;
}());
exports.VueParser = VueParser;
