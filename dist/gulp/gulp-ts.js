"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gulpTs = void 0;
var readable_stream_1 = require("readable-stream");
var compiler_1 = require("../compiler");
var gulp_tempate_1 = require("./gulp-tempate");
function gulpTs(tsConfigFileName) {
    if (tsConfigFileName === void 0) { tsConfigFileName = 'tsconfig.json'; }
    return new readable_stream_1.Transform({
        objectMode: true,
        transform: function (file, _, callback) {
            if (file.isNull()) {
                return callback();
            }
            if (!file.isBuffer()) {
                return callback();
            }
            var content = compiler_1.PluginCompiler.ts(String(file.contents), file.path, tsConfigFileName, true);
            file.contents = Buffer.from(content);
            file.path = gulp_tempate_1.renameExt(file.path, 'js');
            return callback(undefined, file);
        }
    });
}
exports.gulpTs = gulpTs;
