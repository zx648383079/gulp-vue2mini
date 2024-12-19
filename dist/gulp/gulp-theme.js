import { Transform } from 'readable-stream';
import { SassCompiler, ThemeStyleCompiler } from '../compiler';
export function gulpTheme(autoDark = true, useVar = false, varPrefix = 'zre') {
    return new Transform({
        objectMode: true,
        transform: (file, _, callback) => {
            if (file.isNull()) {
                return callback();
            }
            if (!file.isBuffer()) {
                return callback();
            }
            const compiler = new ThemeStyleCompiler(autoDark, useVar, varPrefix);
            const content = compiler.renderString(String(file.contents));
            file.contents = Buffer.from(content);
            return callback(undefined, file);
        }
    });
}
export function gulpCssToScss() {
    return new Transform({
        objectMode: true,
        transform: (file, _, callback) => {
            if (file.isNull()) {
                return callback();
            }
            if (!file.isBuffer()) {
                return callback();
            }
            const compiler = new SassCompiler();
            const content = compiler.render(String(file.contents));
            file.contents = Buffer.from(content);
            return callback(undefined, file);
        }
    });
}
