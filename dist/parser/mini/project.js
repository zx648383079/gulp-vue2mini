"use strict";
exports.__esModule = true;
exports.MiniProject = void 0;
var path = require("path");
var fs = require("fs");
var css_1 = require("./css");
var vue_1 = require("./vue");
var compiler_1 = require("../../compiler");
var MiniProject = (function () {
    function MiniProject(inputFolder, outputFolder, options) {
        this.inputFolder = inputFolder;
        this.outputFolder = outputFolder;
        this.options = options;
    }
    MiniProject.prototype.readyFile = function (src) {
        var ext = path.extname(src);
        var dist = this.outputFile(src);
        if (ext === '.ts') {
            return {
                type: 'ts',
                src: src,
                dist: dist.replace(ext, '.js')
            };
        }
        if (ext === '.scss' || ext === '.sass') {
            if (path.basename(src).indexOf('_') === 0) {
                return undefined;
            }
            return {
                type: ext.substring(1),
                src: src,
                dist: dist.replace(ext, '.wxss')
            };
        }
        if (['.ttf', '.json'].indexOf(ext) >= 0) {
            return undefined;
        }
        if (ext === '.css') {
            return {
                type: 'css',
                src: src,
                dist: dist.replace(ext, '.wxss')
            };
        }
        if (ext === '.html' || ext === '.vue') {
            return this.readyVueFile(src, ext, dist);
        }
        return {
            type: ext.substring(1),
            src: src,
            dist: dist
        };
    };
    MiniProject.prototype.readyVueFile = function (src, ext, dist) {
        var data = {};
        var jsonPath = src.replace(ext, '.json');
        if (fs.existsSync(jsonPath)) {
            var json = fs.readFileSync(jsonPath).toString();
            data = json.trim().length > 0 ? JSON.parse(json) : {};
        }
        var res = vue_1.splitFile(fs.readFileSync(src).toString(), ext.substr(1).toLowerCase(), data);
        var files = [];
        for (var key in res) {
            if (res.hasOwnProperty(key)) {
                var item = res[key];
                if (item.type === 'json') {
                    files.push({
                        src: src,
                        content: item.content,
                        dist: dist.replace(ext, '.json'),
                        type: item.type
                    });
                    continue;
                }
                if (item.type === 'wxml') {
                    files.push({
                        src: src,
                        content: item.content,
                        dist: dist.replace(ext, '.wxml'),
                        type: item.type
                    });
                    continue;
                }
                if (item.type === 'css') {
                    files.push({
                        src: src,
                        content: item.content,
                        dist: dist.replace(ext, '.wxss'),
                        type: item.type
                    });
                    continue;
                }
                if (item.type === 'js') {
                    files.push({
                        src: src,
                        content: item.content,
                        dist: dist.replace(ext, '.js'),
                        type: item.type
                    });
                    continue;
                }
                if (item.type === 'ts') {
                    files.push({
                        src: src,
                        content: item.content,
                        dist: dist.replace(ext, '.js'),
                        type: item.type
                    });
                    continue;
                }
                if (item.type === 'scss' || item.type === 'sass') {
                    files.push({
                        src: src,
                        content: item.content,
                        dist: dist.replace(ext, '.wxss'),
                        type: item.type
                    });
                    continue;
                }
            }
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
