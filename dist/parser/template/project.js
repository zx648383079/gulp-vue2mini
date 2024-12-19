import * as fs from 'fs';
import * as path from 'path';
import { BaseProjectCompiler, CompilerFile, eachCompileFile, fileContent, PluginCompiler } from '../../compiler';
import * as UglifyJS from 'uglify-js';
import CleanCSS from 'clean-css';
import { ThemeTokenizer } from './tokenizer';
import { StyleParser } from './style';
import { TemplateParser } from './template';
import { ScriptParser } from './script';
import { CacheManger, eachFile, LinkManager } from '../../util';
export class TemplateProject extends BaseProjectCompiler {
    constructor(inputFolder, outputFolder, options) {
        super(inputFolder, outputFolder, options);
        this.link.on((file, mtime) => {
            if (!this.isBooted) {
                return;
            }
            this.compileAFile(new CompilerFile(file, mtime));
        });
        this.ready();
    }
    link = new LinkManager();
    script = new ScriptParser(this);
    template = new TemplateParser(this);
    style = new StyleParser(this);
    tokenizer = new ThemeTokenizer(this);
    cache = new CacheManger();
    get compilerMin() {
        return this.options && this.options.min;
    }
    renderFile(file) {
        const res = this.template.render(file);
        return res.template;
    }
    readyFile(src) {
        const ext = src.extname;
        const dist = this.outputFile(src);
        if (ext === '.ts') {
            return CompilerFile.from(src, dist.replace(ext, '.js'), 'ts');
        }
        if (['.scss', '.sass'].indexOf(ext) >= 0) {
            if (src.basename.startsWith('_')) {
                this.style.render(src);
                return undefined;
            }
            return CompilerFile.from(src, dist.replace(ext, '.css'), ext.substring(1));
        }
        if (ext === '.html') {
            const file = CompilerFile.from(src, dist, 'html');
            if (!this.tokenizer.render(file).canRender) {
                return undefined;
            }
            return file;
        }
        return CompilerFile.from(src, dist, ext.substring(1));
    }
    compileFile(src) {
        this.compileAFile(src);
    }
    compileAFile(src) {
        const compile = (file) => {
            this.mkIfNotFolder(path.dirname(file.dist));
            if (file.type === 'ts') {
                let content = PluginCompiler.ts(this.fileContent(file), file.src);
                if (content && content.length > 0 && this.compilerMin) {
                    content = UglifyJS.minify(content).code;
                }
                fs.writeFileSync(file.dist, content);
                return;
            }
            if (file.type === 'scss' || file.type === 'sass') {
                let content = this.style.render(file);
                content = PluginCompiler.sass(content, file.src, file.type, {
                    importer: this.style.importer,
                });
                if (content && content.length > 0 && this.compilerMin) {
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
                return;
            }
            compile(file);
            this.logFile(file);
        });
        this.link.trigger(src.src, src.mtime);
    }
    fileContent(file) {
        if (this.cache.has(file.src, file.mtime)) {
            file.content = this.cache.get(file.src);
            return file.content;
        }
        this.cache.set(file.src, fileContent(file), file.mtime);
        return file.content;
    }
    unlink(src) {
        const dist = this.outputFile(src);
        if (fs.existsSync(dist)) {
            fs.unlinkSync(dist);
        }
        const file = src instanceof CompilerFile ? src.src : src;
        this.link.remove(file);
        this.cache.delete(file);
    }
    ready() {
        eachFile(this.inputFolder, file => {
            const ext = file.extname.substring(1);
            if (ext === 'html') {
                this.style.extractTheme(this.template.extractStyle(this.fileContent(file)));
                return;
            }
            if (['sass', 'scss', 'less', 'css'].indexOf(ext) < 0 || file.src.endsWith('.min.css')) {
                return;
            }
            this.style.extractTheme(this.fileContent(file));
        });
    }
}
