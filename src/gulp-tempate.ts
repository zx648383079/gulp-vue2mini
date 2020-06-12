import { Transform } from "readable-stream";
import * as vinyl from "vinyl";
import * as fs from "fs";
import { preImport, endImport, replaceTTF } from "./parser/css";
import { splitFile } from "./parser/vue";
import { CacheManger } from "./parser/cache";

const cachesFiles = new CacheManger();

/**
 * 处理文件
 * @param contentBuff 
 * @param path 
 * @param ext .js
 * @param wantTag js
 */
export function dealTemplateFile(contentBuff: Buffer, path: string, ext: string, wantTag: string): Buffer {
    if (wantTag === 'tpl') {
        wantTag = 'wxml';
    } else if (wantTag == 'scss') {
        wantTag = 'sass';
    }
    let tplFile = path.replace(ext, '__tmpl.' + wantTag);
    if (cachesFiles.has(tplFile)) {
        return Buffer.from(cachesFiles.get(tplFile));
    }
    const fileTag = renameExt(path, '.__tmpl');
    if (cachesFiles.has(fileTag)) {
        return Buffer.from(wantTag === 'json' ? '{}' : '');
    }
    let data = {};
    if (['scss', 'sass', 'less', 'css', 'wxss'].indexOf(wantTag) < 0 || ext.indexOf('vue') > 0) {
        let jsonPath = path.replace(ext, '.json');
        if (fs.existsSync(jsonPath)) {
            const json = fs.readFileSync(jsonPath).toString();
            data = json.trim().length > 0 ? JSON.parse(json) : {};
        }
    }
    const res: any = splitFile(String(contentBuff), ext.substr(1).toLowerCase(), data);
    for (const key in res) {
        if (res.hasOwnProperty(key)) {
            const item = res[key];
            const cacheKey = path.replace(ext, '__tmpl.' + item.type);
            if ((!item.content || item.content.trim().length < 1) && cachesFiles.has(cacheKey)) {
                continue;
            }
            cachesFiles.set(cacheKey, item.content);
        }
    }
    cachesFiles.set(fileTag, true);
    if (cachesFiles.has(tplFile)) {
        return Buffer.from(cachesFiles.get(tplFile));
    }
    return Buffer.from(wantTag === 'json' ? '{}' : '');
}

/**
 * 修改文件后缀
 * @param path 
 * @param ext 
 */
export function renameExt(path: string, ext: string): string {
    if (ext.length > 0 && ext.charAt(0) !== '.') {
        ext = '.' + ext;
    }
    return path.replace(/\.[^\.]+$/, ext);
}

/**
 * 替换文件夹
 * @param file 原路径
 * @param search 要替换的文件夹名
 * @param value 新文件夹名
 */
export function replacePath(file: string, search: string, value: string): string {
    const regex = new RegExp('[\\\\/]' + search + '$');
    if (regex.test(file)) {
        return file.substr(0, file.length - search.length) + value;
    }
    let split = '/';
    if (file.indexOf('\\') > 0) {
        split = '\\';
    }
    return file.replace(split + search + split, split + value + split);
}

/**
 * 流程
 * @param tag 想要提取的内容
 * @param srcFolder 源目录
 * @param distFolder 目标目录
 * @param tplExt 源模板后缀
 */
export function template(tag: string, srcFolder: string = 'src', distFolder = 'dist', tplExt = '.vue') {
    return new Transform({
        objectMode: true,
        transform: function (file: vinyl, _: any, callback: Function) {
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
                    let str = preImport(String(file.contents));
                    file.contents = Buffer.from(str);
                    file.path = replacePath(file.path, distFolder, srcFolder);
                    return callback(null, file);
                }
                if (tag === 'endsass') {
                    let str = endImport(String(file.contents));
                    str = replaceTTF(String(file.contents), replacePath(file.base, distFolder, srcFolder));
                    file.contents = Buffer.from(str);
                    file.path = renameExt(replacePath(file.path, srcFolder, distFolder), 'wxss');
                    return callback(null, file);
                }
                let sourcePath = file.path;
                let sourceExt = file.extname;
                if (sourcePath.indexOf(srcFolder) < 0) {
                    sourceExt = tplExt.indexOf('.') !== 0 ? '.' + tplExt : tplExt;
                    sourcePath = renameExt(replacePath(sourcePath, distFolder, srcFolder), sourceExt);
                }
                file.contents = dealTemplateFile(file.contents, sourcePath, sourceExt, tag);
                const extMap: {[key: string]: string} = {
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
                return callback(null, file);
            }
            doReplace();
        }
    });
};