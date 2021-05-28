"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineIterator = exports.CharIterator = exports.ReaderIterator = void 0;
var util_1 = require("./util");
var ReaderIterator = (function () {
    function ReaderIterator(reader) {
        this.reader = reader;
        this.current = -1;
    }
    Object.defineProperty(ReaderIterator.prototype, "length", {
        get: function () {
            return this.reader.length;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ReaderIterator.prototype, "index", {
        get: function () {
            return this.current;
        },
        set: function (i) {
            if (i < -1) {
                i = -1;
            }
            else if (i > this.length) {
                i = this.length;
            }
            this.current = i;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ReaderIterator.prototype, "canNext", {
        get: function () {
            return this.current < this.length - 1;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ReaderIterator.prototype, "canBack", {
        get: function () {
            return this.current > 0;
        },
        enumerable: false,
        configurable: true
    });
    ReaderIterator.prototype.next = function () {
        if (!this.canNext) {
            return undefined;
        }
        return this.reader.read(++this.current);
    };
    ReaderIterator.prototype.nextIs = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        if (!this.canNext) {
            return false;
        }
        var i = this.reader.read(this.current + 1);
        for (var _a = 0, items_1 = items; _a < items_1.length; _a++) {
            var item = items_1[_a];
            if (item === i) {
                return true;
            }
        }
        return false;
    };
    ReaderIterator.prototype.back = function () {
        if (!this.canBack) {
            return undefined;
        }
        return this.reader.read(--this.current);
    };
    ReaderIterator.prototype.read = function (length, offset) {
        if (length === void 0) { length = 1; }
        if (offset === void 0) { offset = 0; }
        if (length === 0) {
            return null;
        }
        var pos = (length < 0 ? this.current + length : this.current) + offset;
        if (pos > this.length - 1) {
            return undefined;
        }
        var len = length < 0 ? -length : length;
        return this.reader.read(pos, len);
    };
    ReaderIterator.prototype.move = function (length) {
        if (length === void 0) { length = 1; }
        this.index += length;
    };
    ReaderIterator.prototype.moveBegin = function () {
        this.current = -1;
    };
    ReaderIterator.prototype.moveEnd = function () {
        this.current = this.length;
    };
    ReaderIterator.prototype.indexOf = function (code, offset) {
        if (offset === void 0) { offset = 1; }
        return this.reader.indexOf(code, this.current + offset);
    };
    ReaderIterator.prototype.forEach = function (cb) {
        while (this.canNext) {
            if (cb(this.next(), this.index) === false) {
                break;
            }
        }
    };
    return ReaderIterator;
}());
exports.ReaderIterator = ReaderIterator;
var CharIterator = (function () {
    function CharIterator(content) {
        this.content = content;
        this.current = -1;
    }
    Object.defineProperty(CharIterator.prototype, "length", {
        get: function () {
            return this.content.length;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CharIterator.prototype, "index", {
        get: function () {
            return this.current;
        },
        set: function (i) {
            if (i < -1) {
                i = -1;
            }
            else if (i > this.length) {
                i = this.length;
            }
            this.current = i;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CharIterator.prototype, "canNext", {
        get: function () {
            return this.current < this.length - 1;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CharIterator.prototype, "canBack", {
        get: function () {
            return this.current > 0;
        },
        enumerable: false,
        configurable: true
    });
    CharIterator.prototype.next = function () {
        if (!this.canNext) {
            return undefined;
        }
        return this.content.charAt(++this.current);
    };
    CharIterator.prototype.nextIs = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        if (!this.canNext) {
            return false;
        }
        var i = this.content.charAt(this.current + 1);
        for (var _a = 0, items_2 = items; _a < items_2.length; _a++) {
            var item = items_2[_a];
            if (item === i) {
                return true;
            }
        }
        return false;
    };
    CharIterator.prototype.back = function () {
        if (!this.canBack) {
            return undefined;
        }
        return this.content.charAt(--this.current);
    };
    CharIterator.prototype.read = function (length, offset) {
        if (length === void 0) { length = 1; }
        if (offset === void 0) { offset = 0; }
        if (length === 0) {
            return '';
        }
        var pos = (length < 0 ? this.current + length : this.current) + offset;
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
            return this.content.substring(this.current);
        }
        if (!end) {
            _a = [this.current, begin], begin = _a[0], end = _a[1];
        }
        return this.content.substring(begin, end);
    };
    CharIterator.prototype.move = function (length) {
        if (length === void 0) { length = 1; }
        this.index += length;
    };
    CharIterator.prototype.moveBegin = function () {
        this.current = -1;
    };
    CharIterator.prototype.moveEnd = function () {
        this.current = this.length;
    };
    CharIterator.prototype.indexOf = function (code, offset) {
        if (offset === void 0) { offset = 1; }
        return this.content.indexOf(code, this.current + offset);
    };
    CharIterator.prototype.forEach = function (cb) {
        while (this.canNext) {
            if (cb(this.next(), this.index) === false) {
                break;
            }
        }
    };
    CharIterator.prototype.each = function (cb, offset) {
        if (offset === void 0) { offset = 1; }
        var i = this.index + offset;
        while (i < this.length) {
            if (cb(this.content.charAt(i), i) === false) {
                break;
            }
            i++;
        }
    };
    CharIterator.prototype.reverse = function (cb, offset) {
        if (offset === void 0) { offset = -1; }
        var i = this.index + offset;
        while (i >= 0) {
            if (cb(this.content.charAt(i), i) === false) {
                break;
            }
            i--;
        }
    };
    return CharIterator;
}());
exports.CharIterator = CharIterator;
var LineIterator = (function () {
    function LineIterator(content) {
        this.current = -1;
        this.lines = content instanceof Array ? content : util_1.splitLine(content);
    }
    Object.defineProperty(LineIterator.prototype, "length", {
        get: function () {
            return this.lines.length;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LineIterator.prototype, "index", {
        get: function () {
            return this.current;
        },
        set: function (i) {
            if (i < -1) {
                i = -1;
            }
            else if (i > this.length) {
                i = this.length;
            }
            this.current = i;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LineIterator.prototype, "canNext", {
        get: function () {
            return this.current < this.length - 1;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LineIterator.prototype, "canBack", {
        get: function () {
            return this.current > 0;
        },
        enumerable: false,
        configurable: true
    });
    LineIterator.prototype.next = function () {
        if (!this.canNext) {
            return undefined;
        }
        return this.lines[++this.current];
    };
    LineIterator.prototype.nextIs = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        if (!this.canNext) {
            return false;
        }
        var i = this.lines[this.current + 1];
        for (var _a = 0, items_3 = items; _a < items_3.length; _a++) {
            var item = items_3[_a];
            if (i.indexOf(item) >= 0) {
                return true;
            }
        }
        return false;
    };
    LineIterator.prototype.back = function () {
        if (!this.canBack) {
            return undefined;
        }
        return this.lines[--this.current];
    };
    LineIterator.prototype.read = function (length, offset) {
        if (length === void 0) { length = 1; }
        if (offset === void 0) { offset = 0; }
        if (length === 0) {
            return '';
        }
        var pos = (length < 0 ? this.current + length : this.current) + offset;
        if (pos > this.length - 1) {
            return undefined;
        }
        var len = length < 0 ? -length : length;
        return this.lines.slice(pos, pos + len);
    };
    LineIterator.prototype.move = function (length) {
        if (length === void 0) { length = 1; }
        this.index += length;
    };
    LineIterator.prototype.moveBegin = function () {
        this.current = -1;
    };
    LineIterator.prototype.moveEnd = function () {
        this.current = this.length;
    };
    LineIterator.prototype.indexOf = function (code, offset) {
        if (offset === void 0) { offset = 1; }
        for (var i = this.current + offset; i < this.length; i++) {
            if (this.lines[i].indexOf(code) >= 0) {
                return i;
            }
        }
        return -1;
    };
    LineIterator.prototype.forEach = function (cb) {
        while (this.canNext) {
            if (cb(this.next(), this.index) === false) {
                break;
            }
        }
    };
    return LineIterator;
}());
exports.LineIterator = LineIterator;
