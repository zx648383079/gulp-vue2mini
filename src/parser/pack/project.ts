import path from 'path';
import { BaseProjectCompiler, CompilerFile, IProjectCompiler, LogLevel, eachCompileFile, fileContent } from '../../compiler';
import { PackLoader } from './register';
import { glob } from 'glob';
import { PackPipelineFunc } from './pipeline';
import * as UglifyJS from 'uglify-js';
import CleanCSS from 'clean-css';
import { writeFileSync } from 'fs';
import { LINE_SPLITE, renderOutputRule } from '../../util';


export class PackProject extends BaseProjectCompiler implements IProjectCompiler {

    constructor(
        _: string,
        outputFolder: string,
        options?: any
    ) {
        super(process.cwd(), outputFolder, options);
        PackLoader._instance = this;
    }


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

    public compileAsync(input: string[], pipeItems: PackPipelineFunc[], output: string): Promise<boolean> {
        return glob(input).then(files => {
            const items: CompilerFile[] = [];
            for (const file of files) {
                eachCompileFile(this.readyCompilerFile(new CompilerFile(path.resolve(this.inputFolder, file)), renderOutputRule(file, output)), src => {
                    const res = this.compileFileSync(src, pipeItems);
                    if (!res) {
                        return;
                    }
                    items.push(res);
                });
            }
            if (items.length === 0) {
                return false;
            }
            if (output.endsWith('/')) {
                items.forEach(item => this.writeAsync(item));
            } else {
                this.writeAsync(items.map(item => fileContent(item)).join(LINE_SPLITE), items[0].type, items[0].dist);
            }
            return true;
        })
    }



    private compileFileSync(input: CompilerFile, pipeItems: PackPipelineFunc[]): CompilerFile|undefined {
        for (const fn of pipeItems) {
            const res =  fn.call(this, input);
            if (typeof res === 'string') {
                if (res.trim().length === 0) {
                    return;
                }
                input.content = res;
            } else if (res === null) {
                return;
            } else if (res instanceof CompilerFile) {
                input = res;
            }
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
        let content = file instanceof CompilerFile ? fileContent(file) : file;
        if (content.length > 0 && this.compilerMin) {
            if (['js', 'ts'].indexOf(type as any) >= 0) {
                content = UglifyJS.minify(content).code;
            } else if (['css', 'sass', 'scss', 'less'].indexOf(type as any) >= 0) {
                content = new CleanCSS().minify(content).styles;
            }
        }
        writeFileSync(fileName, content);
        this.logFile(fileName, 'SUCCESS!');
    }

    private readyCompilerFile(src: CompilerFile, output: string): CompilerFile | CompilerFile[] | undefined {
        const ext = src.extname;
        const dist = this.readyOutputFile(src, output);
        if (ext === '.ts') {
            return CompilerFile.from(src, this.replaceExtension(dist, ext, '.js', this.compilerMin), 'ts');
        }
        if (['.scss', '.sass'].indexOf(ext) >= 0) {
            if (src.basename.startsWith('_')) {
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