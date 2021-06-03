import { Transform } from 'readable-stream';
import * as vinyl from 'vinyl';
import { PluginCompiler } from '../compiler';
import { renameExt } from './gulp-tempate';
import { transformCallback } from './types';

/**
 * 压缩ts代码
 * @param tsConfigFileName ts 配置文件名
 */
export function gulpTs(tsConfigFileName: string = 'tsconfig.json') {
    return new Transform({
        objectMode: true,
        transform: (file: vinyl, _: any, callback: transformCallback) => {
            if (file.isNull()) {
                return callback();
            }
            if (!file.isBuffer()) {
                return callback();
            }
            const content =  PluginCompiler.ts(String(file.contents), file.path, tsConfigFileName, true);
            file.contents = Buffer.from(content);
            file.path = renameExt(file.path, 'js');
            return callback(undefined, file);
        }
    });
}
