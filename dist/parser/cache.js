"use strict";
exports.__esModule = true;
exports.CacheManger = void 0;
var CacheManger = (function () {
    function CacheManger() {
        this.data = {};
    }
    CacheManger.prototype.has = function (key, time) {
        if (time === void 0) { time = 0; }
        return this.data.hasOwnProperty(key) && (time === 0 || this.data[key].time >= time);
    };
    CacheManger.prototype.get = function (key) {
        return this.has(key) ? this.data[key].data : undefined;
    };
    CacheManger.prototype.set = function (key, data, time) {
        if (time === void 0) { time = 0; }
        this.data[key] = {
            data: data,
            time: time
        };
        return this;
    };
    CacheManger.prototype["delete"] = function () {
        var keys = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            keys[_i] = arguments[_i];
        }
        for (var _a = 0, keys_1 = keys; _a < keys_1.length; _a++) {
            var key = keys_1[_a];
            delete this.data[key];
        }
        return this;
    };
    CacheManger.prototype.clear = function () {
        this.data = {};
        return this;
    };
    return CacheManger;
}());
exports.CacheManger = CacheManger;
