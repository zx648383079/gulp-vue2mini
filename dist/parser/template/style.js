"use strict";
exports.__esModule = true;
exports.StyleProject = void 0;
var fs = require("fs");
var path = require("path");
var compiler_1 = require("../../compiler");
var css_1 = require("../css");
var StyleProject = (function () {
    function StyleProject(inputFolder, outputFolder, options) {
        this.inputFolder = inputFolder;
        this.outputFolder = outputFolder;
        this.options = options;
    }
    StyleProject.prototype.compileFile = function (src) {
        var dist = this.outputFile(src);
        fs.writeFileSync(dist, css_1.cssToScss(fs.readFileSync(src).toString()));
        this.logFile(src);
    };
    StyleProject.prototype.outputFile = function (file) {
        return path.resolve(this.outputFolder, path.relative(this.inputFolder, file));
    };
    StyleProject.prototype.unlink = function (src) {
        var dist = this.outputFile(src);
        if (fs.existsSync(dist)) {
            fs.unlinkSync(dist);
        }
    };
    StyleProject.prototype.logFile = function (file, tip) {
        if (tip === void 0) { tip = 'Finished'; }
        compiler_1.consoleLog(file, tip, this.inputFolder);
    };
    return StyleProject;
}());
exports.StyleProject = StyleProject;
