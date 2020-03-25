"use strict";
exports.__esModule = true;
var CacheManger = (function () {
    function CacheManger() {
        this.data = {};
    }
    CacheManger.prototype.has = function (key) {
        return this.data.hasOwnProperty(key);
    };
    CacheManger.prototype.get = function (key) {
        return this.has(key) ? this.data[key] : undefined;
    };
    CacheManger.prototype.set = function (key, data) {
        this.data[key] = data;
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
