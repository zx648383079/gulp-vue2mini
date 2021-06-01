import * as fs from 'fs';
import * as path from 'path';
import { BaseCompliper, Compiler, CompliperFile, eachCompileFile, fileContent, ICompliper } from '../../compiler';
import * as UglifyJS from 'uglify-js';
import * as CleanCSS from 'clean-css';
import { TemplateTokenizer } from './tokenizer';
import { LinkManager } from '../link';
import { StyleParser } from './style';
import { TemplateParser } from './template';
import { ScriptParser } from './script';
import { CacheManger } from '../cache';
import { eachFile } from '../util';



/**
 * 模板项目转化
 */
export class TemplateProject extends BaseCompliper implements ICompliper {

    constructor(
        inputFolder: string,
        outputFolder: string,
        options?: any
    ) {
        super(inputFolder, outputFolder, options);
        this.link.on((file: string, mtime: number) => {
            this.compileAFile(new CompliperFile(file, mtime))
        });
        this.ready();
    }

    public readonly link = new LinkManager();
    public readonly script = new ScriptParser(this);
    public readonly template = new TemplateParser(this);
    public readonly style = new StyleParser(this);
    public readonly tokenizer = new TemplateTokenizer(this);
    public readonly cache = new CacheManger<string>();

    /**
     * 是否压缩最小化
     */
    public get compliperMin(): boolean {
        return this.options && this.options.min;
    }

    /**
     * 编译一个文件
     * @param file 文件路径
     * @param content 内容
     */
    public renderFile(file: CompliperFile): string {
        const res = this.template.render(file);
        return res.template;
    }

    public readyFile(src: CompliperFile): undefined | CompliperFile | CompliperFile[] {
        const ext = src.extname;
        const dist = this.outputFile(src);
        if (ext === '.ts') {
            return CompliperFile.from(src, dist.replace(ext, '.js'), 'ts');
        }
        if (['.scss', '.sass'].indexOf(ext) >= 0) {
            if (src.basename.startsWith('_')) {
                this.style.render(src);
                return undefined;
            }
            return CompliperFile.from(src, dist.replace(ext, '.css'), ext.substring(1));
        }
        if (ext === '.html') {
            const file = CompliperFile.from(src, dist, 'html');
            if (!this.tokenizer.render(file).canRender) {
                return undefined;
            }
            return file;
        }
        return CompliperFile.from(src, dist, ext.substring(1));
    }

    public compileFile(src: CompliperFile) {
        this.compileAFile(src);
    }

    /**
     * compileFile
     * @param mtime 更新时间
     */
    public compileAFile(src: CompliperFile) {
        const compile = (file: CompliperFile) => {
            this.mkIfNotFolder(path.dirname(file.dist));
            if (file.type === 'ts') {
                let content = Compiler.ts(this.fileContent(file), file.src);
                if (content && content.length > 0 && this.compliperMin) {
                    content = UglifyJS.minify(content).code;
                }
                fs.writeFileSync(file.dist, content);
                return;
            }
            if (file.type === 'scss' || file.type === 'sass') {
                let content = this.style.render(file);
                content = Compiler.sass(content, file.src, file.type, {
                    importer: (url, _, next) => {
                        next({
                            contents: this.style.render(new CompliperFile(url, 0)),
                        });
                    }
                });
                if (content && content.length > 0 && this.compliperMin) {
                    content = new CleanCSS().minify(content).styles;
                }
                fs.writeFileSync(file.dist, content);
                return;
            }
            if (file.type === 'html') {
                fs.writeFileSync(file.dist, this.renderFile(file));
                return;
            }
            if (typeof file.content !== 'undefined') {
                fs.writeFileSync(file.dist, file.content);
                return;
            }
            fs.copyFileSync(file.src, file.dist);
        };
        eachCompileFile(this.readyFile(src), file => {
            if (src.mtime && src.mtime > 0 && file.distMtime >= src.mtime) {
                // 判断时间是否更新
                return;
            }
            compile(file);
            this.logFile(file);
        });
        this.link.trigger(src.src, src.mtime);
    }

    public fileContent(file: CompliperFile): string {
        if (this.cache.has(file.src, file.mtime)) {
            file.content = this.cache.get(file.src);
            return file.content!;
        }
        this.cache.set(file.src, fileContent(file), file.mtime);
        return file.content!;
    }

    public unlink(src: string|CompliperFile) {
        const dist = this.outputFile(src);
        if (fs.existsSync(dist)) {
            fs.unlinkSync(dist);
        }
        const file = src instanceof CompliperFile ? src.src : src;
        this.link.remove(file);
        this.cache.delete(file);
    }

    public ready() {
        eachFile(this.inputFolder, file => {
            const ext = file.extname.substr(1);
            if (ext === 'html') {
                this.style.extractTheme(this.template.extractStyle(this.fileContent(file)))
                return;
            }
            if (['sass', 'scss', 'less', 'css'].indexOf(ext) < 0) {
                return;
            }
            this.style.extractTheme(this.fileContent(file));
        });
    }
}
