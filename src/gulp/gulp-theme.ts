import { Transform } from 'readable-stream';
import * as vinyl from 'vinyl';
import { transformCallback } from './types';
import { cssToScss, formatThemeCss } from '../parser/css';

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
            const content = formatThemeCss(String(file.contents));
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
            const content = cssToScss(String(file.contents));
            file.contents = Buffer.from(content);
            return callback(undefined, file);
        }
    });
}
