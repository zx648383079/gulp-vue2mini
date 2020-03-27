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
    }
    let tplFile = path.replace(ext, '__tmpl.' + wantTag);
    if (cachesFiles.has(tplFile)) {
        return Buffer.from(cachesFiles.get(tplFile));
    }
    let data = {};
    if (['scss', 'sass', 'less', 'css', 'wxss'].indexOf(wantTag) < 0) {
        let jsonPath = path.replace(ext, '.json');
        if (fs.existsSync(jsonPath)) {
            data = JSON.parse(fs.readFileSync(jsonPath).toString());
        }
    }
    const res: any = splitFile(String(contentBuff), ext.substr(1).toLowerCase(), data);
    for (const key in res) {
        if (res.hasOwnProperty(key)) {
            const item = res[key];
            const cacheKey = path.replace(ext, '__tmpl.' + item.type);
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

export function template (tag: string) {
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
                    return callback(null, file);
                }
                if (tag === 'endsass') {
                    let str = endImport(String(file.contents));
                    str = replaceTTF(String(file.contents), file.base);
                    file.contents = Buffer.from(str);
                    return callback(null, file);
                }
                file.contents = dealTemplateFile(file.contents, file.path, file.extname, tag);
                return callback(null, file);
            }
            doReplace();
        }
    });
};