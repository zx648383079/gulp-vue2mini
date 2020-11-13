var gulp = require('gulp'),
    rename = require('gulp-rename'),
    ts = require('gulp-typescript'),
    clean = require('gulp-clean'),
    vue2mini = require('gulp-vue2mini'),
    plumber = require('gulp-plumber'),
    tsProject = ts.createProject('tsconfig.json'),
    tsInstance = undefined,
    sassInstance = undefined;

sass.compiler = require('sass');

function getTs() { 
    if (!tsInstance) {
        tsInstance = tsProject();
    }
    return tsInstance;
}

function getSass() { 
    if (!sassInstance) {
        sassInstance = vue2mini.gulpSass();
    }
    return sassInstance;
}

function getSrcPath(src) {
    if (process.argv.length < 4) {
        return src;
    }
    src = process.argv[3].substr(7).replace(__dirname + '\\', '').replace('\\', '/');
    return src;
}

function getDistFolder(dist) {
    if (process.argv.length < 4) {
        return dist;
    }
    dist = 'dist';//process.argv[3].substr(7).replace(__dirname + '\\src', 'dist').replace('\\', '/');
    return dist;
}

function getDistPath(path) {
    path = path.replace(/\\/g, '/');
    return [path, 'dist' + path.match(/src([\/].*?)[^\/]+$/)[1]];
}

function createTak(path, callback) {
    const [src, dist] = getDistPath(path);
    let task = gulp.src(src);
    if (callback) {
        task = callback(task);
    }
    return task.pipe(gulp.dest(dist));
}

function debug(info) {
    console.log('\x1B[32m%s\x1B[39m', info);
    
}

gulp.task('cleanall', function() {
    return gulp.src('dist/*', {read: false})
        .pipe(clean());
});

gulp.task('ts', async() => {
    await gulp.src(getSrcPath('src/**/*.ts'))
        .pipe(vue2mini.template('ts'))
        .pipe(getTs())
        .pipe(gulp.dest(getDistFolder('dist/')));
});

gulp.task('sass', async() => {
    await gulp.src('src/**/*.{scss,sass}')
        .pipe(vue2mini.template('presass'))
        .pipe(getSass())
        .pipe(vue2mini.template('endsass'))
        .pipe(rename({extname: '.wxss'}))
        .pipe(gulp.dest('dist/'));
});


gulp.task('vue', async() => {
    await gulp.src(getSrcPath('src/**/*.{vue,html}'))
        // .pipe(plumber({
        //     errorHandler() {
        //         this.emit('end');
        //     }
        // }))
        .pipe(vue2mini.template('tpl'))
        .pipe(gulp.dest(getDistFolder('dist/')))
        .pipe(vue2mini.template('json'))
        .pipe(gulp.dest(getDistFolder('dist/')))
        .pipe(vue2mini.template('scss'))
        .pipe(vue2mini.template('presass'))
        .pipe(getSass())
        .pipe(vue2mini.template('endsass'))
        .pipe(gulp.dest(getDistFolder('dist/')))
        .pipe(vue2mini.template('ts'))
        .pipe(getTs())
        .pipe(gulp.dest(getDistFolder('dist/')));
});

gulp.task('test', async() => {
    await gulp.src('src/pages/task/detail.vue')
        .pipe(vue2mini.template('json'))
        .pipe(rename({extname: '.json'}))
        .pipe(gulp.dest('dist/'));
});

gulp.task('cleantmp', function() {
    return gulp.src('dist/app.wxml', {read: false})
        .pipe(clean());
});

gulp.task('md5', async() => {
    await gulp.src('node_modules/ts-md5/dist/md5.js')
        .pipe(rename({basename: 'ts-md5'}))
        .pipe(gulp.dest('dist/utils/'));
});

gulp.task('watch', async() => {
    // await gulp.watch('src/**/*.ts', gulp.series('ts'));
    // await gulp.watch('src/**/*.{vue,html}', gulp.series('vue'));
    await gulp.watch(['src/**/*.ts']).on('change', function(path, stats) {
        createTak(path, task => {
            return task.pipe(vue2mini.template('ts'))
            .pipe(getTs())
        }).on('end', () => {
            debug('SUCCESS ' + path);
        });
    });
    await gulp.watch(['src/**/*.json']).on('change', function(path, stats) {
        createTak(path).on('end', () => {
            debug('SUCCESS ' + path);
        });
    });
    await gulp.watch(['src/**/*.{sass,scss}']).on('change', function(path, stats) {
        createTak(path, task => {
            return task.pipe(getSass())
            .pipe(rename({extname: '.wxss'}))
        }).on('end', () => {
            debug('SUCCESS ' + path);
        });
    });

    await gulp.watch(['src/**/*.{vue,html}']).on('change', function(path, stats) {
        const [src, dist] = getDistPath(path);
        gulp.src(src)
            .pipe(vue2mini.template('ts'))
            .pipe(rename({extname: '.ts'}))
            .pipe(getTs())
            .pipe(rename({extname: '.js'}))
            .pipe(gulp.dest(dist));
        gulp.src(src)
            .pipe(vue2mini.template('sass'))
            .pipe(sass())
            .pipe(rename({extname: '.wxss'}))
            .pipe(gulp.dest(dist));
        gulp.src(src)
            .pipe(vue2mini.template('json'))
            .pipe(rename({extname: '.json'}))
            .pipe(gulp.dest(dist));
        gulp.src(src)
            .pipe(vue2mini.template('tpl'))
            .pipe(rename({extname: '.wxml'}))
            .pipe(gulp.dest(dist))
            .on('end', () => {
                debug('SUCCESS ' + path + ' ==> ' + dist)
            });
        
    });
});

gulp.task('default', gulp.series('sass', 'md5', 'ts', async() => {
    await gulp.src('src/**/*.{js,json,wxml,wxss,png,jpg,jpeg}')
            .pipe(gulp.dest('dist/'));
}));