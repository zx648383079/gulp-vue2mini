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
var MiniProject = (function (_super) {
    __extends(MiniProject, _super);
    function MiniProject() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.link = new link_1.LinkManager();
        _this.script = new ts_1.ScriptParser(_this);
        _this.template = new wxml_1.TemplateParser(_this);
        _this.style = new css_1.StyleParser(_this);
        _this.json = new json_1.JsonParser(_this);
        _this.mix = new vue_1.VueParser(_this);
        return _this;
    }
    MiniProject.prototype.readyFile = function (src) {
        var ext = src.extname;
        var dist = this.outputFile(src);
        if (ext === '.ts') {
            return compiler_1.CompliperFile.from(src, dist.replace(ext, '.js'), 'ts');
        }
        if (ext === '.scss' || ext === '.sass') {
            if (src.basename.startsWith('_')) {
                return undefined;
            }
            return compiler_1.CompliperFile.from(src, dist.replace(ext, '.wxss'), ext.substring(1));
        }
        if (ext === '.less') {
            return compiler_1.CompliperFile.from(src, dist.replace(ext, '.wxss'), ext.substring(1));
        }
        if (['.ttf', '.json'].indexOf(ext) >= 0) {
            return undefined;
        }
        if (ext === '.css') {
            return compiler_1.CompliperFile.from(src, dist.replace(ext, '.wxss'), ext.substring(1));
        }
        if (ext === '.html' || ext === '.vue') {
            return this.readyMixFile(src, ext, dist);
        }
        return compiler_1.CompliperFile.from(src, dist, ext.substring(1));
    };
    MiniProject.prototype.readyMixFile = function (src, content, ext, dist) {
        var _a, _b, _c;
        if (content === void 0) {
            _a = [compiler_1.fileContent(src), src.extname, src.dist], content = _a[0], ext = _a[1], dist = _a[2];
        }
        if (ext === void 0) {
            _b = [compiler_1.fileContent(src), src.extname, content], content = _b[0], ext = _b[1], dist = _b[2];
        }
        else if (dist === void 0) {
            _c = [compiler_1.fileContent(src), content, ext], content = _c[0], ext = _c[1], dist = _c[2];
        }
        var data = {};
        var jsonPath = src.src.replace(ext, '.json');
        if (jsonPath.endsWith('.json') && fs.existsSync(jsonPath)) {
            var json = fs.readFileSync(jsonPath).toString();
            data = json.trim().length > 0 ? JSON.parse(json) : {};
        }
        var res = this.mix.render(content, ext.substr(1).toLowerCase(), src.src);
        var files = [];
        files.push(compiler_1.CompliperFile.from(src, dist.replace(ext, '.json'), 'json', this.json.render(res.json, data)));
        if (res.template) {
            files.push(compiler_1.CompliperFile.from(src, dist.replace(ext, '.wxml'), 'wxml', res.template));
        }
        if (res.script) {
            files.push(compiler_1.CompliperFile.from(src, dist.replace(ext, '.js'), res.script.type, res.script.content));
        }
        if (res.style) {
            files.push(compiler_1.CompliperFile.from(src, dist.replace(ext, '.wxss'), res.style.type, res.style.content));
        }
        return files;
    };
    MiniProject.prototype.compileFile = function (src) {
        var _this = this;
        var compile = function (file) {
            _this.mkIfNotFolder(path.dirname(file.dist));
            if (file.type === 'ts') {
                fs.writeFileSync(file.dist, compiler_1.Compiler.ts(compiler_1.fileContent(file), src.src));
                return;
            }
            if (file.type === 'less') {
                compiler_1.Compiler.less(compiler_1.fileContent(file), src.src).then(function (content) {
                    fs.writeFileSync(file.dist, content);
                });
                return;
            }
            if (file.type === 'sass' || file.type === 'scss') {
                var content = compiler_1.Compiler.sass(css_1.preImport(compiler_1.fileContent(file)), src.src, file.type);
                content = css_1.endImport(content);
                fs.writeFileSync(file.dist, css_1.replaceTTF(content, src.dirname));
                return;
            }
            if (typeof file.content !== 'undefined') {
                fs.writeFileSync(file.dist, file.content);
                return;
            }
            fs.copyFileSync(src.src, file.dist);
        };
        compiler_1.eachCompileFile(this.readyFile(src), function (file) {
            compile(file);
            _this.logFile(file.src);
        });
    };
    return MiniProject;
}(compiler_1.BaseCompliper));
exports.MiniProject = MiniProject;
