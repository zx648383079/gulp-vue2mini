import { Transform } from "readable-stream";
import * as vinyl from "vinyl";
import * as fs from "fs";
import { parsePage, htmlToWxml, endImport, preImport, replaceTTF, parseJson } from "./parser";

export function template (tag: string) {
    return new Transform({
        objectMode: true,
        transform: function (file: vinyl, _: any, callback: Function) {
            if (file.isNull()) {
                return callback();
            }
            function isLang(attr: string, lang: string) {
                if (lang === 'tpl') {
                    return true;
                }
                if (tag === 'js' || tag === 'css') {
                    return !/lang=["']?\w+/.test(attr);
                }
                if (tag === 'sass') {
                    return /lang=["']?s[ac]ss/.test(attr);
                }
                return new RegExp('lang=["\']?'+lang).test(attr);
            }
            function doReplace() {
                if (!file.isBuffer()) {
                    return callback();
                }
                if (/src[\\\/](parser|utils|api)/.test(file.path)) {
                    return callback(null, file);
                }
                if (tag === 'json') {
                    let path = file.path.replace(file.extname, '.json');
                    let data = {};
                    if (fs.existsSync(path)) {
                        data = JSON.parse(fs.readFileSync(path).toString());
                    }
                    let str = parseJson(String(file.contents), data);
                    if (!str) {
                        return callback();
                    }
                    file.contents = Buffer.from(str);
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
                if (file.extname === '.ts') {
                    if (tag !== 'ts') {
                        return callback(null, file);
                    }
                    if (!/(pages|components)/.test(file.path)) {
                        return callback(null, file);
                    }
                    file.contents = Buffer.from(parsePage(String(file.contents)));
                    return callback(null, file);
                }
                let html = String(file.contents);
                let maps: any = {
                    js: '<script([\\s\\S]*?)>([\\s\\S]+?)</script>',
                    tpl: '<template([\\s\\S]*?)>([\\s\\S]+?)</template>',
                    css: '<style([\\s\\S]*?)>([\\s\\S]+?)</style>',
                    sass: '<style([\\s\\S]*?)>([\\s\\S]+?)</style>',
                    ts: '<script([\\s\\S]*?)>([\\s\\S]+?)</script>',
                };
                if (!maps.hasOwnProperty(tag)) {
                    return callback({stack: 'error ' + tag}, file);
                }
                let reg = new RegExp(maps[tag], 'gi');
                let result;
                let str = '';
                while ((result = reg.exec(html)) !== null) {
                    // 支持wxml子模版
                    if (tag === 'tpl' && result[1].indexOf('name=') > 0) {
                        str += result[0];
                        continue;
                    }
                    if (isLang(result[1], tag)) {
                        str += result[2];
                    }
                }
                if (tag === 'tpl') {
                    str = htmlToWxml(str);
                } else if (tag === 'ts') {
                    str = parsePage(str);
                }
                file.contents = Buffer.from(str);
                return callback(null, file);
            }
            doReplace();
        }
    });
};