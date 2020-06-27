"use strict";
exports.__esModule = true;
var path = require("path");
var ts = require("typescript");
var sass = require("node-sass");
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
