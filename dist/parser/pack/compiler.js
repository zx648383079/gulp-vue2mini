import path from 'path';
import * as ts from 'typescript';
import { Host } from './host';
import { LINE_SPLITE, getExtensionName } from '../../util';
import { CompilerFile, PluginCompiler } from '../../compiler';
import { writeFileSync } from 'fs';
export class PackCompiler {
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
        this.host = new Host(this.project, this.compilerOptions);
    }
    removeExtension(fileName, ext) {
        if (typeof ext === 'undefined') {
            ext = getExtensionName(fileName, ['min.js']);
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
            const extension = getExtensionName(fileName, ['d.ts', 'd.ts.map']);
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
        const output = PluginCompiler.sassImporter().compileString(this.project.readSync(file), PluginCompiler.createSassOptions(file.src, file.extname.substring(1), options));
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
        return output.css.toString() + LINE_SPLITE + '/*# sourceMappingURL=' + path.basename(fileName) + ' */';
    }
    pushFile(fileName, extension, content) {
        if (content.length === 0) {
            return;
        }
        this.fileItems.push(new CompilerFile(fileName, undefined, fileName, extension, content));
    }
    finish() {
        const items = this.fileItems;
        this.fileItems = [];
        items.forEach(item => writeFileSync(item.dist, item.content));
    }
}
