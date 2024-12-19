import { ModuleFilenameHelpers } from 'webpack';
import { RawSource } from 'webpack-sources';
import { ThemeStyleCompiler } from '../compiler';
const pluginName = 'ZreThemePlugin';
export class ThemePlugin {
    option;
    autoDark;
    useVar;
    varPrefix;
    constructor(option, autoDark = true, useVar = false, varPrefix = 'zre') {
        this.option = option;
        this.autoDark = autoDark;
        this.useVar = useVar;
        this.varPrefix = varPrefix;
        this.compiler = new ThemeStyleCompiler(this.autoDark, this.useVar, this.varPrefix);
    }
    compiler;
    apply(compiler) {
        compiler.hooks.compilation.tap(pluginName, compilation => {
            Array.from(compilation.chunks)
                .reduce((acc, chunk) => acc.concat(chunk.files || []), [])
                .concat(compilation.additionalChunkAssets || [])
                .filter(ModuleFilenameHelpers.matchObject.bind(null, { test: /\.(js|css|sass|scss|less)(\?.*)?$/i })).forEach(file => {
                const asset = compilation.assets[file];
                const content = this.compiler.renderString(String(asset.source()), this.option);
                compilation.assets[file] = new RawSource(content);
            });
        });
    }
}
