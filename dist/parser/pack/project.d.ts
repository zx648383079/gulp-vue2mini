import { BaseProjectCompiler, CompilerFile, IProjectCompiler } from '../../compiler';
import { PackPipelineFn } from './pipeline';
import { PackCompiler } from './compiler';
export declare class PackProject extends BaseProjectCompiler implements IProjectCompiler {
    constructor(_: string, outputFolder: string, options?: any);
    compiler: PackCompiler;
    private fileItems;
    private items;
    get compilerMin(): boolean;
    get taskName(): string;
    readyFile(src: CompilerFile): CompilerFile | CompilerFile[] | undefined;
    outputFile(file: string | CompilerFile): string;
    compileFile(src: CompilerFile): void;
    compile(): void;
    private compileTask;
    task(name: string, cb: Function): void;
    compileAsync(input: string[], pipeItems: PackPipelineFn[], output: string): Promise<boolean>;
    getFile(fileName: string): CompilerFile | undefined;
    readSync(input: CompilerFile): string;
    private compileFileSync;
    private writeAsync;
    private readyCompilerFile;
    private replaceExtension;
    private readyOutputFile;
}
