"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StyleProject = void 0;
const fs = require("fs");
const compiler_1 = require("../../compiler");
const compiler_2 = require("../../compiler");
class StyleProject extends compiler_2.BaseProjectCompiler {
    compiler = new compiler_1.SassCompiler();
    readyFile(src) {
        return new compiler_2.CompilerFile(src.src, src.mtime, this.outputFile(src.src), 'css');
    }
    compileFile(src) {
        (0, compiler_2.eachCompileFile)(this.readyFile(src), file => {
            if (file.type === 'css') {
                fs.writeFileSync(file.dist, this.compiler.render((0, compiler_2.fileContent)(file)));
                this.logFile(src);
            }
        });
    }
}
exports.StyleProject = StyleProject;
