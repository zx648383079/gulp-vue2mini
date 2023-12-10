"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackLoader = void 0;
const pipeline_1 = require("./pipeline");
class PackLoader {
    static _instance;
    static task(name, cb) {
        if (!this._instance) {
            return;
        }
        this._instance.task(name, cb);
    }
    static series(...names) {
        return () => names;
    }
    static input(...items) {
        return new pipeline_1.PackPipeline(...items);
    }
}
exports.PackLoader = PackLoader;
