"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateProject = void 0;
var fs = require("fs");
var path = require("path");
var compiler_1 = require("../../compiler");
var UglifyJS = require("uglify-js");
var CleanCSS = require("clean-css");
var tokenizer_1 = require("./tokenizer");
var link_1 = require("../link");
var style_1 = require("./style");
var template_1 = require("./template");
var script_1 = require("./script");
var TemplateProject = (function () {
    function TemplateProject(inputFolder, outputFolder, options) {
        this.inputFolder = inputFolder;
        this.outputFolder = outputFolder;
        this.options = options;
        this.link = new link_1.LinkManager();
        this.script = new script_1.ScriptParser(this);
        this.template = new template_1.TemplateParser(this);
        this.style = new style_1.StyleParser(this);
        this.tokenizer = new tokenizer_1.TemplateTokenizer(this);
        this.link.on(this.compileAFile.bind(this));
    }
    Object.defineProperty(TemplateProject.prototype, "compliperMin", {
        get: function () {
            return this.options && this.options.min;
        },
        enumerable: false,
        configurable: true
    });
    TemplateProject.prototype.renderFile = function (file) {
        var res = this.template.render(file);
        return res.template;
    };
    TemplateProject.prototype.readyFile = function (src) {
        var ext = path.extname(src);
        var dist = this.outputFile(src);
        if (ext === '.ts') {
            return {
                src: src,
                dist: dist.replace(ext, '.js'),
                type: 'ts'
            };
        }
        if (['.scss', '.sass'].indexOf(ext) >= 0) {
            if (path.basename(src).indexOf('_') === 0) {
                return undefined;
            }
            return {
                type: ext.substring(1),
                src: src,
                dist: dist.replace(ext, '.css'),
            };
        }
        if (ext === '.html') {
            var file = {
                type: 'html',
                src: src,
                dist: dist,
            };
            if (!this.tokenizer.render(file).canRender) {
                return undefined;
            }
            return file;
        }
        return {
            type: ext.substring(1),
            src: src,
            dist: dist,
        };
    };
    TemplateProject.prototype.compileFile = function (src) {
        this.compileAFile(src);
    };
    TemplateProject.prototype.compileAFile = function (src, mtime) {
        var _this = this;
        var compile = function (file) {
            _this.mkIfNotFolder(path.dirname(file.dist));
            if (file.type === 'ts') {
                var content = compiler_1.Compiler.ts(compiler_1.fileContent(file), src);
                if (content && content.length > 0 && _this.compliperMin) {
                    content = UglifyJS.minify(content).code;
                }
                fs.writeFileSync(file.dist, content);
                return;
            }
            if (file.type === 'scss' || file.type === 'sass') {
                var content = _this.style.render(compiler_1.fileContent(file), src, file.type);
                content = compiler_1.Compiler.sass(content, src, file.type);
                if (content && content.length > 0 && _this.compliperMin) {
                    content = new CleanCSS().minify(content).styles;
                }
                fs.writeFileSync(file.dist, content);
                return;
            }
            if (file.type === 'html') {
                fs.writeFileSync(file.dist, _this.renderFile(file));
                return;
            }
            if (typeof file.content !== 'undefined') {
                fs.writeFileSync(file.dist, file.content);
                return;
            }
            fs.copyFileSync(file.src, file.dist);
        };
        compiler_1.eachCompileFile(this.readyFile(src), function (file) {
            if (mtime && mtime > 0 && fs.existsSync(file.dist) && fs.statSync(file.dist).mtimeMs >= mtime) {
                return;
            }
            compile(file);
            _this.logFile(file.src);
        });
        this.link.trigger(src, mtime || fs.statSync(src).mtimeMs);
    };
    TemplateProject.prototype.mkIfNotFolder = function (folder) {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
    };
    TemplateProject.prototype.outputFile = function (file) {
        return path.resolve(this.outputFolder, path.relative(this.inputFolder, file));
    };
    TemplateProject.prototype.unlink = function (src) {
        var dist = this.outputFile(src);
        if (fs.existsSync(dist)) {
            fs.unlinkSync(dist);
        }
    };
    TemplateProject.prototype.logFile = function (file, tip) {
        if (tip === void 0) { tip = 'Finished'; }
        compiler_1.consoleLog(file, tip, this.inputFolder);
    };
    return TemplateProject;
}());
exports.TemplateProject = TemplateProject;
