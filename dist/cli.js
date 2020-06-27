"use strict";
exports.__esModule = true;
var fs = require("fs");
var path = require("path");
var chokidar = require("chokidar");
var ui_1 = require("./parser/ui");
var compiler_1 = require("./compiler");
var css_1 = require("./parser/css");
var vue_1 = require("./parser/vue");
process.env.INIT_CWD = process.cwd();
var inputFolder = path.resolve(process.cwd(), 'src');
var outputFolder = path.resolve(process.cwd(), 'dist');
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
var mode = process.argv.indexOf('--mini') > 0;
var compileHtmlFile = function (src) {
    var ext = path.extname(src);
    var dist = outputFile(src);
    var distFolder = path.dirname(dist);
    if (!fs.existsSync(distFolder)) {
        fs.mkdirSync(distFolder);
    }
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
        fs.copyFileSync(src, dist);
        return;
    }
    if (content.length < 1) {
        return;
    }
    fs.writeFileSync(dist, content);
};
var compileMiniFile = function (src) {
    var ext = path.extname(src);
    var dist = outputFile(src);
    var distFolder = path.dirname(dist);
    if (!fs.existsSync(distFolder)) {
        fs.mkdirSync(distFolder);
    }
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
        fs.copyFileSync(src, dist);
        return;
    }
    if (content.length < 1) {
        return;
    }
    fs.writeFileSync(dist, content);
};
var compilerFile = mode ? compileMiniFile : compileHtmlFile;
eachFile(inputFolder, compilerFile);
if (process.argv.indexOf('--watch') > 0) {
    chokidar.watch(inputFolder).on("unlink", function (file) {
        fs.unlinkSync(outputFile(file));
    }).on('add', compilerFile).on('change', compilerFile);
}
