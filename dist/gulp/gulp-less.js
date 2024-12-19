"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gulpLess = gulpLess;
const readable_stream_1 = require("readable-stream");
const compiler_1 = require("../compiler");
const gulp_tempate_1 = require("./gulp-tempate");
function gulpLess(options = {}) {
    return new readable_stream_1.Transform({
        objectMode: true,
        transform: (file, _, callback) => {
            if (file.isNull()) {
                return callback();
            }
            if (!file.isBuffer()) {
                return callback();
            }
            compiler_1.PluginCompiler.less(String(file.contents), file.path, options).then(content => {
                file.contents = Buffer.from(content);
                file.path = (0, gulp_tempate_1.renameExt)(file.path, 'css');
                callback(undefined, file);
            }).catch(err => {
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
