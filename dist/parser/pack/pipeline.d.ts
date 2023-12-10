import { CompilerFile } from '../../compiler';
export type PackPipelineFunc = (file: CompilerFile) => string | CompilerFile | null | undefined;
export declare class PackPipeline {
    constructor(...items: string[]);
    private items;
    private pipeItems;
    input(...items: string[]): this;
    pipe(fn: PackPipelineFunc): this;
    ts(): this;
    sass(): this;
    output(fileName: string): Promise<boolean>;
}
