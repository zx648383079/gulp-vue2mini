"use strict";
exports.__esModule = true;
exports.gulpTs = void 0;
var readable_stream_1 = require("readable-stream");
var compiler_1 = require("./compiler");
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
            var content = compiler_1.Compiler.ts(String(file.contents), file.path, tsConfigFileName);
            file.contents = Buffer.from(content);
            return callback(null, file);
        }
    });
}
exports.gulpTs = gulpTs;
;
