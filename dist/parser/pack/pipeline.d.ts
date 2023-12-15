import { CompilerFile, SassOptions } from '../../compiler';
export type PackPipelineFunc = (file: CompilerFile) => string | CompilerFile | null | undefined;
export declare class PackPipeline {
    constructor(...items: string[]);
    private items;
    private pipeItems;
    input(...items: string[]): this;
    pipe(fn: PackPipelineFunc): this;
    ts(tsConfigFileName?: string, sourceMap?: boolean): this;
    sass(options?: SassOptions): this;
    output(fileName: string): Promise<boolean>;
}
