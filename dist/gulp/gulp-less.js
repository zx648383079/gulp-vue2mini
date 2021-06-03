"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gulpLess = void 0;
var readable_stream_1 = require("readable-stream");
var compiler_1 = require("../compiler");
var gulp_tempate_1 = require("./gulp-tempate");
function gulpLess(options) {
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
            compiler_1.PluginCompiler.less(String(file.contents), file.path, options).then(function (content) {
                file.contents = Buffer.from(content);
                file.path = gulp_tempate_1.renameExt(file.path, 'css');
                callback(undefined, file);
            }).catch(function (err) {
                err.lineNumber = err.line;
                err.fileName = err.filename;
                err.message = err.message + ' in file ' + err.fileName + ' line no. ' + err.lineNumber;
                return callback({
                    name: 'vue2mini',
                    message: err
                });
            });
        }
    });
}
exports.gulpLess = gulpLess;
