"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineIterator = void 0;
var util_1 = require("../util/util");
var LineIterator = (function () {
    function LineIterator(content) {
        this.index = -1;
        this.lines = content instanceof Array ? content : util_1.splitLine(content);
    }
    Object.defineProperty(LineIterator.prototype, "length", {
        get: function () {
            return this.lines.length;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LineIterator.prototype, "position", {
        get: function () {
            return this.index;
        },
        set: function (i) {
            if (i < -1) {
                i = -1;
            }
            else if (i > this.length) {
                i = this.length;
            }
            this.index = i;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LineIterator.prototype, "canNext", {
        get: function () {
            return this.position < this.length - 1;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LineIterator.prototype, "canBack", {
        get: function () {
            return this.position > 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LineIterator.prototype, "current", {
        get: function () {
            return this.lines[this.position];
        },
        enumerable: false,
        configurable: true
    });
    LineIterator.prototype.moveNext = function () {
        if (!this.canNext) {
            return false;
        }
        this.position++;
        return true;
    };
    LineIterator.prototype.moveBack = function () {
        if (!this.canBack) {
            return false;
        }
        this.position--;
        return true;
    };
    LineIterator.prototype.reset = function () {
        this.position = -1;
    };
    LineIterator.prototype.nextIs = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        if (!this.canNext) {
            return false;
        }
        var i = this.lines[this.position + 1];
        for (var _a = 0, items_1 = items; _a < items_1.length; _a++) {
            var item = items_1[_a];
            if (i.indexOf(item) >= 0) {
                return true;
            }
        }
        return false;
    };
    LineIterator.prototype.read = function (length, offset) {
        if (length === void 0) { length = 1; }
        if (offset === void 0) { offset = 0; }
        if (length === 0) {
            return '';
        }
        var pos = (length < 0 ? this.position + length : this.position) + offset;
        if (pos > this.length - 1) {
            return undefined;
        }
        var len = length < 0 ? -length : length;
        return this.lines.slice(pos, pos + len);
    };
    LineIterator.prototype.move = function (length) {
        if (length === void 0) { length = 1; }
        this.position += length;
    };
    LineIterator.prototype.indexOf = function (code, offset) {
        if (offset === void 0) { offset = 1; }
        for (var i = this.position + offset; i < this.length; i++) {
            if (this.lines[i].indexOf(code) >= 0) {
                return i;
            }
        }
        return -1;
    };
    LineIterator.prototype.forEach = function (cb) {
        while (this.moveNext()) {
            if (cb(this.current, this.position) === false) {
                break;
            }
        }
    };
    return LineIterator;
}());
exports.LineIterator = LineIterator;
