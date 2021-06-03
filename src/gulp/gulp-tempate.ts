import { Transform } from 'readable-stream';
import * as vinyl from 'vinyl';
import { preImport, endImport, replaceTTF } from '../parser/mini/css';
import { CacheManger } from '../util';
import { transformCallback } from './types';
import { MiniProject } from '../parser/mini/project';
import { CompilerFile } from '../compiler';

const cachesFiles = new CacheManger();
const project = new MiniProject(process.cwd(), process.cwd());

/**
 * 处理文件
 * @param contentBuff 内容
 * @param path 路径
 * @param ext .js
 * @param wantTag js
 */
export function dealTemplateFile(contentBuff: Buffer, path: string, ext: string, wantTag: string): Buffer {
    if (wantTag === 'tpl') {
        wantTag = 'wxml';
    }
    const tplFile = path.replace(ext, '__tmpl.' + wantTag);
    if (cachesFiles.has(tplFile)) {
        return Buffer.from(cachesFiles.get(tplFile) as string);
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
        return Buffer.from(cachesFiles.get(tplFile) as string);
    }
    return Buffer.from(wantTag === 'json' ? '{}' : '');
}

/**
 * 修改文件后缀
 * @param path 路径
 * @param ext 拓展
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
        transform: (file: vinyl, _: any, callback: transformCallback) => {
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
            return callback(undefined, file);
        }
    });
}
