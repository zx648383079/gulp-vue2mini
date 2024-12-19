"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gulpTheme = gulpTheme;
exports.gulpCssToScss = gulpCssToScss;
const readable_stream_1 = require("readable-stream");
const compiler_1 = require("../compiler");
function gulpTheme(autoDark = true, useVar = false, varPrefix = 'zre') {
    return new readable_stream_1.Transform({
        objectMode: true,
        transform: (file, _, callback) => {
            if (file.isNull()) {
                return callback();
            }
            if (!file.isBuffer()) {
                return callback();
            }
            const compiler = new compiler_1.ThemeStyleCompiler(autoDark, useVar, varPrefix);
            const content = compiler.renderString(String(file.contents));
            file.contents = Buffer.from(content);
            return callback(undefined, file);
        }
    });
}
function gulpCssToScss() {
    return new readable_stream_1.Transform({
        objectMode: true,
        transform: (file, _, callback) => {
            if (file.isNull()) {
                return callback();
            }
            if (!file.isBuffer()) {
                return callback();
            }
            const compiler = new compiler_1.SassCompiler();
            const content = compiler.render(String(file.contents));
            file.contents = Buffer.from(content);
            return callback(undefined, file);
        }
    });
}
