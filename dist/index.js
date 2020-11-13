"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
exports.__esModule = true;
exports.template = void 0;
var gulp_tempate_1 = require("./gulp-tempate");
__exportStar(require("./gulp-sass"), exports);
__exportStar(require("./gulp-ts"), exports);
var gulp_tempate_2 = require("./gulp-tempate");
__createBinding(exports, gulp_tempate_2, "template");
exports["default"] = gulp_tempate_1.template;
