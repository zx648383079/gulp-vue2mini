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
    MiniProject.prototype.compileFile = function (src) {
        var ext = path.extname(src);
        var dist = this.outputFile(src);
        var distFolder = path.dirname(dist);
        var content = '';
        if (ext === '.ts') {
            content = compiler_1.Compiler.ts(fs.readFileSync(src).toString(), src);
            dist = dist.replace(ext, '.js');
        }
        else if (ext === '.scss' || ext === '.sass') {
            var name_1 = path.basename(src);
            if (name_1.indexOf('_') === 0) {
                return;
            }
            content = compiler_1.Compiler.sass(css_1.preImport(fs.readFileSync(src).toString()), src, ext.substr(1));
            content = css_1.endImport(content);
            content = css_1.replaceTTF(content, path.dirname(src));
            dist = dist.replace(ext, '.wxss');
        }
        else if (ext === '.html' || ext === '.vue') {
            var data = {};
            var jsonPath = src.replace(ext, '.json');
            if (fs.existsSync(jsonPath)) {
                var json = fs.readFileSync(jsonPath).toString();
                data = json.trim().length > 0 ? JSON.parse(json) : {};
            }
            var res = vue_1.splitFile(fs.readFileSync(src).toString(), ext.substr(1).toLowerCase(), data);
            this.mkIfNotFolder(distFolder);
            for (var key in res) {
                if (res.hasOwnProperty(key)) {
                    var item = res[key];
                    if (item.type === 'json') {
                        fs.writeFileSync(dist.replace(ext, '.json'), item.content);
                        continue;
                    }
                    if (item.type === 'wxml') {
                        fs.writeFileSync(dist.replace(ext, '.wxml'), item.content);
                        continue;
                    }
                    if (item.type === 'css') {
                        fs.writeFileSync(dist.replace(ext, '.wxss'), item.content);
                        continue;
                    }
                    if (item.type === 'js') {
                        fs.writeFileSync(dist.replace(ext, '.js'), item.content);
                        continue;
                    }
                    if (item.type === 'ts') {
                        fs.writeFileSync(dist.replace(ext, '.js'), compiler_1.Compiler.ts(item.content, src));
                        continue;
                    }
                    if (item.type === 'scss' || item.type === 'sass') {
                        content = compiler_1.Compiler.sass(css_1.preImport(item.content), src, item.type);
                        content = css_1.endImport(content);
                        content = css_1.replaceTTF(content, path.dirname(src));
                        fs.writeFileSync(dist.replace(ext, '.wxss'), content);
                        continue;
                    }
                }
            }
            this.logFile(src);
            return;
        }
        else if (['.ttf', '.json'].indexOf(ext) >= 0) {
            return;
        }
        else {
            if (ext === '.css') {
                dist = dist.replace(ext, '.wxss');
            }
            this.mkIfNotFolder(distFolder);
            fs.copyFileSync(src, dist);
            this.logFile(src);
            return;
        }
        if (content.length < 1) {
            return;
        }
        this.mkIfNotFolder(distFolder);
        fs.writeFileSync(dist, content);
        this.logFile(src);
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
