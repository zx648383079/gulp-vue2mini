import { Compiler, ModuleFilenameHelpers } from 'webpack';
import { RawSource } from 'webpack-sources';
import { ThemeStyleCompiler } from '../compiler';
import { IThemeObject } from '../parser/template/tokenizer';

const pluginName = 'ZreThemePlugin';

export class ThemePlugin {
    constructor(
        private option: IThemeObject
    ) {
    }

    private readonly compiler = new ThemeStyleCompiler();

    apply(compiler: Compiler) {
        compiler.hooks.compilation.tap(pluginName, compilation => {
            Array.from(compilation.chunks)
            .reduce((acc: string[], chunk) => acc.concat(chunk.files as any || []), [])
            .concat(compilation.additionalChunkAssets || [])
            .filter(ModuleFilenameHelpers.matchObject.bind(null, {test: /\.(js|css|sass|scss|less)(\?.*)?$/i})).forEach(file => {
                const asset = compilation.assets[file];
                const content = this.compiler.formatThemeCss(String(asset.source()), this.option);
                compilation.assets[file] = new RawSource(content) as any;
            });
        });
    }
}