"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonParser = void 0;
var JsonParser = (function () {
    function JsonParser(_) {
    }
    JsonParser.prototype.render = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return JSON.stringify(this.merge.apply(this, args));
    };
    JsonParser.prototype.merge = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var items = [];
        for (var _a = 0, args_1 = args; _a < args_1.length; _a++) {
            var item = args_1[_a];
            if (!item) {
                continue;
            }
            if (typeof item === 'object') {
                items.push(item);
                continue;
            }
            if (typeof item !== 'string') {
                continue;
            }
            var res = eval(item.trim());
            if (typeof res === 'object') {
                items.push(res);
            }
        }
        if (items.length < 1) {
            return {};
        }
        return Object.assign.apply(Object, __spreadArray([{}], items, false));
    };
    return JsonParser;
}());
exports.JsonParser = JsonParser;
