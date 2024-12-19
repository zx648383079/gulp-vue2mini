import { eachCompileFile } from '../../compiler';
import { PackLoader } from './register';
export class PackPipeline {
    constructor(...items) {
        this.items = items;
    }
    items = [];
    pipeItems = [];
    input(...items) {
        this.items.push(...items);
        return this;
    }
    pipe(fn) {
        this.pipeItems.push(fn);
        return this;
    }
    ts(tsConfigFileName = 'tsconfig.json', sourceMap, declaration) {
        const instance = PackLoader._instance;
        return this.pipe(files => {
            return instance.compiler.compileTypescipt(files, tsConfigFileName, sourceMap, declaration);
        });
    }
    sass(options = {}) {
        const instance = PackLoader._instance;
        return this.pipe(files => {
            eachCompileFile(files, file => {
                file.content = instance.compiler.compileSass(file, options);
            });
            return files;
        });
    }
    output(fileName) {
        const instance = PackLoader._instance;
        return instance.compileAsync(this.items, this.pipeItems, fileName);
    }
}
