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
    ts(tsConfigFileName = 'tsconfig.json', sourceMap = true) {
        this.pipeItems.push(file => {
            return compiler_1.PluginCompiler.ts((0, compiler_1.fileContent)(file), file.src, tsConfigFileName, sourceMap);
        });
        return this;
    }
    sass(options = {}) {
        this.pipeItems.push(file => {
            return compiler_1.PluginCompiler.sass((0, compiler_1.fileContent)(file), file.src, file.extname.substring(1), options);
        });
        return this;
    }
    output(fileName) {
        const instance = register_1.PackLoader._instance;
        return instance.compileAsync(this.items, this.pipeItems, fileName);
    }
}
exports.PackPipeline = PackPipeline;
