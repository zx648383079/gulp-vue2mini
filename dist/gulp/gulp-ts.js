import { Transform } from 'readable-stream';
import { PluginCompiler } from '../compiler';
import { renameExt } from './gulp-tempate';
export function gulpTs(tsConfigFileName = 'tsconfig.json') {
    return new Transform({
        objectMode: true,
        transform: (file, _, callback) => {
            if (file.isNull()) {
                return callback();
            }
            if (!file.isBuffer()) {
                return callback();
            }
            const content = PluginCompiler.ts(String(file.contents), file.path, tsConfigFileName, true);
            file.contents = Buffer.from(content);
            file.path = renameExt(file.path, 'js');
            return callback(undefined, file);
        }
    });
}
