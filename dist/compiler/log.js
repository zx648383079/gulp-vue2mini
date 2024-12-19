export const Colors = {
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
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["fatal"] = 0] = "fatal";
    LogLevel[LogLevel["error"] = 1] = "error";
    LogLevel[LogLevel["warn"] = 2] = "warn";
    LogLevel[LogLevel["info"] = 3] = "info";
    LogLevel[LogLevel["debug"] = 4] = "debug";
})(LogLevel || (LogLevel = {}));
export class Logger {
    levelColors = {
        [LogLevel.error]: Colors.red,
        [LogLevel.warn]: Colors.yellow,
        [LogLevel.debug]: Colors.green,
    };
    debug(msg) {
        this.log(LogLevel.debug, msg);
    }
    info(msg) {
        this.log(LogLevel.info, msg);
    }
    error(msg) {
        this.log(LogLevel.error, msg);
    }
    log(level, ...items) {
        const color = this.levelToColor(level);
        for (const msg of items) {
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
    }
    colorToStr(color) {
        return '\u001b[' + color + 'm';
    }
    levelToColor(level) {
        return this.levelColors[level];
    }
    format(color, msg) {
        const val = typeof color === 'string' ? Colors[color] : color;
        if (!val) {
            return msg;
        }
        return this.colorToStr(val[0]) + msg + this.colorToStr(val[1]);
    }
}
export class LogStr {
    constructor(color, ...items) {
        this.join(color, ...items);
    }
    blockItems = [];
    join(color, ...items) {
        if (items.length === 0) {
            this.blockItems.push({ value: color });
            return this;
        }
        if (typeof color === 'string') {
            color = Colors[color];
        }
        else if (typeof color === 'object' && color instanceof Array && color.length < 2) {
            color = undefined;
        }
        this.blockItems.push({ value: items.join(''), color });
        return this;
    }
    joinLine() {
        return this.join('\n');
    }
    toString() {
        const items = [];
        for (const item of this.blockItems) {
            if (!item.color || item.color.length !== 2) {
                items.push(item.value);
                continue;
            }
            items.push('\u001b[', item.color[0], 'm', item.value, '\u001b[', item.color[1], 'm');
        }
        return items.join('');
    }
    toNormalString() {
        return this.blockItems.map(i => i.value).join('');
    }
    static build(color, ...items) {
        return new LogStr(color, ...items);
    }
}
