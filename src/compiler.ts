import * as path from "path";
import * as ts from "typescript";
import * as sass from "sass";
import * as fs from "fs";
import { preImport, endImport, replaceTTF } from "./parser/css";
import { splitFile } from "./parser/vue";

export interface ICompliper {
    compileFile(src: string): void;
}


export class Compiler {
    public static ts(input: string, file: string, tsConfigFileName: string = 'tsconfig.json', sourceMap = false) {
        let projectDirectory = process.cwd();
		let compilerOptions: ts.CompilerOptions;
        tsConfigFileName = path.resolve(process.cwd(), tsConfigFileName);
        projectDirectory = path.dirname(tsConfigFileName);

        let tsConfig = ts.readConfigFile(tsConfigFileName, ts.sys.readFile);

        let parsed: ts.ParsedCommandLine =
					ts.parseJsonConfigFileContent(
						tsConfig.config || {},
						{
                            useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
                            readDirectory: () => [],
                            fileExists: ts.sys.fileExists,
                            readFile: ts.sys.readFile
                        },
						path.resolve(projectDirectory),
						undefined,
                        tsConfigFileName);
        compilerOptions = parsed.options;

        const output: ts.TranspileOutput = ts.transpileModule(input, {
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

    public static sass(input: string, file: string, lang = 'scss', options: sass.Options = {}): string {
        const output = sass.renderSync(Object.assign({}, options, {
            data: input,
            file,
            //includePaths: [],
            indentedSyntax: lang === 'sass'
        }));
        return output.css.toString();
    }

}

export class MiniCompliper implements ICompliper {
    constructor(
        public inputFolder: string,
        public outputFolder: string,
        public options?: any
    ) {
    }

    /**
     * compileFile
    */
    public compileFile(src: string) {
        const ext = path.extname(src);
        let dist = this.outputFile(src);
        const distFolder = path.dirname(dist);
        let content = '';
        if (ext === '.ts') {
            content = Compiler.ts(fs.readFileSync(src).toString(), src);
            dist = dist.replace(ext, '.js');
        } else if (ext === '.scss' || ext === '.sass') {
            const name = path.basename(src);
            if (name.indexOf('_') === 0) {
                return;
            }
            content = Compiler.sass(preImport(fs.readFileSync(src).toString()), src, ext.substr(1));
            content = endImport(content);
            content = replaceTTF(content, path.dirname(src));
            dist = dist.replace(ext, '.wxss');
        } else if (ext === '.html' || ext === '.vue') {
            let data = {};
            let jsonPath = src.replace(ext, '.json');
            if (fs.existsSync(jsonPath)) {
                const json = fs.readFileSync(jsonPath).toString();
                data = json.trim().length > 0 ? JSON.parse(json) : {};
            }
            const res: any = splitFile(fs.readFileSync(src).toString(), ext.substr(1).toLowerCase(), data);
            this.mkIfNotFolder(distFolder);
            for (const key in res) {
                if (res.hasOwnProperty(key)) {
                    const item = res[key];
                    if (item.type === 'json') {
                        fs.writeFileSync(dist.replace(ext, '.json'), item.content);
                        continue;
                    }
                    if (item.type === 'wxml') {
                        fs.writeFileSync(dist.replace(ext, '.wxml'), item.content);
                        continue;
                    }
                    if (item.type === 'css') {
                        fs.writeFileSync(dist.replace(ext, '.wxss'), item.content);
                        continue;
                    }
                    if (item.type === 'js') {
                        fs.writeFileSync(dist.replace(ext, '.js'), item.content);
                        continue;
                    }
                    if (item.type === 'ts') {
                        fs.writeFileSync(dist.replace(ext, '.js'), Compiler.ts(item.content, src));
                        continue;
                    }
                    if (item.type === 'scss' || item.type === 'sass') {
                        content = Compiler.sass(preImport(item.content), src, item.type);
                        content = endImport(content);
                        content = replaceTTF(content, path.dirname(src));
                        fs.writeFileSync(dist.replace(ext, '.wxss'), content);
                        continue;
                    }
                }
            }
            this.logFile(src);
            return;
        } else if (['.ttf', '.json'].indexOf(ext) >= 0) {
            return;
        } else {
            if (ext === '.css') {
                dist = dist.replace(ext, '.wxss');
            }
            this.mkIfNotFolder(distFolder);
            fs.copyFileSync(src, dist);
            this.logFile(src);
            return;
        }
        if (content.length < 1) {
            return;
        }
        this.mkIfNotFolder(distFolder);
        fs.writeFileSync(dist, content);
        this.logFile(src);
    }

    /**
     * mkIfNotFolder
     */
    public mkIfNotFolder(folder: string) {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, {recursive: true});
        }
    }

    /**
     * outputFile
     */
    public outputFile(file: string) {
        return path.resolve(this.outputFolder, path.relative(this.inputFolder, file)); 
    }

    /**
     * logFile
     */
    public logFile(file: string, tip = 'Finished') {
        const now = new Date();
        console.log('[' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + ']', path.relative(this.inputFolder, file), tip);
    }
}