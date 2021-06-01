"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.template = exports.replacePath = exports.renameExt = exports.dealTemplateFile = void 0;
var readable_stream_1 = require("readable-stream");
var css_1 = require("../parser/mini/css");
var cache_1 = require("../parser/cache");
var project_1 = require("../parser/mini/project");
var compiler_1 = require("../compiler");
var cachesFiles = new cache_1.CacheManger();
var project = new project_1.MiniProject(process.cwd(), process.cwd());
function dealTemplateFile(contentBuff, path, ext, wantTag) {
    if (wantTag === 'tpl') {
        wantTag = 'wxml';
    }
    var tplFile = path.replace(ext, '__tmpl.' + wantTag);
    if (cachesFiles.has(tplFile)) {
        return Buffer.from(cachesFiles.get(tplFile));
    }
    var fileTag = renameExt(path, '.__tmpl');
    if (cachesFiles.has(fileTag)) {
        return Buffer.from(wantTag === 'json' ? '{}' : '');
    }
    var res = project.readyMixFile(new compiler_1.CompliperFile(path, 0, path, ext, String(contentBuff)));
    for (var _i = 0, res_1 = res; _i < res_1.length; _i++) {
        var item = res_1[_i];
        var cacheKey = path.replace(ext, '__tmpl.' + item.type);
        if ((!item.content || item.content.trim().length < 1) && cachesFiles.has(cacheKey)) {
            continue;
        }
        cachesFiles.set(cacheKey, item.content);
    }
    cachesFiles.set(fileTag, true);
    if (cachesFiles.has(tplFile)) {
        return Buffer.from(cachesFiles.get(tplFile));
    }
    return Buffer.from(wantTag === 'json' ? '{}' : '');
}
exports.dealTemplateFile = dealTemplateFile;
function renameExt(path, ext) {
    if (ext.length > 0 && ext.charAt(0) !== '.') {
        ext = '.' + ext;
    }
    return path.replace(/\.[^\.]+$/, ext);
}
exports.renameExt = renameExt;
function replacePath(file, search, value) {
    var regex = new RegExp('[\\\\/]' + search + '$');
    if (regex.test(file)) {
        return file.substr(0, file.length - search.length) + value;
    }
    var split = '/';
    if (file.indexOf('\\') > 0) {
        split = '\\';
    }
    return file.replace(split + search + split, split + value + split);
}
exports.replacePath = replacePath;
function template(tag, srcFolder, distFolder, tplExt) {
    if (srcFolder === void 0) { srcFolder = 'src'; }
    if (distFolder === void 0) { distFolder = 'dist'; }
    if (tplExt === void 0) { tplExt = '.vue'; }
    return new readable_stream_1.Transform({
        objectMode: true,
        transform: function (file, _, callback) {
            if (file.isNull()) {
                return callback();
            }
            if (!file.isBuffer()) {
                return callback();
            }
            if (/src[\\\/](parser|utils|api)/.test(file.path)) {
                return callback(undefined, file);
            }
            if (tag === 'presass') {
                var str = css_1.preImport(String(file.contents));
                file.contents = Buffer.from(str);
                file.path = replacePath(file.path, distFolder, srcFolder);
                return callback(undefined, file);
            }
            if (tag === 'endsass') {
                var str = css_1.endImport(String(file.contents));
                str = css_1.replaceTTF(str, replacePath(file.base, distFolder, srcFolder));
                file.contents = Buffer.from(str);
                file.path = renameExt(replacePath(file.path, srcFolder, distFolder), 'wxss');
                return callback(undefined, file);
            }
            var sourcePath = file.path;
            var sourceExt = file.extname;
            if (sourcePath.indexOf(srcFolder) < 0) {
                sourceExt = tplExt.indexOf('.') !== 0 ? '.' + tplExt : tplExt;
                sourcePath = renameExt(replacePath(sourcePath, distFolder, srcFolder), sourceExt);
            }
            file.contents = dealTemplateFile(file.contents, sourcePath, sourceExt, tag);
            var extMap = {
                tpl: 'wxml',
                wxml: 'wxml',
                js: 'js',
                ts: 'ts',
                sass: 'sass',
                css: 'wxss',
                json: 'json',
                scss: 'scss',
                less: 'less',
                wxss: 'wxss'
            };
            file.path = renameExt(file.path, extMap[tag]);
            return callback(undefined, file);
        }
    });
}
exports.template = template;
