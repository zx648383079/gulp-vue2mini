"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiniProject = void 0;
var path = require("path");
var fs = require("fs");
var css_1 = require("./css");
var vue_1 = require("./vue");
var compiler_1 = require("../../compiler");
var ts_1 = require("./ts");
var link_1 = require("../link");
var wxml_1 = require("./wxml");
var json_1 = require("./json");
var MiniProject = (function () {
    function MiniProject(inputFolder, outputFolder, options) {
        this.inputFolder = inputFolder;
        this.outputFolder = outputFolder;
        this.options = options;
        this.link = new link_1.LinkManager();
        this.script = new ts_1.ScriptParser(this);
        this.template = new wxml_1.TemplateParser(this);
        this.style = new css_1.StyleParser(this);
        this.json = new json_1.JsonParser(this);
        this.mix = new vue_1.VueParser(this);
    }
    MiniProject.prototype.readyFile = function (src) {
        var ext = path.extname(src);
        var dist = this.outputFile(src);
        if (ext === '.ts') {
            return {
                type: 'ts',
                src: src,
                dist: dist.replace(ext, '.js'),
            };
        }
        if (ext === '.scss' || ext === '.sass') {
            if (path.basename(src).indexOf('_') === 0) {
                return undefined;
            }
            return {
                type: ext.substring(1),
                src: src,
                dist: dist.replace(ext, '.wxss'),
            };
        }
        if (ext === '.less') {
            return {
                type: 'less',
                src: src,
                dist: dist.replace(ext, '.wxss'),
            };
        }
        if (['.ttf', '.json'].indexOf(ext) >= 0) {
            return undefined;
        }
        if (ext === '.css') {
            return {
                type: 'css',
                src: src,
                dist: dist.replace(ext, '.wxss'),
            };
        }
        if (ext === '.html' || ext === '.vue') {
            return this.readyMixFile(src, ext, dist);
        }
        return {
            type: ext.substring(1),
            src: src,
            dist: dist,
        };
    };
    MiniProject.prototype.readyMixFile = function (src, content, ext, dist) {
        var _a, _b;
        if (ext === void 0) {
            _a = [fs.readFileSync(src).toString(), path.extname(src), content], content = _a[0], ext = _a[1], dist = _a[2];
        }
        else if (dist === void 0) {
            _b = [fs.readFileSync(src).toString(), content, ext], content = _b[0], ext = _b[1], dist = _b[2];
        }
        var data = {};
        var jsonPath = src.replace(ext, '.json');
        if (jsonPath.endsWith('.json') && fs.existsSync(jsonPath)) {
            var json = fs.readFileSync(jsonPath).toString();
            data = json.trim().length > 0 ? JSON.parse(json) : {};
        }
        var res = this.mix.render(content, ext.substr(1).toLowerCase(), src);
        var files = [];
        files.push({
            src: src,
            content: this.json.render(res.json, data),
            dist: dist.replace(ext, '.json'),
            type: 'json',
        });
        if (res.template) {
            files.push({
                src: src,
                content: res.template,
                dist: dist.replace(ext, '.wxml'),
                type: 'wxml'
            });
            ;
        }
        if (res.script) {
            files.push({
                src: src,
                content: res.script.content,
                dist: dist.replace(ext, '.js'),
                type: res.script.type
            });
        }
        if (res.style) {
            files.push({
                src: src,
                content: res.style.content,
                dist: dist.replace(ext, '.wxss'),
                type: res.style.type
            });
        }
        return files;
    };
    MiniProject.prototype.compileFile = function (src) {
        var _this = this;
        var compile = function (file) {
            _this.mkIfNotFolder(path.dirname(file.dist));
            if (file.type === 'ts') {
                fs.writeFileSync(file.dist, compiler_1.Compiler.ts(compiler_1.fileContent(file), src));
                return;
            }
            if (file.type === 'less') {
                compiler_1.Compiler.less(compiler_1.fileContent(file), src).then(function (content) {
                    fs.writeFileSync(file.dist, content);
                });
                return;
            }
            if (file.type === 'sass' || file.type === 'scss') {
                var content = compiler_1.Compiler.sass(css_1.preImport(compiler_1.fileContent(file)), src, file.type);
                content = css_1.endImport(content);
                fs.writeFileSync(file.dist, css_1.replaceTTF(content, path.dirname(src)));
                return;
            }
            if (typeof file.content !== 'undefined') {
                fs.writeFileSync(file.dist, file.content);
                return;
            }
            fs.copyFileSync(src, file.dist);
        };
        compiler_1.eachCompileFile(this.readyFile(src), function (file) {
            compile(file);
            _this.logFile(file.src);
        });
    };
    MiniProject.prototype.mkIfNotFolder = function (folder) {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
    };
    MiniProject.prototype.outputFile = function (file) {
        return path.resolve(this.outputFolder, path.relative(this.inputFolder, file));
    };
    MiniProject.prototype.unlink = function (src) {
        var dist = this.outputFile(src);
        if (fs.existsSync(dist)) {
            fs.unlinkSync(dist);
        }
    };
    MiniProject.prototype.logFile = function (file, tip) {
        if (tip === void 0) { tip = 'Finished'; }
        compiler_1.consoleLog(file, tip, this.inputFolder);
    };
    return MiniProject;
}());
exports.MiniProject = MiniProject;
