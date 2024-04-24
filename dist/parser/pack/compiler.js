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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackCompiler = void 0;
const path_1 = __importDefault(require("path"));
const ts = __importStar(require("typescript"));
const host_1 = require("./host");
const util_1 = require("../../util");
const compiler_1 = require("../../compiler");
const fs_1 = require("fs");
class PackCompiler {
    project;
    constructor(project) {
        this.project = project;
    }
    host;
    compilerOptions;
    fileItems = [];
    loadHost(tsConfigFileName = 'tsconfig.json', sourceMap, declaration) {
        if (this.host) {
            return;
        }
        let projectDirectory = process.cwd();
        tsConfigFileName = path_1.default.resolve(process.cwd(), tsConfigFileName);
        projectDirectory = path_1.default.dirname(tsConfigFileName);
        const tsConfig = ts.readConfigFile(tsConfigFileName, ts.sys.readFile);
        const option = tsConfig.config || {};
        if (typeof sourceMap === 'boolean') {
            option.sourceMap = sourceMap;
            option.inlineSourceMap = true;
        }
        if (declaration === true) {
            option.declaration = true;
            option.emitDeclarationOnly = true;
            option.isolatedDeclarations = true;
        }
        else if (declaration === false) {
            option.declaration = false;
        }
        const parsed = ts.parseJsonConfigFileContent(option, {
            useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
            readDirectory: () => [],
            fileExists: ts.sys.fileExists,
            readFile: ts.sys.readFile
        }, path_1.default.resolve(projectDirectory), undefined, tsConfigFileName);
        this.compilerOptions = parsed.options;
        this.host = new host_1.Host(this.project, this.compilerOptions);
    }
    removeExtension(fileName, ext) {
        if (typeof ext === 'undefined') {
            ext = (0, util_1.getExtensionName)(fileName, ['min.js']);
        }
        fileName = fileName.replaceAll('\\', '/');
        if (!ext) {
            return fileName;
        }
        return fileName.substring(0, fileName.length - 1 - ext.length);
    }
    compileTypescipt(files, tsConfigFileName = 'tsconfig.json', sourceMap, declaration) {
        this.loadHost(tsConfigFileName, sourceMap, declaration);
        const program = ts.createProgram({
            rootNames: files.map(file => file.src),
            options: this.compilerOptions,
            host: this.host,
        });
        const maps = {};
        for (const item of files) {
            maps[this.removeExtension(item.src)] = {
                dist: this.removeExtension(item.dist),
                file: item
            };
        }
        program.emit(undefined, (fileName, content) => {
            const extension = (0, util_1.getExtensionName)(fileName, ['d.ts', 'd.ts.map']);
            const key = this.removeExtension(fileName, extension);
            const item = maps[key];
            if (!item) {
                return;
            }
            switch (extension) {
                case 'js':
                case 'jsx':
                    item.file.content = content;
                    break;
                case 'd.ts.map':
                    this.pushFile(item.dist + '.' + extension, extension, content);
                    break;
                case 'd.ts':
                    this.pushFile(item.dist + '.' + extension, extension, content);
                    break;
                case 'map':
                    this.pushFile(item.dist + '.' + extension, extension, content);
                    break;
            }
        }, undefined, false);
        return files;
    }
    compileSass(file, options = {}) {
        const output = compiler_1.PluginCompiler.sassImporter().compileString(this.project.readSync(file), compiler_1.PluginCompiler.createSassOptions(file.src, file.extname.substring(1), options));
        if (!options.sourceMap) {
            return output.css.toString();
        }
        const fileName = file.dist + '.map';
        if (options.sourceMap) {
            this.pushFile(fileName, '', output.sourceMap ? JSON.stringify({
                ...output.sourceMap,
                sources: output.sourceMap.sources.map(item => path_1.default.relative(path_1.default.dirname(file.dist), item.startsWith('file:') ? item.substring(6) : item).replaceAll('\\', '/')),
            }) : 'map');
        }
        return output.css.toString() + util_1.LINE_SPLITE + '/*# sourceMappingURL=' + path_1.default.basename(fileName) + ' */';
    }
    pushFile(fileName, extension, content) {
        if (content.length === 0) {
            return;
        }
        this.fileItems.push(new compiler_1.CompilerFile(fileName, undefined, fileName, extension, content));
    }
    finish() {
        const items = this.fileItems;
        this.fileItems = [];
        items.forEach(item => (0, fs_1.writeFileSync)(item.dist, item.content));
    }
}
exports.PackCompiler = PackCompiler;
