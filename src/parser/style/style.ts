import * as fs from 'fs';
import { SassCompiler } from '../../compiler';
import { BaseProjectCompiler, CompilerFile, eachCompileFile, fileContent, IProjectCompiler } from '../../compiler';

/**
 * css 转 scss
 */
export class StyleProject extends BaseProjectCompiler implements IProjectCompiler {

    private readonly compiler = new SassCompiler();

    public readyFile(src: CompilerFile): undefined | CompilerFile | CompilerFile[] {
        return new CompilerFile(src.src, src.mtime, this.outputFile(src.src), 'css');
    }

    public compileFile(src: CompilerFile): void {
        eachCompileFile(this.readyFile(src), file => {
            if (file.type === 'css') {
                fs.writeFileSync(file.dist, this.compiler.render(fileContent(file)));
                this.logFile(src);
            }
        });
    }

    
}
