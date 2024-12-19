import * as path from 'path';
import { PackProject } from './project';
import * as ts from 'typescript';
import { Host } from './host';
import * as sass from 'sass';
import { LINE_SPLITE, getExtensionName, regexReplace } from '../../util';
import { CompilerFile, PluginCompiler, SassOptions } from '../../compiler';
import { writeFileSync, existsSync, statSync } from 'fs';

export class PackCompiler {

    constructor(
        private project: PackProject
    ) {
    }

    private host?: Host;
    private compilerOptions?: ts.CompilerOptions;
    private fileItems: CompilerFile[] = [];

    private loadHost(tsConfigFileName: string = 'tsconfig.json', sourceMap?: boolean, declaration?: boolean) {
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
        } else if (declaration === false) {
            option.declaration = false;
        }
        const parsed: ts.ParsedCommandLine = ts.parseJsonConfigFileContent(
            option,
            {
                useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
                readDirectory: () => [],
                fileExists: ts.sys.fileExists,
                readFile: ts.sys.readFile
            },
            path.resolve(projectDirectory),
            undefined,
            tsConfigFileName);
        this.compilerOptions = parsed.options;
        this.host = new Host(this.project, this.compilerOptions);
    }

    private removeExtension(fileName: string, ext?: string): string {
        if (typeof ext === 'undefined') {
            ext = getExtensionName(fileName, ['min.js']);
        }
        fileName = fileName.replaceAll('\\', '/');
        if (!ext) {
            return fileName;
        }
        return fileName.substring(0, fileName.length - 1 - ext.length);
    }

    public compileTypescipt(files: CompilerFile[], tsConfigFileName: string = 'tsconfig.json', sourceMap?: boolean, declaration?: boolean): CompilerFile[] {
        this.loadHost(tsConfigFileName, sourceMap, declaration);
        const program = ts.createProgram({
            rootNames: files.map(file => file.src),
            options: this.compilerOptions!,
            host: this.host,
        });
        const maps: any = {};
        for (const item of files) {
            maps[this.removeExtension(item.src)] = {
                dist: this.removeExtension(item.dist),
                file: item
            };
        }
        program.emit(
			undefined,
			(fileName, content) => {
                const extension = getExtensionName(fileName, ['d.ts', 'd.ts.map']);
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
                        // dtsMapContent = content;
                        this.pushFile(item.dist + '.' + extension, extension, content);
                        break;
                    case 'd.ts':
                        // dtsContent = content;
                        this.pushFile(item.dist + '.' + extension, extension, content);
                        break;
                    case 'map':
                        // jsMapContent = content;
                        this.pushFile(item.dist + '.' + extension, extension, content);
                        break;
                }
            },
			undefined,
			false,
		);
        return files;
    }

    private AddImportExtension(content: string, entry: string, extension: string): string {
        entry = path.dirname(entry);
        return regexReplace(content, /((import|export) .* from\s+['"])(\.{1,2}\/.*)(?=['"])/g, macth => {
            if (macth[3].endsWith('.' + extension)) {
                return macth[0];
            }
            const fullPath = path.join(entry, macth[3]);
            if (existsSync(fullPath) && statSync(fullPath).isDirectory()) {
                return `${macth[1]}${macth[3]}/index.${extension}`;
            }
            return `${macth[1]}${macth[3]}.${extension}`;
        });
    }

    public compileSass(file: CompilerFile, options: SassOptions = {}): string {
        const output: sass.CompileResult = PluginCompiler.sassImporter().compileString(this.project.readSync(file), PluginCompiler.createSassOptions(file.src, file.extname.substring(1), options));
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
        return output.css.toString() + LINE_SPLITE + '/*# sourceMappingURL='+ path.basename(fileName) +' */';
    }

    private pushFile(fileName: string, extension: string, content: string) {
        if (content.length === 0) {
            return;
        }
        this.fileItems.push(new CompilerFile(fileName, undefined, fileName, extension, content));
    }

    public finish() {
        const items = this.fileItems;
        this.fileItems = [];
        items.forEach(item => writeFileSync(item.dist, item.content!));
    }
}