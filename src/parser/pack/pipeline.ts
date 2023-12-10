import { CompilerFile, PluginCompiler, fileContent } from '../../compiler';
import { PackLoader } from './register';

export type PackPipelineFunc = (file: CompilerFile) => string|CompilerFile|null|undefined;

export class PackPipeline {
    constructor(...items: string[]) {
        this.items = items;
    }

    private items: string[] = [];
    private pipeItems: PackPipelineFunc[] = [];

    public input(...items: string[]) {
        this.items.push(...items);
        return this;
    }

    public pipe(fn: PackPipelineFunc) {
        this.pipeItems.push(fn);
        return this;
    }

    public ts() {
        this.pipeItems.push(file => {
            return PluginCompiler.ts(fileContent(file), file.src);
        });
        return this;
    }

    public sass() {
        this.pipeItems.push(file => {
            return PluginCompiler.sass(fileContent(file), file.src);
        });
        return this;
    }

    public output(fileName: string): Promise<boolean> {
        const instance = PackLoader._instance;
        return instance.compileAsync(this.items, this.pipeItems, fileName);
    }
}