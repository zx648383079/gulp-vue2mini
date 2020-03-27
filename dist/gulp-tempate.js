"use strict";
exports.__esModule = true;
var readable_stream_1 = require("readable-stream");
var fs = require("fs");
var css_1 = require("./parser/css");
var vue_1 = require("./parser/vue");
var cache_1 = require("./parser/cache");
var cachesFiles = new cache_1.CacheManger();
function dealTemplateFile(contentBuff, path, ext, wantTag) {
    if (wantTag === 'tpl') {
        wantTag = 'wxml';
    }
    var tplFile = path.replace(ext, '__tmpl.' + wantTag);
    if (cachesFiles.has(tplFile)) {
        return Buffer.from(cachesFiles.get(tplFile));
    }
    var data = {};
    if (['scss', 'sass', 'less', 'css', 'wxss'].indexOf(wantTag) < 0) {
        var jsonPath = path.replace(ext, '.json');
        if (fs.existsSync(jsonPath)) {
            data = JSON.parse(fs.readFileSync(jsonPath).toString());
        }
    }
    var res = vue_1.splitFile(String(contentBuff), ext.substr(1).toLowerCase(), data);
    for (var key in res) {
        if (res.hasOwnProperty(key)) {
            var item = res[key];
            var cacheKey = path.replace(ext, '__tmpl.' + item.type);
            if (!item.content || item.content.trim().length < 1 && cachesFiles.has(cacheKey)) {
                continue;
            }
            cachesFiles.set(cacheKey, item.content);
        }
    }
    if (cachesFiles.has(tplFile)) {
        return Buffer.from(cachesFiles.get(tplFile));
    }
    return Buffer.from(wantTag === 'json' ? '{}' : '');
}
exports.dealTemplateFile = dealTemplateFile;
function template(tag) {
    return new readable_stream_1.Transform({
        objectMode: true,
        transform: function (file, _, callback) {
            if (file.isNull()) {
                return callback();
            }
            function doReplace() {
                if (!file.isBuffer()) {
                    return callback();
                }
                if (/src[\\\/](parser|utils|api)/.test(file.path)) {
                    return callback(null, file);
                }
                if (tag === 'presass') {
                    var str = css_1.preImport(String(file.contents));
                    file.contents = Buffer.from(str);
                    return callback(null, file);
                }
                if (tag === 'endsass') {
                    var str = css_1.endImport(String(file.contents));
                    str = css_1.replaceTTF(String(file.contents), file.base);
                    file.contents = Buffer.from(str);
                    return callback(null, file);
                }
                file.contents = dealTemplateFile(file.contents, file.path, file.extname, tag);
                return callback(null, file);
            }
            doReplace();
        }
    });
}
exports.template = template;
;
