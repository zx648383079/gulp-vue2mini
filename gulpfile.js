var gulp = require('gulp'),
    ts = require("gulp-typescript"),
    tsProject = ts.createProject('tsconfig.json');

gulp.task('default', async() => {
    await gulp.src('src/**/*.ts')
        .pipe(tsProject())
        .pipe(gulp.dest('dist/'));
});