import { Transform } from 'readable-stream';
import { PluginCompiler } from '../compiler';
import { renameExt } from './gulp-tempate';
export function gulpLess(options = {}) {
    return new Transform({
        objectMode: true,
        transform: (file, _, callback) => {
            if (file.isNull()) {
                return callback();
            }
            if (!file.isBuffer()) {
                return callback();
            }
            PluginCompiler.less(String(file.contents), file.path, options).then(content => {
                file.contents = Buffer.from(content);
                file.path = renameExt(file.path, 'css');
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
