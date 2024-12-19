import * as fs from 'fs';
import { SassCompiler } from '../../compiler';
import { BaseProjectCompiler, CompilerFile, eachCompileFile, fileContent } from '../../compiler';
export class StyleProject extends BaseProjectCompiler {
    compiler = new SassCompiler();
    readyFile(src) {
        return new CompilerFile(src.src, src.mtime, this.outputFile(src.src), 'css');
    }
    compileFile(src) {
        eachCompileFile(this.readyFile(src), file => {
            if (file.type === 'css') {
                fs.writeFileSync(file.dist, this.compiler.render(fileContent(file)));
                this.logFile(src);
            }
        });
    }
}
