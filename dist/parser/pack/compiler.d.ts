import { PackProject } from './project';
import { CompilerFile, SassOptions } from '../../compiler';
export declare class PackCompiler {
    private project;
    constructor(project: PackProject);
    private host?;
    private compilerOptions?;
    private fileItems;
    private loadHost;
    private removeExtension;
    compileTypescipt(files: CompilerFile[], tsConfigFileName?: string, sourceMap?: boolean, declaration?: boolean): CompilerFile[];
    compileSass(file: CompilerFile, options?: SassOptions): string;
    private pushFile;
    finish(): void;
}
