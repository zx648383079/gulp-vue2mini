import { Transform } from "readable-stream";
import * as vinyl from "vinyl";
import { Compiler } from "./compiler";
import * as sass from "sass";
import * as path from 'path';
import { renameExt } from "./gulp-tempate";

/**
 * 压缩sass代码
 */
export function gulpSass(options: sass.Options = {}) {
    return new Transform({
        objectMode: true,
        transform: function (file: vinyl, _: any, callback: Function) {
            if (file.isNull()) {
                return callback();
            }
            if (!file.isBuffer()) {
                return callback();
            }
            if (path.basename(file.path).indexOf('_') === 0) {
                return callback();
            }
            const content =  Compiler.sass(String(file.contents), file.path, file.extname.substr(1), options);
            file.contents = Buffer.from(content);
            file.path = renameExt(file.path, 'css');
            return callback(null, file);
        }
    });
};