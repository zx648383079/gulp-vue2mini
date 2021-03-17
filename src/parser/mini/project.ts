import * as path from 'path';
import * as fs from 'fs';
import { preImport, endImport, replaceTTF } from './css';
import { splitFile } from './vue';
import { Compiler, consoleLog, eachCompileFile, fileContent, ICompliper, ICompliperFile } from '../../compiler';

export class MiniProject implements ICompliper {
    constructor(
        public inputFolder: string,
        public outputFolder: string,
        public options?: any
    ) {
    }

    public readyFile(src: string): undefined | ICompliperFile | ICompliperFile[] {
        const ext = path.extname(src);
        const dist = this.outputFile(src);
        if (ext === '.ts') {
            return {
                type: 'ts',
                src,
                dist: dist.replace(ext, '.js'),
            };
        }
        if (ext === '.scss' || ext === '.sass') {
            if (path.basename(src).indexOf('_') === 0) {
                return undefined;
            }
            return {
                type: ext.substring(1),
                src,
                dist: dist.replace(ext, '.wxss'),
            };
        }
        if (['.ttf', '.json'].indexOf(ext) >= 0) {
            return undefined;
        }
        if (ext === '.css') {
            return {
                type: 'css',
                src,
                dist: dist.replace(ext, '.wxss'),
            };
        }
        if (ext === '.html' || ext === '.vue') {
            return this.readyVueFile(src, ext, dist);
        }
        return {
            type: ext.substring(1),
            src,
            dist,
        };
    }

    private readyVueFile(src: string, ext: string, dist: string): ICompliperFile[] {
        let data = {};
        const jsonPath = src.replace(ext, '.json');
        if (fs.existsSync(jsonPath)) {
            const json = fs.readFileSync(jsonPath).toString();
            data = json.trim().length > 0 ? JSON.parse(json) : {};
        }
        const res: any = splitFile(fs.readFileSync(src).toString(), ext.substr(1).toLowerCase(), data);
        const files: ICompliperFile[] = [];
        for (const key in res) {
            if (res.hasOwnProperty(key)) {
                const item = res[key];
                if (item.type === 'json') {
                    files.push({
                        src,
                        content: item.content,
                        dist: dist.replace(ext, '.json'),
                        type: item.type
                    });
                    continue;
                }
                if (item.type === 'wxml') {
                    files.push({
                        src,
                        content: item.content,
                        dist: dist.replace(ext, '.wxml'),
                        type: item.type
                    });
                    continue;
                }
                if (item.type === 'css') {
                    files.push({
                        src,
                        content: item.content,
                        dist: dist.replace(ext, '.wxss'),
                        type: item.type
                    });
                    continue;
                }
                if (item.type === 'js') {
                    files.push({
                        src,
                        content: item.content,
                        dist: dist.replace(ext, '.js'),
                        type: item.type
                    });
                    continue;
                }
                if (item.type === 'ts') {
                    files.push({
                        src,
                        content: item.content,
                        dist: dist.replace(ext, '.js'),
                        type: item.type
                    });
                    continue;
                }
                if (item.type === 'scss' || item.type === 'sass') {
                    files.push({
                        src,
                        content: item.content,
                        dist: dist.replace(ext, '.wxss'),
                        type: item.type
                    });
                    continue;
                }
            }
        }
        return files;
    }

    /**
     * compileFile
     */
    public compileFile(src: string) {
        const compile = (file: ICompliperFile) => {
            this.mkIfNotFolder(path.dirname(file.dist));
            if (file.type === 'ts') {
                fs.writeFileSync(file.dist,
                    Compiler.ts(fileContent(file), src)
                );
                return;
            }
            if (file.type === 'sass' || file.type === 'scss') {
                let content = Compiler.sass(preImport(fileContent(file)), src, file.type);
                content = endImport(content);
                fs.writeFileSync(file.dist,
                    replaceTTF(content, path.dirname(src))
                );
                return;
            }
            if (typeof file.content !== 'undefined') {
                fs.writeFileSync(file.dist,
                    file.content
                );
                return;
            }
            fs.copyFileSync(src, file.dist);
        };
        eachCompileFile(this.readyFile(src), file => {
            compile(file);
            this.logFile(file.src);
        });
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
