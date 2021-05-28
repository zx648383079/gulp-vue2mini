"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gulpCssToScss = exports.gulpTheme = void 0;
var readable_stream_1 = require("readable-stream");
var css_1 = require("../parser/css");
function gulpTheme() {
    return new readable_stream_1.Transform({
        objectMode: true,
        transform: function (file, _, callback) {
            if (file.isNull()) {
                return callback();
            }
            if (!file.isBuffer()) {
                return callback();
            }
            var content = css_1.formatThemeCss(String(file.contents));
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
            var content = css_1.cssToScss(String(file.contents));
            file.contents = Buffer.from(content);
            return callback(undefined, file);
        }
    });
}
exports.gulpCssToScss = gulpCssToScss;
