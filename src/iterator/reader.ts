import { Iterator } from './base';
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

    private index = -1;

    get length(): number {
        return this.reader.length;
    }
    get position(): number {
        return this.index;
    }
    set position(i: number) {
        if (i < -1) {
            i = -1;
        } else if (i > this.length) {
            i = this.length;
        }
        this.index = i;
    }
    get canNext(): boolean {
        return this.position < this.length - 1;
    }
    get canBack(): boolean {
        return this.position > 0;
    }

    get current(): T {
        return this.reader.read(this.position) as T;
    }
    moveNext(): boolean {
        if (!this.canNext) {
            return false;
        }
        this.position ++;
        return true;
    }
    moveBack(): boolean {
        if (!this.canBack) {
            return false;
        }
        this.position --;
        return true;
    }
    reset(): void {
        this.position = -1;
    }
    nextIs(...items: T[]): boolean {
        if (!this.canNext) {
            return false;
        }
        const i = this.reader.read(this.position + 1) as T;
        for (const item of items) {
            if (item === i) {
                return true;
            }
        }
        return false;
    }

    read(length = 1, offset = 0): T | K | undefined {
        if (length === 0) {
            return null as any;
        }
        const pos = (length < 0 ? this.position + length : this.position) + offset;
        if (pos > this.length - 1) {
            return undefined;
        }
        const len = length < 0 ? -length : length;
        return this.reader.read(pos, len);
    }
    move(length = 1): void {
        this.position += length;
    }
    indexOf(code: T, offset = 1): number {
        return this.reader.indexOf(code, this.position + offset);
    }
    forEach(cb: (code: T, i: number) => false | void): void {
        while (this.moveNext()) {
            if (cb(this.current as T, this.position) === false) {
                break;
            }
        }
    }
}