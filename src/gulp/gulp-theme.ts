import { Transform } from 'readable-stream';
import * as vinyl from 'vinyl';
import { SassCompiler, ThemeStyleCompiler } from '../compiler';
import { transformCallback } from './types';

/**
 * 处理样式的多主题支持
 */
export function gulpTheme() {
    return new Transform({
        objectMode: true,
        transform: (file: vinyl, _: any, callback: transformCallback) => {
            if (file.isNull()) {
                return callback();
            }
            if (!file.isBuffer()) {
                return callback();
            }
            const compiler = new ThemeStyleCompiler();
            const content = compiler.formatThemeCss(String(file.contents));
            file.contents = Buffer.from(content);
            return callback(undefined, file);
        }
    });
}

/**
 * 支持css 转 scss
 * @returns 
 */
export function gulpCssToScss() {
    return new Transform({
        objectMode: true,
        transform: (file: vinyl, _: any, callback: transformCallback) => {
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
