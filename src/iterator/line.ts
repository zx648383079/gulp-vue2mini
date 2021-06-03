import { splitLine } from '../util/util';
import { Iterator } from './base';



export class LineIterator implements Iterator<string> {
    constructor(
        content: string|string[]
    ) {
        this.lines = content instanceof Array ? content : splitLine(content);
    }

    private lines: string[];

    private index = -1;

    get length(): number {
        return this.lines.length;
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

    get current(): string {
        return this.lines[this.position];
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
    /**
     * 下一行是否包含值
     * @param code 
     * @returns 
     */
    nextIs(...items: string[]): boolean {
        if (!this.canNext) {
            return false;
        }
        const i = this.lines[this.position + 1];
        for (const item of items) {
            if (i.indexOf(item) >= 0) {
                return true;
            }
        }
        return false;
    }
    read(length = 1, offset = 0): string|string[] | undefined {
        if (length === 0) {
            return '';
        }
        const pos = (length < 0 ? this.position + length : this.position) + offset;
        if (pos > this.length - 1) {
            return undefined;
        }
        const len = length < 0 ? -length : length;
        return this.lines.slice(pos, pos + len);
    }
    move(length = 1): void {
        this.position += length;
    }
    indexOf(code: string, offset = 1): number {
        for (let i = this.position + offset; i < this.length; i++) {
            if (this.lines[i].indexOf(code) >= 0) {
                return i;
            }
        }
        return -1;
    }
    forEach(cb: (code: string, i: number) => false | void): void {
        while (this.moveNext()) {
            if (cb(this.current as string, this.position) === false) {
                break;
            }
        }
    }
}