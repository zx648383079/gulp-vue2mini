import path from 'path';
import { BaseProjectCompiler, CompilerFile, IProjectCompiler, LogLevel, eachCompileFile, fileContent } from '../../compiler';
import { PackLoader } from './register';
import { PackPipelineFn } from './pipeline';
import * as UglifyJS from 'uglify-js';
import CleanCSS from 'clean-css';
import { copyFileSync, writeFileSync } from 'fs';
import { LINE_SPLITE, regexReplace, renderOutputRule } from '../../util';
import { PackCompiler } from './compiler';
import { glob } from '../../util';


export class PackProject extends BaseProjectCompiler implements IProjectCompiler {

    constructor(
        _: string,
        outputFolder: string,
        options?: any
    ) {
        super(process.cwd(), outputFolder, options);
        PackLoader._instance = this;
    }


    public compiler = new PackCompiler(this);
    private fileItems: Record<string, CompilerFile> = {};
    private items: {
        [key: string]: Function
    } = {};

    public get compilerMin(): boolean {
        return this.options && this.options.min;
    }

    public get taskName(): string {
        return typeof this.options.custom === 'string' ? this.options.custom : 'default';
    }

    public readyFile(src: CompilerFile): CompilerFile | CompilerFile[] | undefined {
        return this.readyCompilerFile(src, this.outputFolder);
    }

    public outputFile(file: string|CompilerFile) {
        return this.readyOutputFile(file, this.outputFolder);
    }

    public compileFile(src: CompilerFile): void {
        this.logFile(src, 'unsupport file');
        // eachCompileFile(this.readyFile(src), file => {
        //     if (file.type === 'css') {
        //         fs.writeFileSync(file.dist, PluginCompiler.sass(fileContent(file), src.src));
        //         this.logFile(src);
        //     }
        // });
    }

    public compile() {
        const entry = path.resolve(this.inputFolder, 'packfile.js');
        const local = require(path.join(this.inputFolder, 'node_modules/gulp-vue2mini'));
        local.PackLoader._instance = this;
        require(entry);
        this.compileTask(this.taskName);
    }

    private compileTask(name: string) {
        if (!Object.prototype.hasOwnProperty.call(this.items, name)) {
            this.log(name, 'task not found', LogLevel.error);
            return;
        }
        this.log(name, "starting ...");
        const res = this.items[name]();
        if (res instanceof Promise) {
            res.then(_ => {
                this.log(name, "finished!");
            }, err => {
                this.log(name, err ?? "failure!", LogLevel.error);
            });
        } else if (res instanceof Array) {
            res.forEach(item => this.compileTask(item));
        }else {
            this.log(name, res ? "finished!" : "failure!", res ? LogLevel.info : LogLevel.error);
        }
    }

    public task(name: string, cb: Function) {
        this.items[name] = cb;
    }

    public compileAsync(input: string[], pipeItems: PackPipelineFn[], output: string): Promise<boolean> {
        this.fileItems = {};
        const isSingleFile = !output.endsWith('/');
        return new Promise<boolean>((resolve, _) => {
            const files = glob(input);
            let items: CompilerFile[] = [];
            if (isSingleFile) {
                const input = files.map(file => this.readSync(new CompilerFile(path.resolve(this.inputFolder, file)))).join(LINE_SPLITE);
                const inputFile = this.readyCompilerFile(new CompilerFile(path.resolve(this.inputFolder, output)), output, true) as CompilerFile;
                inputFile.content = input;
                this.fileItems[inputFile.src] = inputFile;
                items.push(inputFile);
            } else {
                for (const file of files) {
                    eachCompileFile(this.readyCompilerFile(new CompilerFile(path.resolve(this.inputFolder, file)), renderOutputRule(file, output)), src => {
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

    public getFile(fileName: string): CompilerFile|undefined {
        const file = path.resolve(this.inputFolder, fileName);
        if (this.fileItems[file]) {
            return this.fileItems[file];
        }
        return;
    }

    /**
     * 读取文件内容
     * @param input 
     */
    public readSync(input: CompilerFile): string {
        const content = fileContent(input);
        if (input.type !== 'ts') {
            return content;
        }
        return regexReplace(content, /\/{2,}\s*@import\s+["'](.+?)["'];*/g, match => {
            const part = new CompilerFile(path.resolve(input.dirname, match[1]));
            return fileContent(part);
        });
    }

    private compileFileSync(input: CompilerFile[], pipeItems: PackPipelineFn[]): CompilerFile[] {
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
            const items: CompilerFile[] = [];
            for (const item of input) {
                const res = fn.transform(item);
                if (typeof res === 'string') {
                    if (res.trim().length === 0) {
                        continue;
                    }
                    item.content = res;
                } else if (res === null) {
                    continue;
                } else if (res instanceof CompilerFile) {
                    items.push(res);
                    continue;
                }
                items.push(item);
            }
            input = items;
        }
        return input;
    }

    private writeAsync(file: CompilerFile): void;
    private writeAsync(content: string, type: string|undefined, fileName: string): void;
    private writeAsync(file: CompilerFile|string, type: string|undefined = '', fileName: string = '') {
        if (file instanceof CompilerFile) {
            fileName = file.dist;
            type = file.type;
        }
        this.mkIfNotFolder(path.dirname(fileName));
        const mustRead = this.compilerMin && ['js', 'ts', 'css', 'sass', 'scss', 'less'].indexOf(type as any) >= 0;
        if (!mustRead && file instanceof CompilerFile && typeof file.content === 'undefined') {
            copyFileSync(file.src, fileName);
        } else {
            let content = file instanceof CompilerFile ? fileContent(file) : file;
            if (content.length > 0 && this.compilerMin) {
                if (['js', 'ts'].indexOf(type as any) >= 0) {
                    content = UglifyJS.minify(content).code;
                } else if (['css', 'sass', 'scss', 'less'].indexOf(type as any) >= 0) {
                    content = new CleanCSS().minify(content).styles;
                }
            }
            writeFileSync(fileName, content);
        }
        this.logFile(fileName, 'SUCCESS!');
    }

    /**
     * 
     * @param src 
     * @param output 
     * @param noExclude 不排除 _ 开头的文件
     * @returns 
     */
    private readyCompilerFile(src: CompilerFile, output: string, noExclude = false): CompilerFile | CompilerFile[] | undefined {
        const ext = src.extname;
        const dist = this.readyOutputFile(src, output);
        if (ext === '.ts') {
            // 增加以 _ 开头的文件不编译， 调用
            if (!noExclude && src.basename.startsWith('_')) {
                return undefined;
            }
            return CompilerFile.from(src, this.replaceExtension(dist, ext, '.js', this.compilerMin), 'ts');
        }
        if (['.scss', '.sass'].indexOf(ext) >= 0) {
            if (!noExclude && src.basename.startsWith('_')) {
                return undefined;
            }
            return CompilerFile.from(src, this.replaceExtension(dist, ext, '.css', this.compilerMin), ext.substring(1));
        }
        if (this.compilerMin && ['.css', '.js'].indexOf(ext) >= 0) {
            return CompilerFile.from(src, this.replaceExtension(dist, ext, true), ext.substring(1));
        }
        return CompilerFile.from(src, dist, ext.substring(1));
    }

    private replaceExtension(file: string, ext: string): string;
    private replaceExtension(file: string, ext: string, min: boolean): string;
    private replaceExtension(file: string, oldExt: string, replaceExt: string, min: boolean): string;
    private replaceExtension(file: string, oldExt: string, replaceExt: string): string;
    private replaceExtension(file: string, oldExt: string, replaceExt: string|boolean = false, min = false): string {
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

    private readyOutputFile(file: string|CompilerFile, output: string) {
        if (!output.endsWith('/')) {
            return path.resolve(this.inputFolder, output);
        }
        return path.resolve(this.inputFolder, output, path.relative(this.inputFolder, file instanceof CompilerFile ? file.src : file));
    }
}