"use strict";
exports.__esModule = true;
exports.MiniCompliper = exports.Compiler = void 0;
var path = require("path");
var ts = require("typescript");
var sass = require("sass");
var fs = require("fs");
var css_1 = require("./parser/css");
var vue_1 = require("./parser/vue");
var Compiler = (function () {
    function Compiler() {
    }
    Compiler.ts = function (input, file, tsConfigFileName) {
        if (tsConfigFileName === void 0) { tsConfigFileName = 'tsconfig.json'; }
        var projectDirectory = process.cwd();
        var compilerOptions;
        tsConfigFileName = path.resolve(process.cwd(), tsConfigFileName);
        projectDirectory = path.dirname(tsConfigFileName);
        var tsConfig = ts.readConfigFile(tsConfigFileName, ts.sys.readFile);
        var parsed = ts.parseJsonConfigFileContent(tsConfig.config || {}, {
            useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
            readDirectory: function () { return []; },
            fileExists: ts.sys.fileExists,
            readFile: ts.sys.readFile
        }, path.resolve(projectDirectory), undefined, tsConfigFileName);
        compilerOptions = parsed.options;
        var output = ts.transpileModule(input, {
            compilerOptions: compilerOptions,
            fileName: file,
            reportDiagnostics: true,
            transformers: undefined
        });
        return output.outputText.replace(/\/\/#\ssourceMappingURL[\s\S]+$/, '');
    };
    Compiler.sass = function (input, file, lang) {
        if (lang === void 0) { lang = 'scss'; }
        var output = sass.renderSync({
            data: input,
            file: file,
            indentedSyntax: lang === 'sass'
        });
        return output.css.toString();
    };
    return Compiler;
}());
exports.Compiler = Compiler;
var MiniCompliper = (function () {
    function MiniCompliper(inputFolder, outputFolder, options) {
        this.inputFolder = inputFolder;
        this.outputFolder = outputFolder;
        this.options = options;
    }
    MiniCompliper.prototype.compileFile = function (src) {
        var ext = path.extname(src);
        var dist = this.outputFile(src);
        var distFolder = path.dirname(dist);
        var content = '';
        if (ext === '.ts') {
            content = Compiler.ts(fs.readFileSync(src).toString(), src);
            dist = dist.replace(ext, '.js');
        }
        else if (ext === '.scss' || ext === '.sass') {
            var name_1 = path.basename(src);
            if (name_1.indexOf('_') === 0) {
                return;
            }
            content = Compiler.sass(css_1.preImport(fs.readFileSync(src).toString()), src, ext.substr(1));
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
                        fs.writeFileSync(dist.replace(ext, '.js'), Compiler.ts(item.content, src));
                        continue;
                    }
                    if (item.type === 'scss' || item.type === 'sass') {
                        content = Compiler.sass(css_1.preImport(item.content), src, item.type);
                        content = css_1.endImport(content);
                        content = css_1.replaceTTF(content, path.dirname(src));
                        fs.writeFileSync(dist.replace(ext, '.wxss'), content);
                        continue;
                    }
                }
            }
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
            return;
        }
        if (content.length < 1) {
            return;
        }
        this.mkIfNotFolder(distFolder);
        fs.writeFileSync(dist, content);
        this.logFile(src);
    };
    MiniCompliper.prototype.mkIfNotFolder = function (folder) {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
    };
    MiniCompliper.prototype.outputFile = function (file) {
        return path.resolve(this.outputFolder, path.relative(this.inputFolder, file));
    };
    MiniCompliper.prototype.logFile = function (file, tip) {
        if (tip === void 0) { tip = 'Finished'; }
        var now = new Date();
        console.log('[' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + ']', path.relative(this.inputFolder, file), tip);
    };
    return MiniCompliper;
}());
exports.MiniCompliper = MiniCompliper;
