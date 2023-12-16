export * from './parser/pack/register';
try {
    require.resolve('readable-stream');
    const gulp_1 = require('./gulp');
    for (const key in gulp_1) {
        if (Object.prototype.hasOwnProperty.call(gulp_1, key)) {
            exports[key] = gulp_1[key];
        }
    }
    exports.default = gulp_1.template;
} catch {}


