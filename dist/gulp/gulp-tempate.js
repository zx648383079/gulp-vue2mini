"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dealTemplateFile = dealTemplateFile;
exports.renameExt = renameExt;
exports.replacePath = replacePath;
exports.template = template;
const readable_stream_1 = require("readable-stream");
const css_1 = require("../parser/mini/css");
const util_1 = require("../util");
const project_1 = require("../parser/mini/project");
const compiler_1 = require("../compiler");
const cachesFiles = new util_1.CacheManger();
const project = new project_1.MiniProject(process.cwd(), process.cwd());
function dealTemplateFile(contentBuff, path, ext, wantTag) {
    if (wantTag === 'tpl') {
        wantTag = 'wxml';
    }
    const tplFile = path.replace(ext, '__tmpl.' + wantTag);
    if (cachesFiles.has(tplFile)) {
        return Buffer.from(cachesFiles.get(tplFile));
    }
    const fileTag = renameExt(path, '.__tmpl');
    if (cachesFiles.has(fileTag)) {
        return Buffer.from(wantTag === 'json' ? '{}' : '');
    }
    const res = project.readyMixFile(new compiler_1.CompilerFile(path, 0, path, ext, String(contentBuff)));
    for (const item of res) {
        const cacheKey = path.replace(ext, '__tmpl.' + item.type);
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
function renameExt(path, ext) {
    if (ext.length > 0 && ext.charAt(0) !== '.') {
        ext = '.' + ext;
    }
    return path.replace(/\.[^\.]+$/, ext);
}
function replacePath(file, search, value) {
    const regex = new RegExp('[\\\\/]' + search + '$');
    if (regex.test(file)) {
        return file.substring(0, file.length - search.length) + value;
    }
    let split = '/';
    if (file.indexOf('\\') > 0) {
        split = '\\';
    }
    return file.replace(split + search + split, split + value + split);
}
function template(tag, srcFolder = 'src', distFolder = 'dist', tplExt = '.vue') {
    return new readable_stream_1.Transform({
        objectMode: true,
        transform: (file, _, callback) => {
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
                const str = (0, css_1.preImport)(String(file.contents));
                file.contents = Buffer.from(str);
                file.path = replacePath(file.path, distFolder, srcFolder);
                return callback(undefined, file);
            }
            if (tag === 'endsass') {
                let str = (0, css_1.endImport)(String(file.contents));
                str = (0, css_1.replaceTTF)(str, replacePath(file.base, distFolder, srcFolder));
                file.contents = Buffer.from(str);
                file.path = renameExt(replacePath(file.path, srcFolder, distFolder), 'wxss');
                return callback(undefined, file);
            }
            let sourcePath = file.path;
            let sourceExt = file.extname;
            if (sourcePath.indexOf(srcFolder) < 0) {
                sourceExt = tplExt.indexOf('.') !== 0 ? '.' + tplExt : tplExt;
                sourcePath = renameExt(replacePath(sourcePath, distFolder, srcFolder), sourceExt);
            }
            file.contents = dealTemplateFile(file.contents, sourcePath, sourceExt, tag);
            const extMap = {
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
