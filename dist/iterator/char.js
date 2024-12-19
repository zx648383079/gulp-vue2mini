"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharIterator = void 0;
class CharIterator {
    content;
    constructor(content) {
        this.content = content;
    }
    index = -1;
    get length() {
        return this.content.length;
    }
    get position() {
        return this.index;
    }
    set position(i) {
        if (i < -1) {
            i = -1;
        }
        else if (i > this.length) {
            i = this.length;
        }
        this.index = i;
    }
    get canNext() {
        return this.position < this.length - 1;
    }
    get canBack() {
        return this.position > 0;
    }
    get current() {
        return this.content.charAt(this.position);
    }
    moveNext() {
        if (!this.canNext) {
            return false;
        }
        this.position++;
        return true;
    }
    moveBack() {
        if (!this.canBack) {
            return false;
        }
        this.position--;
        return true;
    }
    reset() {
        this.position = -1;
    }
    nextIs(...items) {
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
    read(length = 1, offset = 0) {
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
    readSeek(pos, length = 1) {
        return this.content.substring(pos, pos + length);
    }
    readRange(begin, end) {
        if (!begin) {
            return this.content.substring(this.position);
        }
        if (!end) {
            [begin, end] = [this.position, begin];
        }
        return this.content.substring(begin, end);
    }
    move(length = 1) {
        this.position += length;
    }
    moveEnd() {
        this.position = this.length;
    }
    indexOf(code, offset = 1) {
        return this.content.indexOf(code, this.position + offset);
    }
    forEach(cb) {
        while (this.moveNext()) {
            if (cb(this.current, this.position) === false) {
                break;
            }
        }
    }
    each(cb, offset = 1) {
        let i = this.position + offset;
        while (i < this.length) {
            if (cb(this.content.charAt(i), i) === false) {
                break;
            }
            i++;
        }
    }
    reverse(cb, offset = -1) {
        let i = this.position + offset;
        while (i >= 0) {
            if (cb(this.content.charAt(i), i) === false) {
                break;
            }
            i--;
        }
    }
    reverseCount(code) {
        let count = 0;
        this.reverse(i => {
            if (i !== code) {
                return false;
            }
            count++;
            return;
        });
        return count;
    }
    minIndex(...items) {
        let index = -1;
        let min = -1;
        for (let i = items.length - 1; i >= 0; i--) {
            const j = this.indexOf(items[i]);
            if (j >= 0 && (min < 0 || j <= min)) {
                index = i;
                min = j;
            }
        }
        return index;
    }
}
exports.CharIterator = CharIterator;
