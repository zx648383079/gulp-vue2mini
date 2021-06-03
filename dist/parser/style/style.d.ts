import { BaseProjectCompiler, CompilerFile, IProjectCompiler } from '../../compiler';
export declare class StyleProject extends BaseProjectCompiler implements IProjectCompiler {
    private readonly compiler;
    readyFile(src: CompilerFile): undefined | CompilerFile | CompilerFile[];
    compileFile(src: CompilerFile): void;
}
