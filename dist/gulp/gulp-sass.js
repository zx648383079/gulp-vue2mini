"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gulpSass = gulpSass;
const readable_stream_1 = require("readable-stream");
const path = require("path");
const gulp_tempate_1 = require("./gulp-tempate");
const compiler_1 = require("../compiler");
function gulpSass(options = {}) {
    return new readable_stream_1.Transform({
        objectMode: true,
        transform: (file, _, callback) => {
            if (file.isNull()) {
                return callback();
            }
            if (!file.isBuffer()) {
                return callback();
            }
            if (path.basename(file.path).indexOf('_') === 0) {
                return callback();
            }
            const content = compiler_1.PluginCompiler.sass(String(file.contents), file.path, file.extname.substring(1), options);
            file.contents = Buffer.from(content);
            file.path = (0, gulp_tempate_1.renameExt)(file.path, 'css');
            return callback(undefined, file);
        }
    });
}
