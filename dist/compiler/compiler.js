"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileContent = exports.eachCompileFile = exports.consoleLog = exports.PluginCompiler = exports.BaseProjectCompiler = exports.CompilerFile = void 0;
var path = require("path");
var ts = require("typescript");
var sass = require("sass");
var fs = require("fs");
var CompilerFile = (function () {
    function CompilerFile(src, mtime, dist, type, content) {
        if (mtime === void 0) { mtime = 0; }
        if (dist === void 0) { dist = ''; }
        this.src = src;
        this.mtime = mtime;
        this.dist = dist;
        this.type = type;
        this.content = content;
    }
    Object.defineProperty(CompilerFile.prototype, "extname", {
        get: function () {
            return path.extname(this.src);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CompilerFile.prototype, "dirname", {
        get: function () {
            return path.dirname(this.src);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CompilerFile.prototype, "basename", {
        get: function () {
            return path.basename(this.src);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CompilerFile.prototype, "distMtime", {
        get: function () {
            if (!this.dist || !fs.existsSync(this.dist)) {
                return 0;
            }
            return fs.statSync(this.dist).mtimeMs;
        },
        enumerable: false,
        configurable: true
    });
    CompilerFile.from = function (file, dist, type, content) {
        if (dist === void 0) { dist = file.dist; }
        if (type === void 0) { type = file.type; }
        if (content === void 0) { content = file.content; }
        return new CompilerFile(file.src, file.mtime, dist, type, content);
    };
    return CompilerFile;
}());
exports.CompilerFile = CompilerFile;
var BaseProjectCompiler = (function () {
    function BaseProjectCompiler(inputFolder, outputFolder, options) {
        this.inputFolder = inputFolder;
        this.outputFolder = outputFolder;
        this.options = options;
    }
    BaseProjectCompiler.prototype.mkIfNotFolder = function (folder) {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
    };
    BaseProjectCompiler.prototype.outputFile = function (file) {
        return path.resolve(this.outputFolder, path.relative(this.inputFolder, file instanceof CompilerFile ? file.src : file));
    };
    BaseProjectCompiler.prototype.unlink = function (src) {
        var dist = this.outputFile(src);
        if (fs.existsSync(dist)) {
            fs.unlinkSync(dist);
        }
    };
    BaseProjectCompiler.prototype.logFile = function (file, tip) {
        if (tip === void 0) { tip = 'Finished'; }
        exports.consoleLog(file instanceof CompilerFile ? file.src : file, tip, this.inputFolder);
    };
    return BaseProjectCompiler;
}());
exports.BaseProjectCompiler = BaseProjectCompiler;
var PluginCompiler = (function () {
    function PluginCompiler() {
    }
    PluginCompiler.ts = function (input, file, tsConfigFileName, sourceMap) {
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
    PluginCompiler.sass = function (input, file, lang, options) {
        if (lang === void 0) { lang = 'scss'; }
        if (options === void 0) { options = {}; }
        var output = sass.renderSync(Object.assign({}, options, {
            data: input,
            file: file,
            indentedSyntax: lang === 'sass'
        }));
        return output.css.toString();
    };
    PluginCompiler.less = function (input, file, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var less, output;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        options.filename = file;
                        less = require('less');
                        return [4, less.render(input, options)];
                    case 1:
                        output = _a.sent();
                        return [2, output.css];
                }
            });
        });
    };
    return PluginCompiler;
}());
exports.PluginCompiler = PluginCompiler;
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
