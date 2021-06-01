"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StyleProject = void 0;
var fs = require("fs");
var compiler_1 = require("../../compiler");
var css_1 = require("../css");
var StyleProject = (function (_super) {
    __extends(StyleProject, _super);
    function StyleProject() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    StyleProject.prototype.readyFile = function (src) {
        return new compiler_1.CompliperFile(src.src, src.mtime, this.outputFile(src.src), 'css');
    };
    StyleProject.prototype.compileFile = function (src) {
        var _this = this;
        compiler_1.eachCompileFile(this.readyFile(src), function (file) {
            if (file.type === 'css') {
                fs.writeFileSync(file.dist, css_1.cssToScss(compiler_1.fileContent(file)));
                _this.logFile(src);
            }
        });
    };
    return StyleProject;
}(compiler_1.BaseCompliper));
exports.StyleProject = StyleProject;
