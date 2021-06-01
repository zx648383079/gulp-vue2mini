"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var cache_1 = require("../cache");
var util_1 = require("../util");
var TemplateProject = (function (_super) {
    __extends(TemplateProject, _super);
    function TemplateProject(inputFolder, outputFolder, options) {
        var _this = _super.call(this, inputFolder, outputFolder, options) || this;
        _this.link = new link_1.LinkManager();
        _this.script = new script_1.ScriptParser(_this);
        _this.template = new template_1.TemplateParser(_this);
        _this.style = new style_1.StyleParser(_this);
        _this.tokenizer = new tokenizer_1.TemplateTokenizer(_this);
        _this.cache = new cache_1.CacheManger();
        _this.link.on(function (file, mtime) {
            _this.compileAFile(new compiler_1.CompliperFile(file, mtime));
        });
        _this.ready();
        return _this;
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
        var ext = src.extname;
        var dist = this.outputFile(src);
        if (ext === '.ts') {
            return compiler_1.CompliperFile.from(src, dist.replace(ext, '.js'), 'ts');
        }
        if (['.scss', '.sass'].indexOf(ext) >= 0) {
            if (src.basename.startsWith('_')) {
                this.style.render(src);
                return undefined;
            }
            return compiler_1.CompliperFile.from(src, dist.replace(ext, '.css'), ext.substring(1));
        }
        if (ext === '.html') {
            var file = compiler_1.CompliperFile.from(src, dist, 'html');
            if (!this.tokenizer.render(file).canRender) {
                return undefined;
            }
            return file;
        }
        return compiler_1.CompliperFile.from(src, dist, ext.substring(1));
    };
    TemplateProject.prototype.compileFile = function (src) {
        this.compileAFile(src);
    };
    TemplateProject.prototype.compileAFile = function (src) {
        var _this = this;
        var compile = function (file) {
            _this.mkIfNotFolder(path.dirname(file.dist));
            if (file.type === 'ts') {
                var content = compiler_1.Compiler.ts(_this.fileContent(file), src.src);
                if (content && content.length > 0 && _this.compliperMin) {
                    content = UglifyJS.minify(content).code;
                }
                fs.writeFileSync(file.dist, content);
                return;
            }
            if (file.type === 'scss' || file.type === 'sass') {
                var content = _this.style.render(file);
                content = compiler_1.Compiler.sass(content, src.src, file.type, {
                    importer: function (url, _, next) {
                        next({
                            contents: _this.style.render(new compiler_1.CompliperFile(url, 0)),
                        });
                    }
                });
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
            if (src.mtime && src.mtime > 0 && file.distMtime >= src.mtime) {
                return;
            }
            compile(file);
            _this.logFile(file);
        });
        this.link.trigger(src.src, src.mtime);
    };
    TemplateProject.prototype.fileContent = function (file) {
        if (this.cache.has(file.src, file.mtime)) {
            file.content = this.cache.get(file.src);
            return file.content;
        }
        this.cache.set(file.src, compiler_1.fileContent(file), file.mtime);
        return file.content;
    };
    TemplateProject.prototype.unlink = function (src) {
        var dist = this.outputFile(src);
        if (fs.existsSync(dist)) {
            fs.unlinkSync(dist);
        }
        var file = src instanceof compiler_1.CompliperFile ? src.src : src;
        this.link.remove(file);
        this.cache.delete(file);
    };
    TemplateProject.prototype.ready = function () {
        var _this = this;
        util_1.eachFile(this.inputFolder, function (file) {
            var ext = file.extname.substr(1);
            if (ext === 'html') {
                _this.style.extractTheme(_this.template.extractStyle(_this.fileContent(file)));
                return;
            }
            if (['sass', 'scss', 'less', 'css'].indexOf(ext) < 0) {
                return;
            }
            _this.style.extractTheme(_this.fileContent(file));
        });
    };
    return TemplateProject;
}(compiler_1.BaseCompliper));
exports.TemplateProject = TemplateProject;
