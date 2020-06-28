"use strict";
exports.__esModule = true;
var fs = require("fs");
var path = require("path");
var chokidar = require("chokidar");
var ui_1 = require("./parser/ui");
var compiler_1 = require("./compiler");
var css_1 = require("./parser/css");
var vue_1 = require("./parser/vue");
var argv_1 = require("./argv");
process.env.INIT_CWD = process.cwd();
var argv = argv_1.formatArgv(process.argv, {
    mini: false,
    watch: false,
    input: 'src',
    output: 'dist'
});
var inputFolder = path.resolve(process.cwd(), argv.params.input);
var outputFolder = path.resolve(process.cwd(), argv.params.output);
var inputState = fs.statSync(inputFolder);
var outputFile = function (file) {
    return path.resolve(outputFolder, path.relative(inputFolder, file));
};
var eachFile = function (folder, cb) {
    var dirInfo = fs.readdirSync(folder);
    dirInfo.forEach(function (item) {
        var location = path.join(folder, item);
        var info = fs.statSync(location);
        if (info.isDirectory()) {
            eachFile(location, cb);
            return;
        }
        cb(location);
    });
};
var mode = argv.params.mini;
var mkIfNotFolder = function (folder) {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }
};
var logFile = function (file) {
    var now = new Date();
    console.log('[' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + ']', path.relative(outputFolder, file), 'Finished');
};
exports.compileHtmlFile = function (src) {
    var ext = path.extname(src);
    var dist = outputFile(src);
    var distFolder = path.dirname(dist);
    var content = '';
    if (ext === '.ts') {
        content = compiler_1.Compiler.ts(fs.readFileSync(src).toString(), src);
        dist = dist.replace(ext, '.js');
    }
    else if (ext === '.scss') {
        content = compiler_1.Compiler.sass(fs.readFileSync(src).toString(), src, 'scss');
        dist = dist.replace(ext, '.css');
    }
    else if (ext === '.sass') {
        content = compiler_1.Compiler.sass(fs.readFileSync(src).toString(), src, 'scss');
        dist = dist.replace(ext, '.css');
    }
    else if (ext === '.html') {
        content = ui_1.renderFile(src);
    }
    else {
        mkIfNotFolder(distFolder);
        fs.copyFileSync(src, dist);
        return;
    }
    if (content.length < 1) {
        return;
    }
    mkIfNotFolder(distFolder);
    fs.writeFileSync(dist, content);
    logFile(dist);
};
exports.compileMiniFile = function (src) {
    var ext = path.extname(src);
    var dist = outputFile(src);
    var distFolder = path.dirname(dist);
    var content = '';
    if (ext === '.ts') {
        content = compiler_1.Compiler.ts(fs.readFileSync(src).toString(), src);
        dist = dist.replace(ext, '.js');
    }
    else if (ext === '.scss') {
        content = compiler_1.Compiler.sass(css_1.preImport(fs.readFileSync(src).toString()), src, 'scss');
        content = css_1.endImport(content);
        content = css_1.replaceTTF(content, path.dirname(src));
        dist = dist.replace(ext, '.wxss');
    }
    else if (ext === '.sass') {
        content = compiler_1.Compiler.sass(css_1.preImport(fs.readFileSync(src).toString()), src, 'sass');
        content = css_1.endImport(content);
        content = css_1.replaceTTF(content, path.dirname(src));
        dist = dist.replace(ext, '.wxss');
    }
    else if (ext === '.html' || ext === '.vue') {
        var data = {};
        var jsonPath = src.replace(ext, '.json');
        if (fs.existsSync(jsonPath)) {
            var json = fs.readFileSync(jsonPath).toString();
            data = json.trim().length > 0 ? JSON.parse(json) : {};
        }
        var res = vue_1.splitFile(fs.readFileSync(src).toString(), ext.substr(1).toLowerCase(), data);
        mkIfNotFolder(distFolder);
        for (var key in res) {
            if (res.hasOwnProperty(key)) {
                var item = res[key];
                if (item.type === 'json') {
                    fs.writeFileSync(dist.replace(ext, '.json'), item.content);
                    continue;
                }
                if (item.type === 'wxml') {
                    fs.writeFileSync(dist.replace(ext, '.wxml'), item.content);
                    continue;
                }
                if (item.type === 'css') {
                    fs.writeFileSync(dist.replace(ext, '.wxss'), item.content);
                    continue;
                }
                if (item.type === 'js') {
                    fs.writeFileSync(dist.replace(ext, '.js'), item.content);
                    continue;
                }
                if (item.type === 'ts') {
                    fs.writeFileSync(dist.replace(ext, '.js'), compiler_1.Compiler.ts(item.content, src));
                    continue;
                }
                if (item.type === 'scss') {
                    content = compiler_1.Compiler.sass(css_1.preImport(item.content), src, 'scss');
                    content = css_1.endImport(content);
                    content = css_1.replaceTTF(content, path.dirname(src));
                    fs.writeFileSync(dist.replace(ext, '.js'), content);
                    continue;
                }
                if (item.type === 'sass') {
                    content = compiler_1.Compiler.sass(css_1.preImport(item.content), src, 'sass');
                    content = css_1.endImport(content);
                    content = css_1.replaceTTF(content, path.dirname(src));
                    fs.writeFileSync(dist.replace(ext, '.js'), content);
                    continue;
                }
            }
        }
        return;
    }
    else if (['.ttf', '.json'].indexOf(ext) >= 0) {
        return;
    }
    else {
        if (ext === '.css') {
            dist = dist.replace(ext, '.wxss');
        }
        mkIfNotFolder(distFolder);
        fs.copyFileSync(src, dist);
        return;
    }
    if (content.length < 1) {
        return;
    }
    mkIfNotFolder(distFolder);
    fs.writeFileSync(dist, content);
    logFile(dist);
};
var compilerFile = mode ? exports.compileMiniFile : exports.compileHtmlFile;
if (inputState.isFile()) {
    compilerFile(inputFolder);
}
else {
    eachFile(inputFolder, compilerFile);
}
if (argv.params.watch) {
    chokidar.watch(inputFolder).on("unlink", function (file) {
        fs.unlinkSync(outputFile(file));
    }).on('add', compilerFile).on('change', compilerFile);
}
