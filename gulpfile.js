import * as gulp from 'gulp';
import ts from 'gulp-typescript';

const tsProject = ts.createProject('tsconfig.json');

gulp.task('default', async() => {
    await gulp.src('src/**/*.ts')
        .pipe(tsProject())
        .on('error', () => {})
        .pipe(gulp.dest('dist/'));
});