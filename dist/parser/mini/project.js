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
exports.MiniProject = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const css_1 = require("./css");
const vue_1 = require("./vue");
const compiler_1 = require("../../compiler");
const ts_1 = require("./ts");
const link_1 = require("../../util/link");
const wxml_1 = require("./wxml");
const json_1 = require("./json");
class MiniProject extends compiler_1.BaseProjectCompiler {
    link = new link_1.LinkManager();
    script = new ts_1.ScriptParser(this);
    template = new wxml_1.WxmlCompiler(this);
    style = new css_1.StyleParser(this);
    json = new json_1.JsonParser(this);
    mix = new vue_1.VueParser(this);
    readyFile(src) {
        const ext = src.extname;
        const dist = this.outputFile(src);
        if (ext === '.ts') {
            return compiler_1.CompilerFile.from(src, dist.replace(ext, '.js'), 'ts');
        }
        if (ext === '.scss' || ext === '.sass') {
            if (src.basename.startsWith('_')) {
                return undefined;
            }
            return compiler_1.CompilerFile.from(src, dist.replace(ext, '.wxss'), ext.substring(1));
        }
        if (ext === '.less') {
            return compiler_1.CompilerFile.from(src, dist.replace(ext, '.wxss'), ext.substring(1));
        }
        if (['.ttf', '.json'].indexOf(ext) >= 0) {
            return undefined;
        }
        if (ext === '.css') {
            return compiler_1.CompilerFile.from(src, dist.replace(ext, '.wxss'), ext.substring(1));
        }
        if (ext === '.html' || ext === '.vue') {
            return this.readyMixFile(src, ext, dist);
        }
        return compiler_1.CompilerFile.from(src, dist, ext.substring(1));
    }
    readyMixFile(src, content, ext, dist) {
        if (content === void 0) {
            [content, ext, dist] = [(0, compiler_1.fileContent)(src), src.extname, src.dist];
        }
        if (ext === void 0) {
            [content, ext, dist] = [(0, compiler_1.fileContent)(src), src.extname, content];
        }
        else if (dist === void 0) {
            [content, ext, dist] = [(0, compiler_1.fileContent)(src), content, ext];
        }
        let data = {};
        const jsonPath = src.src.replace(ext, '.json');
        if (jsonPath.endsWith('.json') && fs.existsSync(jsonPath)) {
            const json = fs.readFileSync(jsonPath).toString();
            data = json.trim().length > 0 ? JSON.parse(json) : {};
        }
        const res = this.mix.render(content, ext.substring(1).toLowerCase(), src.src);
        const files = [];
        files.push(compiler_1.CompilerFile.from(src, dist.replace(ext, '.json'), 'json', this.json.render(res.json, data)));
        if (res.template) {
            files.push(compiler_1.CompilerFile.from(src, dist.replace(ext, '.wxml'), 'wxml', res.template));
        }
        if (res.script) {
            files.push(compiler_1.CompilerFile.from(src, dist.replace(ext, '.js'), res.script.type, res.script.content));
        }
        if (res.style) {
            files.push(compiler_1.CompilerFile.from(src, dist.replace(ext, '.wxss'), res.style.type, res.style.content));
        }
        return files;
    }
    compileFile(src) {
        const compile = (file) => {
            this.mkIfNotFolder(path.dirname(file.dist));
            if (file.type === 'ts') {
                fs.writeFileSync(file.dist, compiler_1.PluginCompiler.ts((0, compiler_1.fileContent)(file), src.src));
                return;
            }
            if (file.type === 'less') {
                compiler_1.PluginCompiler.less((0, compiler_1.fileContent)(file), src.src).then(content => {
                    fs.writeFileSync(file.dist, content);
                });
                return;
            }
            if (file.type === 'sass' || file.type === 'scss') {
                let content = compiler_1.PluginCompiler.sass((0, css_1.preImport)((0, compiler_1.fileContent)(file)), src.src, file.type);
                content = (0, css_1.endImport)(content);
                fs.writeFileSync(file.dist, (0, css_1.replaceTTF)(content, src.dirname));
                return;
            }
            if (typeof file.content !== 'undefined') {
                fs.writeFileSync(file.dist, file.content);
                return;
            }
            fs.copyFileSync(src.src, file.dist);
        };
        (0, compiler_1.eachCompileFile)(this.readyFile(src), file => {
            compile(file);
            this.logFile(file.src);
        });
    }
}
exports.MiniProject = MiniProject;
