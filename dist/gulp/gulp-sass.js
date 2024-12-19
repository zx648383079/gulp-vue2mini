import { Transform } from 'readable-stream';
import * as path from 'path';
import { renameExt } from './gulp-tempate';
import { PluginCompiler } from '../compiler';
export function gulpSass(options = {}) {
    return new Transform({
        objectMode: true,
        transform: (file, _, callback) => {
            if (file.isNull()) {
                return callback();
            }
            if (!file.isBuffer()) {
                return callback();
            }
            if (path.basename(file.path).indexOf('_') === 0) {
                return callback();
            }
            const content = PluginCompiler.sass(String(file.contents), file.path, file.extname.substring(1), options);
            file.contents = Buffer.from(content);
            file.path = renameExt(file.path, 'css');
            return callback(undefined, file);
        }
    });
}
