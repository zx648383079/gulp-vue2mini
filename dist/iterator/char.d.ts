import { Iterator } from './base';
export declare class CharIterator implements Iterator<string> {
    private content;
    constructor(content: string);
    private index;
    get length(): number;
    get position(): number;
    set position(i: number);
    get canNext(): boolean;
    get canBack(): boolean;
    get current(): string;
    moveNext(): boolean;
    moveBack(): boolean;
    reset(): void;
    nextIs(...items: string[]): boolean;
    read(length?: number, offset?: number): string | undefined;
    readSeek(pos: number, length?: number): string;
    readRange(): string;
    readRange(end: number): string;
    readRange(begin: number, end: number): string;
    move(length?: number): void;
    moveEnd(): void;
    indexOf(code: string, offset?: number): number;
    forEach(cb: (code: string, i: number) => false | void): void;
    each(cb: (code: string, i: number) => false | void, offset?: number): void;
    reverse(cb: (code: string, i: number) => false | void, offset?: number): void;
    reverseCount(code: string): number;
    minIndex(...items: string[]): number;
}
