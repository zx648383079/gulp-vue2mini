"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemePlugin = void 0;
var webpack_1 = require("webpack");
var webpack_sources_1 = require("webpack-sources");
var compiler_1 = require("../compiler");
var pluginName = 'ZreThemePlugin';
var ThemePlugin = (function () {
    function ThemePlugin(option) {
        this.option = option;
        this.compiler = new compiler_1.ThemeStyleCompiler();
    }
    ThemePlugin.prototype.apply = function (compiler) {
        var _this = this;
        compiler.hooks.compilation.tap(pluginName, function (compilation) {
            Array.from(compilation.chunks)
                .reduce(function (acc, chunk) { return acc.concat(chunk.files || []); }, [])
                .concat(compilation.additionalChunkAssets || [])
                .filter(webpack_1.ModuleFilenameHelpers.matchObject.bind(null, { test: /\.(js|css|sass|scss|less)(\?.*)?$/i })).forEach(function (file) {
                var asset = compilation.assets[file];
                var content = _this.compiler.formatThemeCss(String(asset.source()), _this.option);
                compilation.assets[file] = new webpack_sources_1.RawSource(content);
            });
        });
    };
    return ThemePlugin;
}());
exports.ThemePlugin = ThemePlugin;
