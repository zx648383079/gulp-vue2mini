import { Iterator } from './base';
export interface Reader<T, K = T[]> {
    get length(): number;
    read(pos: number, length?: number): T | K;
    indexOf(code: T, pos?: number): number;
}
export declare class ReaderIterator<T, K = T[]> implements Iterator<T, K> {
    private reader;
    constructor(reader: Reader<T, K>);
    private index;
    get length(): number;
    get position(): number;
    set position(i: number);
    get canNext(): boolean;
    get canBack(): boolean;
    get current(): T;
    moveNext(): boolean;
    moveBack(): boolean;
    reset(): void;
    nextIs(...items: T[]): boolean;
    read(length?: number, offset?: number): T | K | undefined;
    move(length?: number): void;
    indexOf(code: T, offset?: number): number;
    forEach(cb: (code: T, i: number) => false | void): void;
}
