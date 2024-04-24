import { CompilerFile, SassOptions, eachCompileFile } from '../../compiler';
import { PackLoader } from './register';

export type PackPipelineFunc = (files: CompilerFile[]) => CompilerFile[];
export interface PackPipelineTransform {
    transform(file: CompilerFile): string|CompilerFile|null|undefined;
}
export type PackPipelineFn = PackPipelineFunc|PackPipelineTransform;

export class PackPipeline {
    constructor(...items: string[]) {
        this.items = items;
    }

    private items: string[] = [];
    private pipeItems: PackPipelineFn[] = [];

    public input(...items: string[]) {
        this.items.push(...items);
        return this;
    }

    public pipe(fn: PackPipelineFunc): PackPipeline;
    public pipe(transform: PackPipelineTransform): PackPipeline;
    public pipe(fn: PackPipelineFn) {
        this.pipeItems.push(fn);
        return this;
    }

    /**
     * 处理 ts 脚本
     * @param tsConfigFileName 
     * @param sourceMap 是否输出 map
     * @param declaration 是否输出 d.ts 声明文件
     * @returns 
     */
    public ts(tsConfigFileName: string = 'tsconfig.json', sourceMap?: boolean, declaration?: boolean) {
        const instance = PackLoader._instance;
        return this.pipe(files => {
            return instance.compiler.compileTypescipt(files, tsConfigFileName, sourceMap, declaration);
        });
    }

    public sass(options: SassOptions = {}) {
        const instance = PackLoader._instance;
        return this.pipe(files => {
            eachCompileFile(files, file => {
                file.content = instance.compiler.compileSass(file, options);
            });
            return files;
        });
    }

    public output(fileName: string): Promise<boolean> {
        const instance = PackLoader._instance;
        return instance.compileAsync(this.items, this.pipeItems, fileName);
    }
}