"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gulpTs = void 0;
const readable_stream_1 = require("readable-stream");
const compiler_1 = require("../compiler");
const gulp_tempate_1 = require("./gulp-tempate");
function gulpTs(tsConfigFileName = 'tsconfig.json') {
    return new readable_stream_1.Transform({
        objectMode: true,
        transform: (file, _, callback) => {
            if (file.isNull()) {
                return callback();
            }
            if (!file.isBuffer()) {
                return callback();
            }
            const content = compiler_1.PluginCompiler.ts(String(file.contents), file.path, tsConfigFileName, true);
            file.contents = Buffer.from(content);
            file.path = (0, gulp_tempate_1.renameExt)(file.path, 'js');
            return callback(undefined, file);
        }
    });
}
exports.gulpTs = gulpTs;
