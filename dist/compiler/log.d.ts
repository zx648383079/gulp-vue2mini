export declare const Colors: {
    bold: number[];
    dim: number[];
    italic: number[];
    underline: number[];
    inverse: number[];
    hidden: number[];
    strikethrough: number[];
    black: number[];
    red: number[];
    green: number[];
    yellow: number[];
    blue: number[];
    magenta: number[];
    cyan: number[];
    white: number[];
    gray: number[];
    grey: number[];
    brightRed: number[];
    brightGreen: number[];
    brightYellow: number[];
    brightBlue: number[];
    brightMagenta: number[];
    brightCyan: number[];
    brightWhite: number[];
    bgBlack: number[];
    bgRed: number[];
    bgGreen: number[];
    bgYellow: number[];
    bgBlue: number[];
    bgMagenta: number[];
    bgCyan: number[];
    bgWhite: number[];
    bgGray: number[];
    bgGrey: number[];
    bgBrightRed: number[];
    bgBrightGreen: number[];
    bgBrightYellow: number[];
    bgBrightBlue: number[];
    bgBrightMagenta: number[];
    bgBrightCyan: number[];
    bgBrightWhite: number[];
    blackBG: number[];
    redBG: number[];
    greenBG: number[];
    yellowBG: number[];
    blueBG: number[];
    magentaBG: number[];
    cyanBG: number[];
    whiteBG: number[];
};
export declare enum LogLevel {
    fatal = 0,
    error = 1,
    warn = 2,
    info = 3,
    debug = 4
}
export declare class Logger {
    private levelColors;
    debug(msg: any): void;
    info(msg: any): void;
    error(msg: any): void;
    log(level: LogLevel, ...items: any[]): void;
    private colorToStr;
    levelToColor(level: LogLevel): number[] | undefined;
    private format;
}
export declare class LogStr {
    constructor(val: any);
    constructor(color: string, ...vals: any[]);
    constructor(color: number[], ...vals: any[]);
    blockItems: {
        color?: number[];
        value: any;
    }[];
    join(val: any): LogStr;
    join(color: string, ...vals: any[]): LogStr;
    join(color: undefined, ...vals: any[]): LogStr;
    join(color: number[], ...vals: any[]): LogStr;
    join(color: number[] | undefined | string, ...vals: any[]): LogStr;
    joinLine(): LogStr;
    toString(): string;
    toNormalString(): string;
    static build(val: any): LogStr;
    static build(color: undefined, ...vals: any[]): LogStr;
    static build(color: string, ...vals: any[]): LogStr;
    static build(color: number[], ...vals: any[]): LogStr;
}
