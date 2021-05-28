"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var chokidar = require("chokidar");
var project_1 = require("./parser/template/project");
var project_2 = require("./parser/mini/project");
var argv_1 = require("./argv");
var style_1 = require("./parser/template/style");
process.env.INIT_CWD = process.cwd();
var argv = argv_1.formatArgv(process.argv, {
    mini: false,
    css: false,
    theme: false,
    watch: false,
    help: false,
    input: 'src',
    output: 'dist'
});
var helpText = "\nUsage: vue2mini <command>\n    --mini \u7F16\u8BD1\u5C0F\u7A0B\u5E8F\n    --theme \u7F16\u8BD1\u6A21\u677F\n    --css \u8F6Ccss\u4E3Ascss\n    --help \u5E2E\u52A9\n    --input \u6E90\u7801\u6587\u4EF6\u6216\u6587\u4EF6\u5939\uFF0C\u9ED8\u8BA4\u4E3Asrc\n    --output \u7F16\u8BD1\u540E\u4FDD\u5B58\u7684\u6587\u4EF6\u5939\uFF0C\u9ED8\u8BA4\u4E3Adist\n    --min \u538B\u7F29ts\u548Csass \u751F\u6210\u7684\u6587\u4EF6\u4EE3\u7801\uFF0C\u4EC5\u5BF9\u6A21\u677F\u6709\u6548\n    --watch \u76D1\u542C\u811A\u672C\u53D8\u52A8\uFF0C\u81EA\u52A8\u5904\u7406\n\nExample:\n    vue2mini --mini --input=src --output=dist\n\n";
if (argv.params.help) {
    console.log(helpText);
    process.exit(0);
}
var input = path.resolve(process.cwd(), argv.params.input);
var outputFolder = path.resolve(process.cwd(), argv.params.output);
if (!fs.existsSync(input)) {
    console.log('File [' + input + '] not found!');
    process.exit(0);
}
var inputState = fs.statSync(input);
var inputFolder = inputState.isDirectory() ? input : path.dirname(input);
var createProject = function () {
    if (argv.params.mini) {
        return new project_2.MiniProject(inputFolder, outputFolder, argv.params);
    }
    if (argv.params.theme) {
        return new project_1.TemplateProject(inputFolder, outputFolder, argv.params);
    }
    if (argv.params.css) {
        return new style_1.StyleProject(inputFolder, outputFolder, argv.params);
    }
    return undefined;
};
var project = createProject();
if (!project) {
    console.log(helpText);
    process.exit(0);
}
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
        project === null || project === void 0 ? void 0 : project.compileFile(src);
    }
    catch (error) {
        project === null || project === void 0 ? void 0 : project.logFile(src, ' Failure \n' + error.message);
    }
};
if (argv.params.watch) {
    chokidar.watch(inputFolder).on('unlink', function (file) {
        project === null || project === void 0 ? void 0 : project.unlink(file);
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
