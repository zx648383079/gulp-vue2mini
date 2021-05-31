import * as fs from 'fs';
import * as path from 'path';
import { consoleLog, eachCompileFile, fileContent, ICompliper, ICompliperFile } from '../../compiler';
import { cssToScss } from '../css';

/**
 * css 转 scss
 */
export class StyleProject implements ICompliper {

    constructor(
        public inputFolder: string,
        public outputFolder: string,
        public options?: any
    ) {
    }

    public readyFile(src: string): undefined | ICompliperFile | ICompliperFile[] {
        return {
            src,
            dist: this.outputFile(src),
            type: 'css'
        };
    }

    public compileFile(src: string): void {
        eachCompileFile(this.readyFile(src), file => {
            if (file.type === 'css') {
                fs.writeFileSync(file.dist, cssToScss(fileContent(file)));
                this.logFile(src);
            }
        });
    }

    public outputFile(file: string) {
        return path.resolve(this.outputFolder, path.relative(this.inputFolder, file));
    }

    public unlink(src: string) {
        const dist = this.outputFile(src);
        if (fs.existsSync(dist)) {
            fs.unlinkSync(dist);
        }
    }

    public logFile(file: string, tip = 'Finished') {
        consoleLog(file, tip, this.inputFolder);
    }
}
