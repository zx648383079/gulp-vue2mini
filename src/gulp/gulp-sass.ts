import { Transform } from 'readable-stream';
import * as vinyl from 'vinyl';
import * as sass from 'sass';
import * as path from 'path';
import { renameExt } from './gulp-tempate';
import { transformCallback } from './types';
import { PluginCompiler } from '../compiler';

/**
 * 压缩sass代码
 */
export function gulpSass(options: sass.StringOptions<'sync'> = {}) {
    return new Transform({
        objectMode: true,
        transform: (file: vinyl, _: any, callback: transformCallback) => {
            if (file.isNull()) {
                return callback();
            }
            if (!file.isBuffer()) {
                return callback();
            }
            if (path.basename(file.path).indexOf('_') === 0) {
                return callback();
            }
            const content =  PluginCompiler.sass(String(file.contents), file.path, file.extname.substring(1), options);
            file.contents = Buffer.from(content);
            file.path = renameExt(file.path, 'css');
            return callback(undefined, file);
        }
    });
}
