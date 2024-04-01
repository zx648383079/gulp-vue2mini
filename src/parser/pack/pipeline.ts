import { CompilerFile, PluginCompiler, SassOptions } from '../../compiler';
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

    public ts(tsConfigFileName: string = 'tsconfig.json', sourceMap = true) {
        const instance = PackLoader._instance;
        this.pipeItems.push(file => {
            return PluginCompiler.ts(instance.readSync(file), file.src, tsConfigFileName, sourceMap);
        });
        return this;
    }

    public sass(options: SassOptions = {}) {
        const instance = PackLoader._instance;
        this.pipeItems.push(file => {
            return PluginCompiler.sass(instance.readSync(file), file.src, file.extname.substring(1), options);
        });
        return this;
    }

    public output(fileName: string): Promise<boolean> {
        const instance = PackLoader._instance;
        return instance.compileAsync(this.items, this.pipeItems, fileName);
    }
}