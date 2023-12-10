import { BaseProjectCompiler, CompilerFile, IProjectCompiler } from '../../compiler';
import { PackPipelineFunc } from './pipeline';
export declare class PackProject extends BaseProjectCompiler implements IProjectCompiler {
    constructor(inputFolder: string, outputFolder: string, options?: any);
    private items;
    get compilerMin(): boolean;
    readyFile(src: CompilerFile): CompilerFile | CompilerFile[] | undefined;
    outputFile(file: string | CompilerFile): string;
    compileFile(src: CompilerFile): void;
    compile(): void;
    private compileTask;
    task(name: string, cb: Function): void;
    compileAsync(input: string[], pipeItems: PackPipelineFunc[], output: string): Promise<boolean>;
    private compileFileSync;
    private writeAsync;
    private readyCompilerFile;
    private replaceExtension;
    private readyOutputFile;
}
