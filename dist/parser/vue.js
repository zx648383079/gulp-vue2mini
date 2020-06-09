"use strict";
exports.__esModule = true;
var ts_1 = require("./ts");
var html_1 = require("./html");
var wxml_1 = require("./wxml");
var element_1 = require("./element");
function splitFile(content, ext, appendJson) {
    if (ext === void 0) { ext = 'vue'; }
    if (ext === 'json') {
        return { json: { type: 'json', content: content } };
    }
    if (['scss', 'sass',].indexOf(ext) >= 0) {
        return { style: { type: 'sass', content: content } };
    }
    if (['less', 'css', 'wxss'].indexOf(ext) >= 0) {
        return { style: { type: ext, content: content } };
    }
    if ('js' === ext) {
        return { script: { type: ext, content: content } };
    }
    if ('ts' === ext) {
        return splitTsFile(content, [], appendJson);
    }
    var data = html_1.htmlToJson(content);
    if (!data.children) {
        return {};
    }
    var items = {
        html: [],
        style: {
            type: 'css',
            lines: []
        },
        script: {
            type: 'js',
            lines: []
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
        res.style = { type: ['scss', 'sass'].indexOf(items.style.type) >= 0 ? 'sass' : items.style.type, content: items.style.lines.join(ts_1.LINE_SPLITE) };
    }
    var tplFuns = [];
    if (items.html.length > 0) {
        var wxml = wxml_1.jsonToWxml(new element_1.Element('root', undefined, undefined, items.html));
        tplFuns = wxml_1.wxmlFunc;
        res.html = { type: 'wxml', content: wxml };
    }
    if (items.script.lines.length > 0) {
        var json = splitTsFile(items.script.lines.join(ts_1.LINE_SPLITE), tplFuns, appendJson);
        res.script = { type: items.script.type, content: json.script ? json.script.content : '' };
        res.json = json.json;
    }
    return res;
}
exports.splitFile = splitFile;
function splitTsFile(content, tplfuns, appendJson) {
    var json = ts_1.parseJson(content, appendJson);
    var data = {
        script: {
            type: 'ts',
            content: ts_1.parsePage(content, tplfuns)
        }
    };
    data['json'] = { type: 'json', content: json || '{}' };
    return data;
}
