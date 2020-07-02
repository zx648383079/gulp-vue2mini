"use strict";
exports.__esModule = true;
var fs = require("fs");
var path = require("path");
var chokidar = require("chokidar");
var ui_1 = require("./parser/ui");
var compiler_1 = require("./compiler");
var argv_1 = require("./argv");
process.env.INIT_CWD = process.cwd();
var argv = argv_1.formatArgv(process.argv, {
    mini: false,
    watch: false,
    input: 'src',
    output: 'dist'
});
var input = path.resolve(process.cwd(), argv.params.input);
var outputFolder = path.resolve(process.cwd(), argv.params.output);
var inputState = fs.statSync(input);
var inputFolder = inputState.isDirectory() ? input : path.dirname(input);
var compiler = argv.params.mini ? new compiler_1.MiniCompliper(inputFolder, outputFolder, argv.params) : new ui_1.UiCompliper(inputFolder, outputFolder, argv.params);
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
var compilerFile = function (src) {
    try {
        compiler.compileFile(src);
    }
    catch (error) {
        compiler.logFile(src, ' Failure \n' + error.message);
    }
};
if (argv.params.watch) {
    chokidar.watch(inputFolder).on("unlink", function (file) {
        var dist = compiler.outputFile(file);
        if (fs.existsSync(dist)) {
            fs.unlinkSync(dist);
        }
    }).on('add', compilerFile).on('change', compilerFile);
}
else {
    if (inputState.isFile()) {
        compilerFile(input);
    }
    else {
        eachFile(inputFolder, compilerFile);
    }
}
