"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackPipeline = void 0;
const compiler_1 = require("../../compiler");
const register_1 = require("./register");
class PackPipeline {
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
        const instance = register_1.PackLoader._instance;
        return this.pipe(files => {
            return instance.compiler.compileTypescipt(files, tsConfigFileName, sourceMap, declaration);
        });
    }
    sass(options = {}) {
        const instance = register_1.PackLoader._instance;
        return this.pipe(files => {
            (0, compiler_1.eachCompileFile)(files, file => {
                file.content = instance.compiler.compileSass(file, options);
            });
            return files;
        });
    }
    output(fileName) {
        const instance = register_1.PackLoader._instance;
        return instance.compileAsync(this.items, this.pipeItems, fileName);
    }
}
exports.PackPipeline = PackPipeline;
