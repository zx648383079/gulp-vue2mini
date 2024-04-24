var loader = require('./dist').PackLoader;

loader.task('test', async () => {
    await loader.input('src/test.ts')
    .ts(undefined, false, false)
    .output('dist/test.ts');
});

loader.task('default', async () => {
    await loader.input('src/**/*.ts')
    .ts()
    .output('dist/**/');
});