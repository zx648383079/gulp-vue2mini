import { CompilerFile, SassOptions } from '../../compiler';
export type PackPipelineFunc = (files: CompilerFile[]) => CompilerFile[];
export interface PackPipelineTransform {
    transform(file: CompilerFile): string | CompilerFile | null | undefined;
}
export type PackPipelineFn = PackPipelineFunc | PackPipelineTransform;
export declare class PackPipeline {
    constructor(...items: string[]);
    private items;
    private pipeItems;
    input(...items: string[]): this;
    pipe(fn: PackPipelineFunc): PackPipeline;
    pipe(transform: PackPipelineTransform): PackPipeline;
    ts(tsConfigFileName?: string, sourceMap?: boolean, declaration?: boolean): PackPipeline;
    sass(options?: SassOptions): PackPipeline;
    output(fileName: string): Promise<boolean>;
}
