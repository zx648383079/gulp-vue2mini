import * as fs from 'fs';
import { BaseCompliper, CompliperFile, eachCompileFile, fileContent, ICompliper } from '../../compiler';
import { cssToScss } from '../css';

/**
 * css 转 scss
 */
export class StyleProject extends BaseCompliper implements ICompliper {

    public readyFile(src: CompliperFile): undefined | CompliperFile | CompliperFile[] {
        return new CompliperFile(src.src, src.mtime, this.outputFile(src.src), 'css');
    }

    public compileFile(src: CompliperFile): void {
        eachCompileFile(this.readyFile(src), file => {
            if (file.type === 'css') {
                fs.writeFileSync(file.dist, cssToScss(fileContent(file)));
                this.logFile(src);
            }
        });
    }

    
}
