import { Transform } from 'readable-stream';
import * as vinyl from 'vinyl';
import { Compiler } from '../compiler';
import { renameExt } from './gulp-tempate';
import { transformCallback } from './types';

/**
 * 压缩less代码
 */
export function gulpLess(options: Less.Options = {}) {
    return new Transform({
        objectMode: true,
        transform: (file: vinyl, _: any, callback: transformCallback) => {
            if (file.isNull()) {
                return callback();
            }
            if (!file.isBuffer()) {
                return callback();
            }
            Compiler.less(String(file.contents), file.path, options).then(content => {
                file.contents = Buffer.from(content);
                file.path = renameExt(file.path, 'css');
                callback(undefined, file);
            }).catch(err => {
                err.lineNumber = err.line;
                err.fileName = err.filename;
          
                // Add a better error message
                err.message = err.message + ' in file ' + err.fileName + ' line no. ' + err.lineNumber;
                return callback({
                    name: 'vue2mini',
                    message: err
                });
            });
        }
    });
}
