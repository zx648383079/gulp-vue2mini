import { Transform } from "readable-stream";
import * as vinyl from "vinyl";
import { Compiler } from "./compiler";
import { renameExt } from "./gulp-tempate";

/**
 * 压缩ts代码
 * @param tsConfigFileName 
 */
export function gulpTs(tsConfigFileName: string = 'tsconfig.json') {
    return new Transform({
        objectMode: true,
        transform: function (file: vinyl, _: any, callback: Function) {
            if (file.isNull()) {
                return callback();
            }
            if (!file.isBuffer()) {
                return callback();
            }
            const content =  Compiler.ts(String(file.contents), file.path, tsConfigFileName);
            file.contents = Buffer.from(content);
            file.path = renameExt(file.path, 'js');
            return callback(null, file);
        }
    });
};