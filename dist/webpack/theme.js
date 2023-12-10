"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemePlugin = void 0;
const webpack_1 = require("webpack");
const webpack_sources_1 = require("webpack-sources");
const compiler_1 = require("../compiler");
const pluginName = 'ZreThemePlugin';
class ThemePlugin {
    option;
    autoDark;
    useVar;
    varPrefix;
    constructor(option, autoDark = true, useVar = false, varPrefix = 'zre') {
        this.option = option;
        this.autoDark = autoDark;
        this.useVar = useVar;
        this.varPrefix = varPrefix;
        this.compiler = new compiler_1.ThemeStyleCompiler(this.autoDark, this.useVar, this.varPrefix);
    }
    compiler;
    apply(compiler) {
        compiler.hooks.compilation.tap(pluginName, compilation => {
            Array.from(compilation.chunks)
                .reduce((acc, chunk) => acc.concat(chunk.files || []), [])
                .concat(compilation.additionalChunkAssets || [])
                .filter(webpack_1.ModuleFilenameHelpers.matchObject.bind(null, { test: /\.(js|css|sass|scss|less)(\?.*)?$/i })).forEach(file => {
                const asset = compilation.assets[file];
                const content = this.compiler.renderString(String(asset.source()), this.option);
                compilation.assets[file] = new webpack_sources_1.RawSource(content);
            });
        });
    }
}
exports.ThemePlugin = ThemePlugin;
