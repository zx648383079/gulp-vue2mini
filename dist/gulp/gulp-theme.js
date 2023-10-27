"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gulpCssToScss = exports.gulpTheme = void 0;
var readable_stream_1 = require("readable-stream");
var compiler_1 = require("../compiler");
function gulpTheme(autoDark, useVar, varPrefix) {
    if (autoDark === void 0) { autoDark = true; }
    if (useVar === void 0) { useVar = false; }
    if (varPrefix === void 0) { varPrefix = 'zre'; }
    return new readable_stream_1.Transform({
        objectMode: true,
        transform: function (file, _, callback) {
            if (file.isNull()) {
                return callback();
            }
            if (!file.isBuffer()) {
                return callback();
            }
            var compiler = new compiler_1.ThemeStyleCompiler(autoDark, useVar, varPrefix);
            var content = compiler.renderString(String(file.contents));
            file.contents = Buffer.from(content);
            return callback(undefined, file);
        }
    });
}
exports.gulpTheme = gulpTheme;
function gulpCssToScss() {
    return new readable_stream_1.Transform({
        objectMode: true,
        transform: function (file, _, callback) {
            if (file.isNull()) {
                return callback();
            }
            if (!file.isBuffer()) {
                return callback();
            }
            var compiler = new compiler_1.SassCompiler();
            var content = compiler.render(String(file.contents));
            file.contents = Buffer.from(content);
            return callback(undefined, file);
        }
    });
}
exports.gulpCssToScss = gulpCssToScss;
