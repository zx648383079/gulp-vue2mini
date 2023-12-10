var loader = require('./dist').PackLoader;

loader.task('default', async () => {
    await loader.input('src/**/*.ts')
    .ts()
    .output('dist/');
});