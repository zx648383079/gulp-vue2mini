import * as fs from 'fs';
import * as path from 'path';
import { Compiler, consoleLog, eachCompileFile, fileContent, ICompliper, ICompliperFile } from '../../compiler';
import * as UglifyJS from 'uglify-js';
import * as CleanCSS from 'clean-css';
import { TemplateTokenizer } from './tokenizer';
import { LinkManager } from '../link';
import { StyleParser } from './style';
import { TemplateParser } from './template';
import { ScriptParser } from './script';



/**
 * 模板项目转化
 */
export class TemplateProject implements ICompliper {

    constructor(
        public inputFolder: string,
        public outputFolder: string,
        public options?: any
    ) {
        this.link.on(this.compileAFile.bind(this));
    }

    public readonly link = new LinkManager();
    public readonly script = new ScriptParser(this);
    public readonly template = new TemplateParser(this);
    public readonly style = new StyleParser(this);
    public readonly tokenizer = new TemplateTokenizer(this);

    /**
     * 是否压缩最小化
     */
    public get compliperMin(): boolean {
        return this.options && this.options.min;
    }

    /**
     * 编译一个文件
     * @param file 文件路径
     * @param content 内容
     */
    public renderFile(file: ICompliperFile): string {
        const res = this.template.render(file);
        return res.template;
    }

    public readyFile(src: string): undefined | ICompliperFile | ICompliperFile[] {
        const ext = path.extname(src);
        const dist = this.outputFile(src);
        if (ext === '.ts') {
            return {
                src,
                dist: dist.replace(ext, '.js'),
                type: 'ts'
            };
        }
        if (['.scss', '.sass'].indexOf(ext) >= 0) {
            if (path.basename(src).indexOf('_') === 0) {
                return undefined;
            }
            return {
                type: ext.substring(1),
                src,
                dist: dist.replace(ext, '.css'),
            };
        }
        if (ext === '.html') {
            const file = {
                type: 'html',
                src,
                dist,
            };
            if (!this.tokenizer.render(file).canRender) {
                return undefined;
            }
            return file;
        }
        return {
            type: ext.substring(1),
            src,
            dist,
        };
    }

    public compileFile(src: string) {
        this.compileAFile(src);
    }

    /**
     * compileFile
     * @param mtime 更新时间
     */
    public compileAFile(src: string, mtime?: number) {
        const compile = (file: ICompliperFile) => {
            this.mkIfNotFolder(path.dirname(file.dist));
            if (file.type === 'ts') {
                let content = Compiler.ts(fileContent(file), src);
                if (content && content.length > 0 && this.compliperMin) {
                    content = UglifyJS.minify(content).code;
                }
                fs.writeFileSync(file.dist, content);
                return;
            }
            if (file.type === 'scss' || file.type === 'sass') {
                let content = this.style.render(fileContent(file), src, file.type);
                content = Compiler.sass(content, src, file.type);
                if (content && content.length > 0 && this.compliperMin) {
                    content = new CleanCSS().minify(content).styles;
                }
                fs.writeFileSync(file.dist, content);
                return;
            }
            if (file.type === 'html') {
                fs.writeFileSync(file.dist, this.renderFile(file));
                return;
            }
            if (typeof file.content !== 'undefined') {
                fs.writeFileSync(file.dist, file.content);
                return;
            }
            fs.copyFileSync(file.src, file.dist);
        };
        eachCompileFile(this.readyFile(src), file => {
            if (mtime && mtime > 0 && fs.existsSync(file.dist) && fs.statSync(file.dist).mtimeMs >= mtime) {
                // 判断时间是否更新
                return;
            }
            compile(file);
            this.logFile(file.src);
        });
        this.link.trigger(src, mtime || fs.statSync(src).mtimeMs);
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

    public unlink(src: string) {
        const dist = this.outputFile(src);
        if (fs.existsSync(dist)) {
            fs.unlinkSync(dist);
        }
    }

    /**
     * logFile
     */
    public logFile(file: string, tip = 'Finished') {
        consoleLog(file, tip, this.inputFolder);
    }
}
