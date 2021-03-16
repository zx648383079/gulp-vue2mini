"use strict";
exports.__esModule = true;
exports.gulpSass = void 0;
var readable_stream_1 = require("readable-stream");
var compiler_1 = require("../compiler");
var path = require("path");
var gulp_tempate_1 = require("./gulp-tempate");
function gulpSass(options) {
    if (options === void 0) { options = {}; }
    return new readable_stream_1.Transform({
        objectMode: true,
        transform: function (file, _, callback) {
            if (file.isNull()) {
                return callback();
            }
            if (!file.isBuffer()) {
                return callback();
            }
            if (path.basename(file.path).indexOf('_') === 0) {
                return callback();
            }
            var content = compiler_1.Compiler.sass(String(file.contents), file.path, file.extname.substr(1), options);
            file.contents = Buffer.from(content);
            file.path = gulp_tempate_1.renameExt(file.path, 'css');
            return callback(undefined, file);
        }
    });
}
exports.gulpSass = gulpSass;