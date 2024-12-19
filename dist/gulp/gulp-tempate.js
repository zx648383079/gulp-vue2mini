import { Transform } from 'readable-stream';
import { preImport, endImport, replaceTTF } from '../parser/mini/css';
import { CacheManger } from '../util';
import { MiniProject } from '../parser/mini/project';
import { CompilerFile } from '../compiler';
const cachesFiles = new CacheManger();
const project = new MiniProject(process.cwd(), process.cwd());
export function dealTemplateFile(contentBuff, path, ext, wantTag) {
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
    const res = project.readyMixFile(new CompilerFile(path, 0, path, ext, String(contentBuff)));
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
export function renameExt(path, ext) {
    if (ext.length > 0 && ext.charAt(0) !== '.') {
        ext = '.' + ext;
    }
    return path.replace(/\.[^\.]+$/, ext);
}
export function replacePath(file, search, value) {
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
export function template(tag, srcFolder = 'src', distFolder = 'dist', tplExt = '.vue') {
    return new Transform({
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
                const str = preImport(String(file.contents));
                file.contents = Buffer.from(str);
                file.path = replacePath(file.path, distFolder, srcFolder);
                return callback(undefined, file);
            }
            if (tag === 'endsass') {
                let str = endImport(String(file.contents));
                str = replaceTTF(str, replacePath(file.base, distFolder, srcFolder));
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
