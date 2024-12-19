"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReaderIterator = void 0;
class ReaderIterator {
    reader;
    constructor(reader) {
        this.reader = reader;
    }
    index = -1;
    get length() {
        return this.reader.length;
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
        return this.reader.read(this.position);
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
        const i = this.reader.read(this.position + 1);
        for (const item of items) {
            if (item === i) {
                return true;
            }
        }
        return false;
    }
    read(length = 1, offset = 0) {
        if (length === 0) {
            return null;
        }
        const pos = (length < 0 ? this.position + length : this.position) + offset;
        if (pos > this.length - 1) {
            return undefined;
        }
        const len = length < 0 ? -length : length;
        return this.reader.read(pos, len);
    }
    move(length = 1) {
        this.position += length;
    }
    indexOf(code, offset = 1) {
        return this.reader.indexOf(code, this.position + offset);
    }
    forEach(cb) {
        while (this.moveNext()) {
            if (cb(this.current, this.position) === false) {
                break;
            }
        }
    }
}
exports.ReaderIterator = ReaderIterator;
