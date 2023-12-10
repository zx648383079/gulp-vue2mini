"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileContent = exports.eachCompileFile = exports.PluginCompiler = exports.BaseProjectCompiler = exports.CompilerFile = void 0;
const path = __importStar(require("path"));
const ts = __importStar(require("typescript"));
const fs = __importStar(require("fs"));
const url_1 = require("url");
const log_1 = require("./log");
const util_1 = require("../util");
class CompilerFile {
    src;
    mtime;
    dist;
    type;
    content;
    constructor(src, mtime = 0, dist = '', type, content) {
        this.src = src;
        this.mtime = mtime;
        this.dist = dist;
        this.type = type;
        this.content = content;
    }
    get extname() {
        return path.extname(this.src);
    }
    get dirname() {
        return path.dirname(this.src);
    }
    get basename() {
        return path.basename(this.src);
    }
    get distMtime() {
        if (!this.dist || !fs.existsSync(this.dist)) {
            return 0;
        }
        return fs.statSync(this.dist).mtimeMs;
    }
    static from(file, dist = file.dist, type = file.type, content = file.content) {
        return new CompilerFile(file.src, file.mtime, dist, type, content);
    }
}
exports.CompilerFile = CompilerFile;
class BaseProjectCompiler {
    inputFolder;
    outputFolder;
    options;
    constructor(inputFolder, outputFolder, options) {
        this.inputFolder = inputFolder;
        this.outputFolder = outputFolder;
        this.options = options;
    }
    isBooted = false;
    logger = new log_1.Logger();
    booted() {
        this.isBooted = true;
    }
    mkIfNotFolder(folder) {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
    }
    outputFile(file) {
        return path.resolve(this.outputFolder, path.relative(this.inputFolder, file instanceof CompilerFile ? file.src : file));
    }
    unlink(src) {
        const dist = this.outputFile(src);
        if (fs.existsSync(dist)) {
            fs.unlinkSync(dist);
        }
    }
    logFile(file, tip = 'Finished', level = log_1.LogLevel.info) {
        const realFile = file instanceof CompilerFile ? file.src : file;
        this.log(this.inputFolder ? path.relative(this.inputFolder, realFile) : realFile, tip, level);
    }
    log(key, tip = 'Finished', level = log_1.LogLevel.info) {
        const now = new Date();
        this.logger.log(level, log_1.LogStr.build(undefined, '[', (0, util_1.twoPad)(now.getHours()), ':', (0, util_1.twoPad)(now.getMinutes()), ':', (0, util_1.twoPad)(now.getSeconds()), '] ')
            .join(log_1.Colors.magenta, key)
            .join(' ')
            .join(this.logger.levelToColor(level), tip));
    }
}
exports.BaseProjectCompiler = BaseProjectCompiler;
class PluginCompiler {
    static ts(input, file, tsConfigFileName = 'tsconfig.json', sourceMap = false) {
        let projectDirectory = process.cwd();
        let compilerOptions;
        tsConfigFileName = path.resolve(process.cwd(), tsConfigFileName);
        projectDirectory = path.dirname(tsConfigFileName);
        const tsConfig = ts.readConfigFile(tsConfigFileName, ts.sys.readFile);
        const parsed = ts.parseJsonConfigFileContent(tsConfig.config || {}, {
            useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
            readDirectory: () => [],
            fileExists: ts.sys.fileExists,
            readFile: ts.sys.readFile
        }, path.resolve(projectDirectory), undefined, tsConfigFileName);
        compilerOptions = parsed.options;
        const output = ts.transpileModule(input, {
            compilerOptions,
            fileName: file,
            reportDiagnostics: true,
            transformers: undefined,
        });
        if (sourceMap) {
            return output.outputText;
        }
        return output.outputText.replace(/\/\/#\ssourceMappingURL[\s\S]+$/, '');
    }
    static sass(input, file, lang = 'scss', options = {}) {
        const fileExsist = (url) => {
            return fs.existsSync(url) ? url : undefined;
        };
        const loadImport = (fileName, base) => {
            const extension = `.${lang}`;
            if (fileName.endsWith(extension)) {
                return fileExsist(new URL(fileName, base));
            }
            const i = fileName.lastIndexOf('/');
            if (fileName[i + 1] === '_') {
                return fileExsist(new URL(fileName + extension, base));
            }
            if (i < 0) {
                return fileExsist(new URL(`_${fileName}${extension}`, base));
            }
            return fileExsist(new URL(fileName.substring(0, i + 1) + '_' + fileName.substring(i + 2) + extension, base));
        };
        if (!options.importers) {
            const includePaths = [(0, url_1.pathToFileURL)(file)];
            if (Object.prototype.hasOwnProperty.call(options, 'includePaths')) {
                (0, util_1.eachObject)(options.includePaths, v => {
                    if (v && typeof v === 'string') {
                        includePaths.push((0, url_1.pathToFileURL)(v));
                    }
                });
            }
            options.importers = [{
                    findFileUrl(url) {
                        if (/^[a-z]+:/i.test(url)) {
                            return null;
                        }
                        for (const folder of includePaths) {
                            const uri = loadImport(url, folder);
                            if (uri) {
                                return uri;
                            }
                        }
                        return new URL(url, includePaths[0]);
                    }
                }];
        }
        const output = PluginCompiler.sassImporter().compileString(input, Object.assign({}, options, {
            url: new URL(file),
            syntax: lang === 'sass' ? 'indented' : 'scss'
        }));
        return output.css.toString();
    }
    static async less(input, file, options = {}) {
        options.filename = file;
        const output = await PluginCompiler.lessImporter().render(input, options);
        return output.css;
    }
    static sassImporter() {
        return require('sass');
    }
    static lessImporter() {
        return require('less');
    }
}
exports.PluginCompiler = PluginCompiler;
const eachCompileFile = (files, callback) => {
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
const fileContent = (file) => {
    if (typeof file.content !== 'undefined') {
        return file.content;
    }
    file.content = fs.readFileSync(file.src).toString();
    return file.content;
};
exports.fileContent = fileContent;
