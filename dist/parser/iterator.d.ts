export interface Iterator<T, K = T[]> {
    get length(): number;
    get index(): number;
    set index(i: number);
    get canNext(): boolean;
    get canBack(): boolean;
    next(): T | undefined;
    nextIs(...items: T[]): boolean;
    back(): T | undefined;
    read(length?: number, offset?: number): T | K | undefined;
    move(length?: number): void;
    moveBegin(): void;
    moveEnd(): void;
    indexOf(code: T, offset?: number): number;
    forEach(cb: (code: T, i: number) => void | false): void;
}
export interface Reader<T, K = T[]> {
    get length(): number;
    read(pos: number, length?: number): T | K;
    indexOf(code: T, pos?: number): number;
}
export declare class ReaderIterator<T, K = T[]> implements Iterator<T, K> {
    private reader;
    constructor(reader: Reader<T, K>);
    private current;
    get length(): number;
    get index(): number;
    set index(i: number);
    get canNext(): boolean;
    get canBack(): boolean;
    next(): T | undefined;
    nextIs(...items: T[]): boolean;
    back(): T | undefined;
    read(length?: number, offset?: number): T | K | undefined;
    move(length?: number): void;
    moveBegin(): void;
    moveEnd(): void;
    indexOf(code: T, offset?: number): number;
    forEach(cb: (code: T, i: number) => false | void): void;
}
export declare class CharIterator implements Iterator<string> {
    private content;
    constructor(content: string);
    private current;
    get length(): number;
    get index(): number;
    set index(i: number);
    get canNext(): boolean;
    get canBack(): boolean;
    next(): string | undefined;
    nextIs(...items: string[]): boolean;
    back(): string | undefined;
    read(length?: number, offset?: number): string | undefined;
    readSeek(pos: number, length?: number): string;
    readRange(): string;
    readRange(end: number): string;
    readRange(begin: number, end: number): string;
    move(length?: number): void;
    moveBegin(): void;
    moveEnd(): void;
    indexOf(code: string, offset?: number): number;
    forEach(cb: (code: string, i: number) => false | void): void;
    each(cb: (code: string, i: number) => false | void, offset?: number): void;
    reverse(cb: (code: string, i: number) => false | void, offset?: number): void;
}
export declare class LineIterator implements Iterator<string> {
    constructor(content: string | string[]);
    private lines;
    private current;
    get length(): number;
    get index(): number;
    set index(i: number);
    get canNext(): boolean;
    get canBack(): boolean;
    next(): string | undefined;
    nextIs(...items: string[]): boolean;
    back(): string | undefined;
    read(length?: number, offset?: number): string | string[] | undefined;
    move(length?: number): void;
    moveBegin(): void;
    moveEnd(): void;
    indexOf(code: string, offset?: number): number;
    forEach(cb: (code: string, i: number) => false | void): void;
}
