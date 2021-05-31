"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptParser = void 0;
var ScriptParser = (function () {
    function ScriptParser(project) {
        this.project = project;
    }
    ScriptParser.prototype.render = function (content) {
        return content;
    };
    return ScriptParser;
}());
exports.ScriptParser = ScriptParser;
