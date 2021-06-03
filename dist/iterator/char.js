"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharIterator = void 0;
var CharIterator = (function () {
    function CharIterator(content) {
        this.content = content;
        this.index = -1;
    }
    Object.defineProperty(CharIterator.prototype, "length", {
        get: function () {
            return this.content.length;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CharIterator.prototype, "position", {
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
    Object.defineProperty(CharIterator.prototype, "canNext", {
        get: function () {
            return this.position < this.length - 1;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CharIterator.prototype, "canBack", {
        get: function () {
            return this.position > 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CharIterator.prototype, "current", {
        get: function () {
            return this.content.charAt(this.position);
        },
        enumerable: false,
        configurable: true
    });
    CharIterator.prototype.moveNext = function () {
        if (!this.canNext) {
            return false;
        }
        this.position++;
        return true;
    };
    CharIterator.prototype.moveBack = function () {
        if (!this.canBack) {
            return false;
        }
        this.position--;
        return true;
    };
    CharIterator.prototype.reset = function () {
        this.position = -1;
    };
    CharIterator.prototype.nextIs = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        if (!this.canNext) {
            return false;
        }
        var code = this.content.charAt(this.position + 1);
        for (var _a = 0, items_1 = items; _a < items_1.length; _a++) {
            var item = items_1[_a];
            if (item === '') {
                continue;
            }
            if (item.length === 1) {
                if (item === code) {
                    return true;
                }
                continue;
            }
            if (this.content.substr(this.position + 1, item.length) === item) {
                return true;
            }
        }
        return false;
    };
    CharIterator.prototype.read = function (length, offset) {
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
        return this.content.substr(pos, len);
    };
    CharIterator.prototype.readSeek = function (pos, length) {
        if (length === void 0) { length = 1; }
        return this.content.substr(pos, length);
    };
    CharIterator.prototype.readRange = function (begin, end) {
        var _a;
        if (!begin) {
            return this.content.substring(this.position);
        }
        if (!end) {
            _a = [this.position, begin], begin = _a[0], end = _a[1];
        }
        return this.content.substring(begin, end);
    };
    CharIterator.prototype.move = function (length) {
        if (length === void 0) { length = 1; }
        this.position += length;
    };
    CharIterator.prototype.moveEnd = function () {
        this.position = this.length;
    };
    CharIterator.prototype.indexOf = function (code, offset) {
        if (offset === void 0) { offset = 1; }
        return this.content.indexOf(code, this.position + offset);
    };
    CharIterator.prototype.forEach = function (cb) {
        while (this.moveNext()) {
            if (cb(this.current, this.position) === false) {
                break;
            }
        }
    };
    CharIterator.prototype.each = function (cb, offset) {
        if (offset === void 0) { offset = 1; }
        var i = this.position + offset;
        while (i < this.length) {
            if (cb(this.content.charAt(i), i) === false) {
                break;
            }
            i++;
        }
    };
    CharIterator.prototype.reverse = function (cb, offset) {
        if (offset === void 0) { offset = -1; }
        var i = this.position + offset;
        while (i >= 0) {
            if (cb(this.content.charAt(i), i) === false) {
                break;
            }
            i--;
        }
    };
    CharIterator.prototype.reverseCount = function (code) {
        var count = 0;
        this.reverse(function (i) {
            if (i !== code) {
                return false;
            }
            count++;
            return;
        });
        return count;
    };
    CharIterator.prototype.minIndex = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        var index = -1;
        var min = -1;
        for (var i = items.length - 1; i >= 0; i--) {
            var j = this.indexOf(items[i]);
            if (j >= 0 && (min < 0 || j <= min)) {
                index = i;
                min = j;
            }
        }
        return index;
    };
    return CharIterator;
}());
exports.CharIterator = CharIterator;
