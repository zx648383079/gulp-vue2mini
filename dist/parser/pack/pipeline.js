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
        const instance = register_1.PackLoader._instance;
        this.pipeItems.push(file => {
            return compiler_1.PluginCompiler.ts(instance.readSync(file), file.src, tsConfigFileName, sourceMap);
        });
        return this;
    }
    sass(options = {}) {
        const instance = register_1.PackLoader._instance;
        this.pipeItems.push(file => {
            return compiler_1.PluginCompiler.sass(instance.readSync(file), file.src, file.extname.substring(1), options);
        });
        return this;
    }
    output(fileName) {
        const instance = register_1.PackLoader._instance;
        return instance.compileAsync(this.items, this.pipeItems, fileName);
    }
}
exports.PackPipeline = PackPipeline;
