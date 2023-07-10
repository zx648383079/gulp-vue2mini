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
exports.LogStr = exports.Logger = exports.LogLevel = exports.Colors = void 0;
exports.Colors = {
    bold: [1, 22],
    dim: [2, 22],
    italic: [3, 23],
    underline: [4, 24],
    inverse: [7, 27],
    hidden: [8, 28],
    strikethrough: [9, 29],
    black: [30, 39],
    red: [31, 39],
    green: [32, 39],
    yellow: [33, 39],
    blue: [34, 39],
    magenta: [35, 39],
    cyan: [36, 39],
    white: [37, 39],
    gray: [90, 39],
    grey: [90, 39],
    brightRed: [91, 39],
    brightGreen: [92, 39],
    brightYellow: [93, 39],
    brightBlue: [94, 39],
    brightMagenta: [95, 39],
    brightCyan: [96, 39],
    brightWhite: [97, 39],
    bgBlack: [40, 49],
    bgRed: [41, 49],
    bgGreen: [42, 49],
    bgYellow: [43, 49],
    bgBlue: [44, 49],
    bgMagenta: [45, 49],
    bgCyan: [46, 49],
    bgWhite: [47, 49],
    bgGray: [100, 49],
    bgGrey: [100, 49],
    bgBrightRed: [101, 49],
    bgBrightGreen: [102, 49],
    bgBrightYellow: [103, 49],
    bgBrightBlue: [104, 49],
    bgBrightMagenta: [105, 49],
    bgBrightCyan: [106, 49],
    bgBrightWhite: [107, 49],
    blackBG: [40, 49],
    redBG: [41, 49],
    greenBG: [42, 49],
    yellowBG: [43, 49],
    blueBG: [44, 49],
    magentaBG: [45, 49],
    cyanBG: [46, 49],
    whiteBG: [47, 49],
};
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["fatal"] = 0] = "fatal";
    LogLevel[LogLevel["error"] = 1] = "error";
    LogLevel[LogLevel["warn"] = 2] = "warn";
    LogLevel[LogLevel["info"] = 3] = "info";
    LogLevel[LogLevel["debug"] = 4] = "debug";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
var Logger = (function () {
    function Logger() {
        var _a;
        this.levelColors = (_a = {},
            _a[LogLevel.error] = exports.Colors.red,
            _a[LogLevel.warn] = exports.Colors.yellow,
            _a[LogLevel.debug] = exports.Colors.green,
            _a);
    }
    Logger.prototype.debug = function (msg) {
        this.log(LogLevel.debug, msg);
    };
    Logger.prototype.info = function (msg) {
        this.log(LogLevel.info, msg);
    };
    Logger.prototype.error = function (msg) {
        this.log(LogLevel.error, msg);
    };
    Logger.prototype.log = function (level) {
        var items = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            items[_i - 1] = arguments[_i];
        }
        var color = this.levelToColor(level);
        for (var _a = 0, items_1 = items; _a < items_1.length; _a++) {
            var msg = items_1[_a];
            if (typeof msg !== 'object') {
                console.log(this.format(color, msg));
                continue;
            }
            if (msg instanceof LogStr) {
                console.log(msg.toString());
                continue;
            }
            console.log(msg);
        }
    };
    Logger.prototype.colorToStr = function (color) {
        return '\u001b[' + color + 'm';
    };
    Logger.prototype.levelToColor = function (level) {
        return this.levelColors[level];
    };
    Logger.prototype.format = function (color, msg) {
        var val = typeof color === 'string' ? exports.Colors[color] : color;
        if (!val) {
            return msg;
        }
        return this.colorToStr(val[0]) + msg + this.colorToStr(val[1]);
    };
    return Logger;
}());
exports.Logger = Logger;
var LogStr = (function () {
    function LogStr(color) {
        var items = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            items[_i - 1] = arguments[_i];
        }
        this.blockItems = [];
        this.join.apply(this, __spreadArray([color], items, false));
    }
    LogStr.prototype.join = function (color) {
        var items = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            items[_i - 1] = arguments[_i];
        }
        if (items.length === 0) {
            this.blockItems.push({ value: color });
            return this;
        }
        if (typeof color === 'string') {
            color = exports.Colors[color];
        }
        else if (typeof color === 'object' && color instanceof Array && color.length < 2) {
            color = undefined;
        }
        this.blockItems.push({ value: items.join(''), color: color });
        return this;
    };
    LogStr.prototype.joinLine = function () {
        return this.join('\n');
    };
    LogStr.prototype.toString = function () {
        var items = [];
        for (var _i = 0, _a = this.blockItems; _i < _a.length; _i++) {
            var item = _a[_i];
            if (!item.color || item.color.length !== 2) {
                items.push(item.value);
                continue;
            }
            items.push('\u001b[', item.color[0], 'm', item.value, '\u001b[', item.color[1], 'm');
        }
        return items.join('');
    };
    LogStr.prototype.toNormalString = function () {
        return this.blockItems.map(function (i) { return i.value; }).join('');
    };
    LogStr.build = function (color) {
        var items = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            items[_i - 1] = arguments[_i];
        }
        return new (LogStr.bind.apply(LogStr, __spreadArray([void 0, color], items, false)))();
    };
    return LogStr;
}());
exports.LogStr = LogStr;
