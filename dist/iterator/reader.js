"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReaderIterator = void 0;
var ReaderIterator = (function () {
    function ReaderIterator(reader) {
        this.reader = reader;
        this.index = -1;
    }
    Object.defineProperty(ReaderIterator.prototype, "length", {
        get: function () {
            return this.reader.length;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ReaderIterator.prototype, "position", {
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
    Object.defineProperty(ReaderIterator.prototype, "canNext", {
        get: function () {
            return this.position < this.length - 1;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ReaderIterator.prototype, "canBack", {
        get: function () {
            return this.position > 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ReaderIterator.prototype, "current", {
        get: function () {
            return this.reader.read(this.position);
        },
        enumerable: false,
        configurable: true
    });
    ReaderIterator.prototype.moveNext = function () {
        if (!this.canNext) {
            return false;
        }
        this.position++;
        return true;
    };
    ReaderIterator.prototype.moveBack = function () {
        if (!this.canBack) {
            return false;
        }
        this.position--;
        return true;
    };
    ReaderIterator.prototype.reset = function () {
        this.position = -1;
    };
    ReaderIterator.prototype.nextIs = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        if (!this.canNext) {
            return false;
        }
        var i = this.reader.read(this.position + 1);
        for (var _a = 0, items_1 = items; _a < items_1.length; _a++) {
            var item = items_1[_a];
            if (item === i) {
                return true;
            }
        }
        return false;
    };
    ReaderIterator.prototype.read = function (length, offset) {
        if (length === void 0) { length = 1; }
        if (offset === void 0) { offset = 0; }
        if (length === 0) {
            return null;
        }
        var pos = (length < 0 ? this.position + length : this.position) + offset;
        if (pos > this.length - 1) {
            return undefined;
        }
        var len = length < 0 ? -length : length;
        return this.reader.read(pos, len);
    };
    ReaderIterator.prototype.move = function (length) {
        if (length === void 0) { length = 1; }
        this.position += length;
    };
    ReaderIterator.prototype.indexOf = function (code, offset) {
        if (offset === void 0) { offset = 1; }
        return this.reader.indexOf(code, this.position + offset);
    };
    ReaderIterator.prototype.forEach = function (cb) {
        while (this.moveNext()) {
            if (cb(this.current, this.position) === false) {
                break;
            }
        }
    };
    return ReaderIterator;
}());
exports.ReaderIterator = ReaderIterator;
