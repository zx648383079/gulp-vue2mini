"use strict";
exports.__esModule = true;
var readable_stream_1 = require("readable-stream");
var fs = require("fs");
var ts_1 = require("./parser/ts");
var css_1 = require("./parser/css");
var wxml_1 = require("./parser/wxml");
function template(tag) {
    return new readable_stream_1.Transform({
        objectMode: true,
        transform: function (file, _, callback) {
            if (file.isNull()) {
                return callback();
            }
            function isLang(attr, lang) {
                if (lang === 'tpl') {
                    return true;
                }
                if (tag === 'js' || tag === 'css') {
                    return !/lang=["']?\w+/.test(attr);
                }
                if (tag === 'sass') {
                    return /lang=["']?s[ac]ss/.test(attr);
                }
                return new RegExp('lang=["\']?' + lang).test(attr);
            }
            function doReplace() {
                if (!file.isBuffer()) {
                    return callback();
                }
                if (/src[\\\/](parser|utils|api)/.test(file.path)) {
                    return callback(null, file);
                }
                if (tag === 'json') {
                    var path = file.path.replace(file.extname, '.json');
                    var data = {};
                    if (fs.existsSync(path)) {
                        data = JSON.parse(fs.readFileSync(path).toString());
                    }
                    var str_1 = ts_1.parseJson(String(file.contents), data);
                    if (!str_1) {
                        return callback();
                    }
                    file.contents = Buffer.from(str_1);
                    return callback(null, file);
                }
                if (tag === 'presass') {
                    var str_2 = css_1.preImport(String(file.contents));
                    file.contents = Buffer.from(str_2);
                    return callback(null, file);
                }
                if (tag === 'endsass') {
                    var str_3 = css_1.endImport(String(file.contents));
                    str_3 = css_1.replaceTTF(String(file.contents), file.base);
                    file.contents = Buffer.from(str_3);
                    return callback(null, file);
                }
                if (file.extname === '.ts') {
                    if (tag !== 'ts') {
                        return callback(null, file);
                    }
                    if (!/(pages|components)/.test(file.path)) {
                        return callback(null, file);
                    }
                    file.contents = Buffer.from(ts_1.parsePage(String(file.contents)));
                    return callback(null, file);
                }
                var html = String(file.contents);
                var maps = {
                    js: '<script([\\s\\S]*?)>([\\s\\S]+?)</script>',
                    tpl: '<template([\\s\\S]*?)>([\\s\\S]+?)</template>',
                    css: '<style([\\s\\S]*?)>([\\s\\S]+?)</style>',
                    sass: '<style([\\s\\S]*?)>([\\s\\S]+?)</style>',
                    ts: '<script([\\s\\S]*?)>([\\s\\S]+?)</script>'
                };
                if (!maps.hasOwnProperty(tag)) {
                    return callback({ stack: 'error ' + tag }, file);
                }
                var reg = new RegExp(maps[tag], 'gi');
                var result;
                var str = '';
                while ((result = reg.exec(html)) !== null) {
                    if (tag === 'tpl' && result[1].indexOf('name=') > 0) {
                        str += result[0];
                        continue;
                    }
                    if (isLang(result[1], tag)) {
                        str += result[2];
                    }
                }
                if (tag === 'tpl') {
                    str = wxml_1.htmlToWxml(str);
                }
                else if (tag === 'ts') {
                    str = ts_1.parsePage(str);
                }
                file.contents = Buffer.from(str);
                return callback(null, file);
            }
            doReplace();
        }
    });
}
exports.template = template;
;
