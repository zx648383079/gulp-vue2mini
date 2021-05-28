"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileContent = exports.eachCompileFile = exports.consoleLog = exports.Compiler = void 0;
var path = require("path");
var ts = require("typescript");
var sass = require("sass");
var fs = require("fs");
var Compiler = (function () {
    function Compiler() {
    }
    Compiler.ts = function (input, file, tsConfigFileName, sourceMap) {
        if (tsConfigFileName === void 0) { tsConfigFileName = 'tsconfig.json'; }
        if (sourceMap === void 0) { sourceMap = false; }
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
            transformers: undefined,
        });
        if (sourceMap) {
            return output.outputText;
        }
        return output.outputText.replace(/\/\/#\ssourceMappingURL[\s\S]+$/, '');
    };
    Compiler.sass = function (input, file, lang, options) {
        if (lang === void 0) { lang = 'scss'; }
        if (options === void 0) { options = {}; }
        var output = sass.renderSync(Object.assign({}, options, {
            data: input,
            file: file,
            indentedSyntax: lang === 'sass'
        }));
        return output.css.toString();
    };
    return Compiler;
}());
exports.Compiler = Compiler;
var consoleLog = function (file, tip, rootFolder) {
    if (tip === void 0) { tip = 'Finished'; }
    var now = new Date();
    console.log('[' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + ']', rootFolder ? path.relative(rootFolder, file) : file, tip);
};
exports.consoleLog = consoleLog;
var eachCompileFile = function (files, callback) {
    if (!files) {
        return;
    }
    if (files instanceof Array) {
        files.forEach(callback);
        return;
    }
    callback(files);
};
exports.eachCompileFile = eachCompileFile;
var fileContent = function (file) {
    if (typeof file.content !== 'undefined') {
        return file.content;
    }
    file.content = fs.readFileSync(file.src).toString();
    return file.content;
};
exports.fileContent = fileContent;
