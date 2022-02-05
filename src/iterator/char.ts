import { Iterator } from './base';

export class CharIterator implements Iterator<string> {
    constructor(
        private content: string
    ) {
    }

    private index = -1;

    get length(): number {
        return this.content.length;
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
        return this.content.charAt(this.position);
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
     * 后续的值
     * @param items 
     * @returns 
     */
    nextIs(...items: string[]): boolean {
        if (!this.canNext) {
            return false;
        }
        const code = this.content.charAt(this.position + 1);
        for (const item of items) {
            if (item === '') {
                continue;
            }
            if (item.length === 1) {
                if (item === code) {
                    return true;
                }
                continue;
            }
            if (this.content.substring(this.position + 1, this.position + 1 + item.length) === item) {
                return true;
            }
        }
        return false;
    }
    read(length = 1, offset = 0): string | undefined {
        if (length === 0) {
            return '';
        }
        const pos = (length < 0 ? this.position + length : this.position) + offset;
        if (pos > this.length - 1) {
            return undefined;
        }
        const len = length < 0 ? -length : length;
        return this.content.substring(pos, pos + len);
    }

    /**
     * 直接读取原始数据
     * @param pos 
     * @param length 
     * @returns 
     */
    readSeek(pos: number, length = 1) {
        return this.content.substring(pos, pos + length);
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
            return this.content.substring(this.position);
        }
        if (!end) {
            [begin, end] = [this.position, begin];
        }
        return this.content.substring(begin, end);
    }

    move(length = 1): void {
        this.position += length;
    }

    moveEnd(): void {
        this.position = this.length;
    }

    indexOf(code: string, offset = 1): number {
        return this.content.indexOf(code, this.position + offset);
    }
    forEach(cb: (code: string, i: number) => false | void): void {
        while (this.moveNext()) {
            if (cb(this.current, this.position) === false) {
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
        let i = this.position + offset;
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
        let i = this.position + offset;
        while (i >= 0) {
            if (cb(this.content.charAt(i), i) === false) {
                break;
            }
            i --;
        }
    }

    /**
     * 字符是否是上一个字符，并计算连续出现的次数
     * @param code 
     */
    reverseCount(code: string): number {
        let count = 0;
        this.reverse(i => {
            if (i !== code) {
                return false;
            }
            count ++;
            return;
        });
        return count;
    }

    /**
     * 多个字符串存在的最小值的序号，都不存在为-1
     * @param items 
     * @returns 
     */
    minIndex(...items: string[]): number {
        let index = -1;
        let min = -1;
        for (let i = items.length - 1; i >= 0; i--)
        {
            const j = this.indexOf(items[i]);
            if (j >= 0 && (min < 0 || j <= min))
            {
                index = i;
                min = j;
            }
        }
        return index;
    }
    
}