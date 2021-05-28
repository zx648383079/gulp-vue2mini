import { splitLine } from './util';

export interface Iterator<T, K = T[]> {
    /**
     * 数据的总长度
     */
    get length(): number;
    /**
     * 当前的位置
     */
    get index(): number;
    /**
     * 设置当前位置
     */
    set index(i: number);
    /**
     * 是否还有下一个
     */
    get canNext(): boolean;
    /**
     * 是否能返回上一个
     */
    get canBack(): boolean;
    /**
     * 取下一个值
     */
    next(): T|undefined;

    /**
     * 下一个值是，不移动位置
     * @param items 
     */
    nextIs(...items: T[]): boolean;
    /**
     * 取上一个值
     */
    back(): T|undefined;
    /**
     * 从当前位置开始读取一定长度的数据，不会移动指针
     * @param length 
     */
    read(length?: number, offset?: number): T|K|undefined;
    /**
     * 移动指针
     * @param length 
     */
    move(length?: number): void;

    moveBegin(): void;

    moveEnd(): void;
    /**
     * 从当前位置开始判读是否还存在指定字符串
     * @param code 
     */
    indexOf(code: T, offset?: number): number;
    /**
     * 循环，从当前位置开始，同时更新当前位置
     * @param cb 
     */
    forEach(cb: (code: T, i: number) => void|false): void;
}

export interface Reader<T, K = T[]> {
    get length(): number;
    read(pos: number, length?: number): T|K;
    indexOf(code: T, pos?: number): number;
}

export class ReaderIterator<T, K = T[]> implements Iterator<T, K> {
    constructor(
        private reader: Reader<T, K>
    ) {
    }

    private current = -1;

    get length(): number {
        return this.reader.length;
    }
    get index(): number {
        return this.current;
    }
    set index(i: number) {
        if (i < -1) {
            i = -1;
        } else if (i > this.length) {
            i = this.length;
        }
        this.current = i;
    }
    get canNext(): boolean {
        return this.current < this.length - 1;
    }
    get canBack(): boolean {
        return this.current > 0;
    }
    next(): T | undefined {
        if (!this.canNext) {
            return undefined;
        }
        return this.reader.read(++ this.current) as T;
    }
    nextIs(...items: T[]): boolean {
        if (!this.canNext) {
            return false;
        }
        const i = this.reader.read(this.current + 1) as T;
        for (const item of items) {
            if (item === i) {
                return true;
            }
        }
        return false;
    }
    back(): T | undefined {
        if (!this.canBack) {
            return undefined;
        }
        return this.reader.read(-- this.current) as T;
    }
    read(length = 1, offset = 0): T | K | undefined {
        if (length === 0) {
            return null as any;
        }
        const pos = (length < 0 ? this.current + length : this.current) + offset;
        if (pos > this.length - 1) {
            return undefined;
        }
        const len = length < 0 ? -length : length;
        return this.reader.read(pos, len);
    }
    move(length = 1): void {
        this.index += length;
    }

    moveBegin(): void {
        this.current = -1;
    }

    moveEnd(): void {
        this.current = this.length;
    }
    indexOf(code: T, offset = 1): number {
        return this.reader.indexOf(code, this.current + offset);
    }
    forEach(cb: (code: T, i: number) => false | void): void {
        while (this.canNext) {
            if (cb(this.next() as T, this.index) === false) {
                break;
            }
        }
    }
}

export class CharIterator implements Iterator<string> {
    constructor(
        private content: string
    ) {
    }

    private current = -1;

    get length(): number {
        return this.content.length;
    }
    get index(): number {
        return this.current;
    }
    set index(i: number) {
        if (i < -1) {
            i = -1;
        } else if (i > this.length) {
            i = this.length;
        }
        this.current = i;
    }
    get canNext(): boolean {
        return this.current < this.length - 1;
    }
    get canBack(): boolean {
        return this.current > 0;
    }
    next(): string | undefined {
        if (!this.canNext) {
            return undefined;
        }
        return this.content.charAt(++ this.current);
    }
    nextIs(...items: string[]): boolean {
        if (!this.canNext) {
            return false;
        }
        const i = this.content.charAt(this.current + 1);
        for (const item of items) {
            if (item === i) {
                return true;
            }
        }
        return false;
    }
    back(): string | undefined {
        if (!this.canBack) {
            return undefined;
        }
        return this.content.charAt(-- this.current);
    }
    read(length = 1, offset = 0): string | undefined {
        if (length === 0) {
            return '';
        }
        const pos = (length < 0 ? this.current + length : this.current) + offset;
        if (pos > this.length - 1) {
            return undefined;
        }
        const len = length < 0 ? -length : length;
        return this.content.substr(pos, len);
    }

    /**
     * 直接读取原始数据
     * @param pos 
     * @param length 
     * @returns 
     */
    readSeek(pos: number, length = 1) {
        return this.content.substr(pos, length);
    }
    /**
     * 读取数据
     * @param begin 
     * @param end 
     * @returns 
     */
    readRange(): string;
    readRange(end: number): string;
    readRange(begin: number, end: number): string;
    readRange(begin?: number, end?: number): string {
        if (!begin) {
            return this.content.substring(this.current);
        }
        if (!end) {
            [begin, end] = [this.current, begin];
        }
        return this.content.substring(begin, end);
    }

    move(length = 1): void {
        this.index += length;
    }

    moveBegin(): void {
        this.current = -1;
    }

    moveEnd(): void {
        this.current = this.length;
    }
    indexOf(code: string, offset = 1): number {
        return this.content.indexOf(code, this.current + offset);
    }
    forEach(cb: (code: string, i: number) => false | void): void {
        while (this.canNext) {
            if (cb(this.next() as string, this.index) === false) {
                break;
            }
        }
    }

    /**
     * 遍历，不移动当前位置
     * @param cb 
     * @param offset 
     */
    each(cb: (code: string, i: number) => false | void, offset = 1): void {
        let i = this.index + offset;
        while (i < this.length) {
            if (cb(this.content.charAt(i), i) === false) {
                break;
            }
            i ++;
        }
    }

    /**
     * 反向遍历，不移动当前位置
     * @param cb 
     * @param offset 默认从前一个位置开始
     */
    reverse(cb: (code: string, i: number) => false | void, offset = -1): void {
        let i = this.index + offset;
        while (i >= 0) {
            if (cb(this.content.charAt(i), i) === false) {
                break;
            }
            i --;
        }
    }
    
}

export class LineIterator implements Iterator<string> {
    constructor(
        content: string|string[]
    ) {
        this.lines = content instanceof Array ? content : splitLine(content);
    }

    private lines: string[];

    private current = -1;

    get length(): number {
        return this.lines.length;
    }
    get index(): number {
        return this.current;
    }
    set index(i: number) {
        if (i < -1) {
            i = -1;
        } else if (i > this.length) {
            i = this.length;
        }
        this.current = i;
    }
    get canNext(): boolean {
        return this.current < this.length - 1;
    }
    get canBack(): boolean {
        return this.current > 0;
    }
    next(): string | undefined {
        if (!this.canNext) {
            return undefined;
        }
        return this.lines[++ this.current];
    }
    /**
     * 下一行是否包含值
     * @param code 
     * @returns 
     */
    nextIs(...items: string[]): boolean {
        if (!this.canNext) {
            return false;
        }
        const i = this.lines[this.current + 1];
        for (const item of items) {
            if (i.indexOf(item) >= 0) {
                return true;
            }
        }
        return false;
    }
    back(): string | undefined {
        if (!this.canBack) {
            return undefined;
        }
        return this.lines[-- this.current];
    }
    read(length = 1, offset = 0): string|string[] | undefined {
        if (length === 0) {
            return '';
        }
        const pos = (length < 0 ? this.current + length : this.current) + offset;
        if (pos > this.length - 1) {
            return undefined;
        }
        const len = length < 0 ? -length : length;
        return this.lines.slice(pos, pos + len);
    }
    move(length = 1): void {
        this.index += length;
    }

    moveBegin(): void {
        this.current = -1;
    }

    moveEnd(): void {
        this.current = this.length;
    }
    indexOf(code: string, offset = 1): number {
        for (let i = this.current + offset; i < this.length; i++) {
            if (this.lines[i].indexOf(code) >= 0) {
                return i;
            }
        }
        return -1;
    }
    forEach(cb: (code: string, i: number) => false | void): void {
        while (this.canNext) {
            if (cb(this.next() as string, this.index) === false) {
                break;
            }
        }
    }
}