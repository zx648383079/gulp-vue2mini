"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateProject = void 0;
const fs = require("fs");
const path = require("path");
const compiler_1 = require("../../compiler");
const UglifyJS = require("uglify-js");
const CleanCSS = require("clean-css");
const tokenizer_1 = require("./tokenizer");
const style_1 = require("./style");
const template_1 = require("./template");
const script_1 = require("./script");
const util_1 = require("../../util");
class TemplateProject extends compiler_1.BaseProjectCompiler {
    constructor(inputFolder, outputFolder, options) {
        super(inputFolder, outputFolder, options);
        this.link.on((file, mtime) => {
            if (!this.isBooted) {
                return;
            }
            this.compileAFile(new compiler_1.CompilerFile(file, mtime));
        });
        this.ready();
    }
    link = new util_1.LinkManager();
    script = new script_1.ScriptParser(this);
    template = new template_1.TemplateParser(this);
    style = new style_1.StyleParser(this);
    tokenizer = new tokenizer_1.ThemeTokenizer(this);
    cache = new util_1.CacheManger();
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
            return compiler_1.CompilerFile.from(src, dist.replace(ext, '.js'), 'ts');
        }
        if (['.scss', '.sass'].indexOf(ext) >= 0) {
            if (src.basename.startsWith('_')) {
                this.style.render(src);
                return undefined;
            }
            return compiler_1.CompilerFile.from(src, dist.replace(ext, '.css'), ext.substring(1));
        }
        if (ext === '.html') {
            const file = compiler_1.CompilerFile.from(src, dist, 'html');
            if (!this.tokenizer.render(file).canRender) {
                return undefined;
            }
            return file;
        }
        return compiler_1.CompilerFile.from(src, dist, ext.substring(1));
    }
    compileFile(src) {
        this.compileAFile(src);
    }
    compileAFile(src) {
        const compile = (file) => {
            this.mkIfNotFolder(path.dirname(file.dist));
            if (file.type === 'ts') {
                let content = compiler_1.PluginCompiler.ts(this.fileContent(file), file.src);
                if (content && content.length > 0 && this.compilerMin) {
                    content = UglifyJS.minify(content).code;
                }
                fs.writeFileSync(file.dist, content);
                return;
            }
            if (file.type === 'scss' || file.type === 'sass') {
                let content = this.style.render(file);
                content = compiler_1.PluginCompiler.sass(content, file.src, file.type, {
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
        (0, compiler_1.eachCompileFile)(this.readyFile(src), file => {
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
        this.cache.set(file.src, (0, compiler_1.fileContent)(file), file.mtime);
        return file.content;
    }
    unlink(src) {
        const dist = this.outputFile(src);
        if (fs.existsSync(dist)) {
            fs.unlinkSync(dist);
        }
        const file = src instanceof compiler_1.CompilerFile ? src.src : src;
        this.link.remove(file);
        this.cache.delete(file);
    }
    ready() {
        (0, util_1.eachFile)(this.inputFolder, file => {
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
exports.TemplateProject = TemplateProject;
