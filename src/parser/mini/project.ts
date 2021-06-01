import * as path from 'path';
import * as fs from 'fs';
import { preImport, endImport, replaceTTF, StyleParser } from './css';
import { VueParser } from './vue';
import { BaseCompliper, Compiler, CompliperFile, eachCompileFile, fileContent, ICompliper } from '../../compiler';
import { ScriptParser } from './ts';
import { LinkManager } from '../link';
import { TemplateParser } from './wxml';
import { JsonParser } from './json';

/**
 * 小程序转化
 */
export class MiniProject extends BaseCompliper implements ICompliper {

    public readonly link = new LinkManager();
    public readonly script = new ScriptParser(this);
    public readonly template = new TemplateParser(this);
    public readonly style = new StyleParser(this);
    public readonly json = new JsonParser(this);
    public readonly mix = new VueParser(this);

    public readyFile(src: CompliperFile): undefined | CompliperFile | CompliperFile[] {
        const ext = src.extname;
        const dist = this.outputFile(src);
        if (ext === '.ts') {
            return CompliperFile.from(src, dist.replace(ext, '.js'), 'ts');
        }
        if (ext === '.scss' || ext === '.sass') {
            if (src.basename.startsWith('_')) {
                return undefined;
            }
            return CompliperFile.from(src, dist.replace(ext, '.wxss'), ext.substring(1));
        }
        if (ext === '.less') {
            return CompliperFile.from(src, dist.replace(ext, '.wxss'), ext.substring(1));
        }
        if (['.ttf', '.json'].indexOf(ext) >= 0) {
            return undefined;
        }
        if (ext === '.css') {
            return CompliperFile.from(src, dist.replace(ext, '.wxss'), ext.substring(1));
        }
        if (ext === '.html' || ext === '.vue') {
            return this.readyMixFile(src, ext, dist);
        }
        return CompliperFile.from(src, dist, ext.substring(1));
    }

    public readyMixFile(src: CompliperFile): CompliperFile[];
    public readyMixFile(src: CompliperFile, dist: string): CompliperFile[];
    public readyMixFile(src: CompliperFile, ext: string, dist: string): CompliperFile[];
    public readyMixFile(src: CompliperFile, content: string, ext: string, dist: string): CompliperFile[];
    public readyMixFile(src: CompliperFile, content?: string, ext?: string, dist?: string): CompliperFile[] {
        if (content === void 0) {
            [content, ext, dist] = [fileContent(src), src.extname, src.dist];
        }
        if (ext === void 0) {
            [content, ext, dist] = [fileContent(src), src.extname, content];
        } else if (dist === void 0) {
            [content, ext, dist] = [fileContent(src), content, ext];
        }
        let data = {};
        const jsonPath = src.src.replace(ext!, '.json');
        if (jsonPath.endsWith('.json') && fs.existsSync(jsonPath)) {
            const json = fs.readFileSync(jsonPath).toString();
            data = json.trim().length > 0 ? JSON.parse(json) : {};
        }
        const res = this.mix.render(content, ext!.substr(1).toLowerCase(), src.src);
        const files: CompliperFile[] = [];
        files.push(CompliperFile.from(src, dist!.replace(ext!, '.json'), 'json', this.json.render(res.json, data)));
        if (res.template) {
            files.push(CompliperFile.from(src, dist!.replace(ext!, '.wxml'), 'wxml', res.template));
        }
        if (res.script) {
            files.push(CompliperFile.from(src, dist!.replace(ext!, '.js'), res.script.type, res.script.content));
        }
        if (res.style) {
            files.push(CompliperFile.from(src, dist!.replace(ext!, '.wxss'), res.style.type, res.style.content));
        }
        return files;
    }

    /**
     * compileFile
     */
    public compileFile(src: CompliperFile) {
        const compile = (file: CompliperFile) => {
            this.mkIfNotFolder(path.dirname(file.dist));
            if (file.type === 'ts') {
                fs.writeFileSync(file.dist,
                    Compiler.ts(fileContent(file), src.src)
                );
                return;
            }
            if (file.type === 'less') {
                Compiler.less(fileContent(file), src.src).then(content => {
                    fs.writeFileSync(file.dist, content);
                });
                return;
            }
            if (file.type === 'sass' || file.type === 'scss') {
                let content = Compiler.sass(preImport(fileContent(file)), src.src, file.type);
                content = endImport(content);
                fs.writeFileSync(file.dist,
                    replaceTTF(content, src.dirname)
                );
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
