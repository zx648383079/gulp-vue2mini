import * as path from 'path';
import * as fs from 'fs';
import { preImport, endImport, replaceTTF, StyleParser } from './css';
import { VueParser } from './vue';
import { BaseProjectCompiler, CompilerFile, eachCompileFile, fileContent, PluginCompiler } from '../../compiler';
import { ScriptParser } from './ts';
import { LinkManager } from '../../util/link';
import { WxmlCompiler } from './wxml';
import { JsonParser } from './json';
export class MiniProject extends BaseProjectCompiler {
    link = new LinkManager();
    script = new ScriptParser(this);
    template = new WxmlCompiler(this);
    style = new StyleParser(this);
    json = new JsonParser(this);
    mix = new VueParser(this);
    readyFile(src) {
        const ext = src.extname;
        const dist = this.outputFile(src);
        if (ext === '.ts') {
            return CompilerFile.from(src, dist.replace(ext, '.js'), 'ts');
        }
        if (ext === '.scss' || ext === '.sass') {
            if (src.basename.startsWith('_')) {
                return undefined;
            }
            return CompilerFile.from(src, dist.replace(ext, '.wxss'), ext.substring(1));
        }
        if (ext === '.less') {
            return CompilerFile.from(src, dist.replace(ext, '.wxss'), ext.substring(1));
        }
        if (['.ttf', '.json'].indexOf(ext) >= 0) {
            return undefined;
        }
        if (ext === '.css') {
            return CompilerFile.from(src, dist.replace(ext, '.wxss'), ext.substring(1));
        }
        if (ext === '.html' || ext === '.vue') {
            return this.readyMixFile(src, ext, dist);
        }
        return CompilerFile.from(src, dist, ext.substring(1));
    }
    readyMixFile(src, content, ext, dist) {
        if (content === void 0) {
            [content, ext, dist] = [fileContent(src), src.extname, src.dist];
        }
        if (ext === void 0) {
            [content, ext, dist] = [fileContent(src), src.extname, content];
        }
        else if (dist === void 0) {
            [content, ext, dist] = [fileContent(src), content, ext];
        }
        let data = {};
        const jsonPath = src.src.replace(ext, '.json');
        if (jsonPath.endsWith('.json') && fs.existsSync(jsonPath)) {
            const json = fs.readFileSync(jsonPath).toString();
            data = json.trim().length > 0 ? JSON.parse(json) : {};
        }
        const res = this.mix.render(content, ext.substring(1).toLowerCase(), src.src);
        const files = [];
        files.push(CompilerFile.from(src, dist.replace(ext, '.json'), 'json', this.json.render(res.json, data)));
        if (res.template) {
            files.push(CompilerFile.from(src, dist.replace(ext, '.wxml'), 'wxml', res.template));
        }
        if (res.script) {
            files.push(CompilerFile.from(src, dist.replace(ext, '.js'), res.script.type, res.script.content));
        }
        if (res.style) {
            files.push(CompilerFile.from(src, dist.replace(ext, '.wxss'), res.style.type, res.style.content));
        }
        return files;
    }
    compileFile(src) {
        const compile = (file) => {
            this.mkIfNotFolder(path.dirname(file.dist));
            if (file.type === 'ts') {
                fs.writeFileSync(file.dist, PluginCompiler.ts(fileContent(file), src.src));
                return;
            }
            if (file.type === 'less') {
                PluginCompiler.less(fileContent(file), src.src).then(content => {
                    fs.writeFileSync(file.dist, content);
                });
                return;
            }
            if (file.type === 'sass' || file.type === 'scss') {
                let content = PluginCompiler.sass(preImport(fileContent(file)), src.src, file.type);
                content = endImport(content);
                fs.writeFileSync(file.dist, replaceTTF(content, src.dirname));
                return;
            }
            if (typeof file.content !== 'undefined') {
                fs.writeFileSync(file.dist, file.content);
                return;
            }
            fs.copyFileSync(src.src, file.dist);
        };
        eachCompileFile(this.readyFile(src), file => {
            compile(file);
            this.logFile(file.src);
        });
    }
}
