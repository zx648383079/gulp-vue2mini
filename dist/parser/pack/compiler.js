"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackCompiler = void 0;
const path = require("path");
const ts = require("typescript");
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
        tsConfigFileName = path.resolve(process.cwd(), tsConfigFileName);
        projectDirectory = path.dirname(tsConfigFileName);
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
        }, path.resolve(projectDirectory), undefined, tsConfigFileName);
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
                case 'mjs':
                case 'cjs':
                    item.file.content = this.AddImportExtension(content, fileName, extension);
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
    AddImportExtension(content, entry, extension) {
        entry = path.dirname(entry);
        return (0, util_1.regexReplace)(content, /((import|export) .* from\s+['"])(\.{1,2}\/.*)(?=['"])/g, macth => {
            if (macth[3].endsWith('.' + extension)) {
                return macth[0];
            }
            const fullPath = path.join(entry, macth[3]);
            if ((0, fs_1.existsSync)(fullPath) && (0, fs_1.statSync)(fullPath).isDirectory()) {
                return `${macth[1]}${macth[3]}/index.${extension}`;
            }
            return `${macth[1]}${macth[3]}.${extension}`;
        });
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
                sources: output.sourceMap.sources.map(item => path.relative(path.dirname(file.dist), item.startsWith('file:') ? item.substring(6) : item).replaceAll('\\', '/')),
            }) : 'map');
        }
        return output.css.toString() + util_1.LINE_SPLITE + '/*# sourceMappingURL=' + path.basename(fileName) + ' */';
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
