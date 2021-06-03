"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkManager = void 0;
var util_1 = require("./util");
var LinkManager = (function () {
    function LinkManager() {
        this.data = {};
        this.listeners = [];
        this.lockItems = [];
    }
    LinkManager.prototype.trigger = function (key, mtime) {
        var _this = this;
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        if (!Object.prototype.hasOwnProperty.call(this.data, key)) {
            return;
        }
        this.data[key].forEach(function (file) {
            if (!file) {
                return;
            }
            if (_this.lockItems.indexOf(file) >= 0) {
                return;
            }
            _this.lock(file, function () {
                _this.listeners.forEach(function (cb) {
                    cb.apply(void 0, __spreadArray([file, mtime, key], args));
                });
            });
        });
    };
    LinkManager.prototype.on = function (callback) {
        this.listeners.push(callback);
    };
    LinkManager.prototype.push = function (key, file) {
        if (!Object.prototype.hasOwnProperty.call(this.data, key)) {
            this.data[key] = [file];
            return;
        }
        if (this.data[key].indexOf(file) >= 0) {
            return;
        }
        this.data[key].push(file);
    };
    LinkManager.prototype.lock = function (file, cb) {
        if (this.lockItems.indexOf(file) >= 0) {
            return;
        }
        this.lockItems.push(file);
        cb();
        var index = this.lockItems.indexOf(file);
        if (index < 0) {
            return;
        }
        this.lockItems.splice(index, 1);
    };
    LinkManager.prototype.remove = function (key, file) {
        if (!file) {
            this.removeFile(key);
            return;
        }
        if (file === true) {
            this.removeLink(key);
            return;
        }
        if (!Object.prototype.hasOwnProperty.call(this.data, key)) {
            return;
        }
        for (var index = this.data[key].length - 1; index >= 0; index--) {
            if (this.data[key][index] === file) {
                this.data[key].splice(index, 1);
            }
        }
    };
    LinkManager.prototype.removeFile = function (file) {
        if (Object.prototype.hasOwnProperty.call(this.data, file)) {
            delete this.data[file];
        }
        this.removeLink(file);
    };
    LinkManager.prototype.removeLink = function (file) {
        util_1.eachObject(this.data, function (items) {
            for (var index = items.length - 1; index >= 0; index--) {
                if (items[index] === file) {
                    items.splice(index, 1);
                }
            }
        });
    };
    return LinkManager;
}());
exports.LinkManager = LinkManager;
