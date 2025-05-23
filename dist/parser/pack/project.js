"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackProject = void 0;
const path = require("path");
const compiler_1 = require("../../compiler");
const register_1 = require("./register");
const UglifyJS = require("uglify-js");
const CleanCSS = require("clean-css");
const fs_1 = require("fs");
const util_1 = require("../../util");
const compiler_2 = require("./compiler");
const util_2 = require("../../util");
class PackProject extends compiler_1.BaseProjectCompiler {
    constructor(_, outputFolder, options) {
        super(process.cwd(), outputFolder, options);
        register_1.PackLoader._instance = this;
    }
    compiler = new compiler_2.PackCompiler(this);
    fileItems = {};
    items = {};
    get compilerMin() {
        return this.options && this.options.min;
    }
    get taskName() {
        return typeof this.options.custom === 'string' ? this.options.custom : 'default';
    }
    readyFile(src) {
        return this.readyCompilerFile(src, this.outputFolder);
    }
    outputFile(file) {
        return this.readyOutputFile(file, this.outputFolder);
    }
    compileFile(src) {
        this.logFile(src, 'unsupport file');
    }
    compile() {
        const entry = path.resolve(this.inputFolder, 'packfile.js');
        const local = require(path.join(this.inputFolder, 'node_modules/gulp-vue2mini'));
        local.PackLoader._instance = this;
        require(entry);
        this.compileTask(this.taskName);
    }
    compileTask(name) {
        if (!Object.prototype.hasOwnProperty.call(this.items, name)) {
            this.log(name, 'task not found', compiler_1.LogLevel.error);
            return;
        }
        this.log(name, "starting ...");
        const res = this.items[name]();
        if (res instanceof Promise) {
            res.then(_ => {
                this.log(name, "finished!");
            }, err => {
                this.log(name, err ?? "failure!", compiler_1.LogLevel.error);
            });
        }
        else if (res instanceof Array) {
            res.forEach(item => this.compileTask(item));
        }
        else {
            this.log(name, res ? "finished!" : "failure!", res ? compiler_1.LogLevel.info : compiler_1.LogLevel.error);
        }
    }
    task(name, cb) {
        this.items[name] = cb;
    }
    compileAsync(input, pipeItems, output) {
        this.fileItems = {};
        const isSingleFile = !output.endsWith('/');
        return new Promise((resolve, _) => {
            const files = (0, util_2.glob)(input);
            let items = [];
            if (isSingleFile) {
                const input = files.map(file => this.readSync(new compiler_1.CompilerFile(path.resolve(this.inputFolder, file)))).join(util_1.LINE_SPLITE);
                const inputFile = this.readyCompilerFile(new compiler_1.CompilerFile(path.resolve(this.inputFolder, output)), output, true);
                inputFile.content = input;
                this.fileItems[inputFile.src] = inputFile;
                items.push(inputFile);
            }
            else {
                for (const file of files) {
                    (0, compiler_1.eachCompileFile)(this.readyCompilerFile(new compiler_1.CompilerFile(path.resolve(this.inputFolder, file)), (0, util_1.renderOutputRule)(file, output)), src => {
                        this.fileItems[src.src] = src;
                        items.push(src);
                    });
                }
            }
            items = this.compileFileSync(items, pipeItems);
            if (items.length === 0) {
                resolve(false);
                return;
            }
            items.forEach(item => this.writeAsync(item));
            this.compiler.finish();
            resolve(true);
        });
    }
    getFile(fileName) {
        const file = path.resolve(this.inputFolder, fileName);
        if (this.fileItems[file]) {
            return this.fileItems[file];
        }
        return;
    }
    readSync(input) {
        const lockItems = [];
        const readOnLock = (file) => {
            if (lockItems.indexOf(file.src) >= 0) {
                return '';
            }
            lockItems.push(file.src);
            const content = (0, compiler_1.fileContent)(file);
            if (file.type !== 'ts') {
                return content;
            }
            return (0, util_1.regexReplace)(content, /\/{2,}\s*@import\s+["'](.+?)["'];*/g, match => {
                const part = new compiler_1.CompilerFile(path.resolve(file.dirname, match[1]), undefined, undefined, file.type);
                return readOnLock(part);
            });
        };
        return readOnLock(input);
    }
    compileFileSync(input, pipeItems) {
        if (input.length === 0) {
            return input;
        }
        for (const fn of pipeItems) {
            if (input.length === 0) {
                break;
            }
            if (typeof fn === 'function') {
                input = fn.call(this, input);
                continue;
            }
            const items = [];
            for (const item of input) {
                const res = fn.transform(item);
                if (typeof res === 'string') {
                    if (res.trim().length === 0) {
                        continue;
                    }
                    item.content = res;
                }
                else if (res === null) {
                    continue;
                }
                else if (res instanceof compiler_1.CompilerFile) {
                    items.push(res);
                    continue;
                }
                items.push(item);
            }
            input = items;
        }
        return input;
    }
    writeAsync(file, type = '', fileName = '') {
        if (file instanceof compiler_1.CompilerFile) {
            fileName = file.dist;
            type = file.type;
        }
        this.mkIfNotFolder(path.dirname(fileName));
        const mustRead = this.compilerMin && ['js', 'ts', 'css', 'sass', 'scss', 'less'].indexOf(type) >= 0;
        if (!mustRead && file instanceof compiler_1.CompilerFile && typeof file.content === 'undefined') {
            (0, fs_1.copyFileSync)(file.src, fileName);
        }
        else {
            let content = file instanceof compiler_1.CompilerFile ? (0, compiler_1.fileContent)(file) : file;
            if (content.length > 0 && this.compilerMin) {
                if (['js', 'ts'].indexOf(type) >= 0) {
                    content = UglifyJS.minify(content).code;
                }
                else if (['css', 'sass', 'scss', 'less'].indexOf(type) >= 0) {
                    content = new CleanCSS().minify(content).styles;
                }
            }
            (0, fs_1.writeFileSync)(fileName, content);
        }
        this.logFile(fileName, 'SUCCESS!');
    }
    readyCompilerFile(src, output, noExclude = false) {
        const ext = src.extname;
        const dist = this.readyOutputFile(src, output);
        if (ext === '.ts') {
            if (!noExclude && src.basename.startsWith('_')) {
                return undefined;
            }
            return compiler_1.CompilerFile.from(src, this.replaceExtension(dist, ext, '.js', this.compilerMin), 'ts');
        }
        if (['.scss', '.sass'].indexOf(ext) >= 0) {
            if (!noExclude && src.basename.startsWith('_')) {
                return undefined;
            }
            return compiler_1.CompilerFile.from(src, this.replaceExtension(dist, ext, '.css', this.compilerMin), ext.substring(1));
        }
        if (this.compilerMin && ['.css', '.js'].indexOf(ext) >= 0) {
            return compiler_1.CompilerFile.from(src, this.replaceExtension(dist, ext, true), ext.substring(1));
        }
        return compiler_1.CompilerFile.from(src, dist, ext.substring(1));
    }
    replaceExtension(file, oldExt, replaceExt = false, min = false) {
        if (typeof replaceExt === 'boolean') {
            min = replaceExt;
            replaceExt = oldExt;
        }
        if (file.endsWith(oldExt)) {
            file = file.substring(0, file.length - oldExt.length);
        }
        if (min && !file.endsWith('.min')) {
            return `${file}.min${replaceExt}`;
        }
        return file + replaceExt;
    }
    readyOutputFile(file, output) {
        if (!output.endsWith('/')) {
            return path.resolve(this.inputFolder, output);
        }
        return path.resolve(this.inputFolder, output, path.relative(this.inputFolder, file instanceof compiler_1.CompilerFile ? file.src : file));
    }
}
exports.PackProject = PackProject;
