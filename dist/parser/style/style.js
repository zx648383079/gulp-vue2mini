"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StyleProject = void 0;
const fs = __importStar(require("fs"));
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
