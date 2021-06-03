import { Iterator } from './base';
export declare class LineIterator implements Iterator<string> {
    constructor(content: string | string[]);
    private lines;
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
    read(length?: number, offset?: number): string | string[] | undefined;
    move(length?: number): void;
    indexOf(code: string, offset?: number): number;
    forEach(cb: (code: string, i: number) => false | void): void;
}
