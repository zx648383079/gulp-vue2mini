import * as path from 'path';
import * as fs from 'fs';
import { preImport, endImport, replaceTTF, StyleParser } from './css';
import { VueParser } from './vue';
import { Compiler, consoleLog, eachCompileFile, fileContent, ICompliper, ICompliperFile } from '../../compiler';
import { ScriptParser } from './ts';
import { LinkManager } from '../link';
import { TemplateParser } from './wxml';
import { JsonParser } from './json';

/**
 * 小程序转化
 */
export class MiniProject implements ICompliper {
    constructor(
        public inputFolder: string,
        public outputFolder: string,
        public options?: any
    ) {
    }

    public readonly link = new LinkManager();
    public readonly script = new ScriptParser(this);
    public readonly template = new TemplateParser(this);
    public readonly style = new StyleParser(this);
    public readonly json = new JsonParser(this);
    public readonly mix = new VueParser(this);

    public readyFile(src: string): undefined | ICompliperFile | ICompliperFile[] {
        const ext = path.extname(src);
        const dist = this.outputFile(src);
        if (ext === '.ts') {
            return {
                type: 'ts',
                src,
                dist: dist.replace(ext, '.js'),
            };
        }
        if (ext === '.scss' || ext === '.sass') {
            if (path.basename(src).indexOf('_') === 0) {
                return undefined;
            }
            return {
                type: ext.substring(1),
                src,
                dist: dist.replace(ext, '.wxss'),
            };
        }
        if (ext === '.less') {
            return {
                type: 'less',
                src,
                dist: dist.replace(ext, '.wxss'),
            };
        }
        if (['.ttf', '.json'].indexOf(ext) >= 0) {
            return undefined;
        }
        if (ext === '.css') {
            return {
                type: 'css',
                src,
                dist: dist.replace(ext, '.wxss'),
            };
        }
        if (ext === '.html' || ext === '.vue') {
            return this.readyMixFile(src, ext, dist);
        }
        return {
            type: ext.substring(1),
            src,
            dist,
        };
    }

    public readyMixFile(src: string, dist: string): ICompliperFile[];
    public readyMixFile(src: string, ext: string, dist: string): ICompliperFile[];
    public readyMixFile(src: string, content: string, ext: string, dist: string): ICompliperFile[];
    public readyMixFile(src: string, content: string, ext?: string, dist?: string): ICompliperFile[] {
        if (ext === void 0) {
            [content, ext, dist] = [fs.readFileSync(src).toString(), path.extname(src), content];
        } else if (dist === void 0) {
            [content, ext, dist] = [fs.readFileSync(src).toString(), content, ext];
        }
        let data = {};
        const jsonPath = src.replace(ext!, '.json');
        if (jsonPath.endsWith('.json') && fs.existsSync(jsonPath)) {
            const json = fs.readFileSync(jsonPath).toString();
            data = json.trim().length > 0 ? JSON.parse(json) : {};
        }
        const res = this.mix.render(content, ext!.substr(1).toLowerCase(), src);
        const files: ICompliperFile[] = [];
        files.push({
            src,
            content: this.json.render(res.json, data),
            dist: dist!.replace(ext!, '.json'),
            type: 'json',
        });
        if (res.template) {
            files.push({
                src,
                content: res.template,
                dist: dist!.replace(ext!, '.wxml'),
                type: 'wxml'
            });;
        }
        if (res.script) {
            files.push({
                src,
                content: res.script.content,
                dist: dist!.replace(ext!, '.js'),
                type: res.script.type
            });
        }
        if (res.style) {
            files.push({
                src,
                content: res.style.content,
                dist: dist!.replace(ext!, '.wxss'),
                type: res.style.type
            });
        }
        return files;
    }

    /**
     * compileFile
     */
    public compileFile(src: string) {
        const compile = (file: ICompliperFile) => {
            this.mkIfNotFolder(path.dirname(file.dist));
            if (file.type === 'ts') {
                fs.writeFileSync(file.dist,
                    Compiler.ts(fileContent(file), src)
                );
                return;
            }
            if (file.type === 'less') {
                Compiler.less(fileContent(file), src).then(content => {
                    fs.writeFileSync(file.dist, content);
                });
                return;
            }
            if (file.type === 'sass' || file.type === 'scss') {
                let content = Compiler.sass(preImport(fileContent(file)), src, file.type);
                content = endImport(content);
                fs.writeFileSync(file.dist,
                    replaceTTF(content, path.dirname(src))
                );
                return;
            }
            if (typeof file.content !== 'undefined') {
                fs.writeFileSync(file.dist, file.content);
                return;
            }
            fs.copyFileSync(src, file.dist);
        };
        eachCompileFile(this.readyFile(src), file => {
            compile(file);
            this.logFile(file.src);
        });
    }

    /**
     * mkIfNotFolder
     */
    public mkIfNotFolder(folder: string) {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, {recursive: true});
        }
    }

    /**
     * outputFile
     */
    public outputFile(file: string) {
        return path.resolve(this.outputFolder, path.relative(this.inputFolder, file));
    }

    public unlink(src: string) {
        const dist = this.outputFile(src);
        if (fs.existsSync(dist)) {
            fs.unlinkSync(dist);
        }
    }

    /**
     * logFile
     */
    public logFile(file: string, tip = 'Finished') {
        consoleLog(file, tip, this.inputFolder);
    }
}
