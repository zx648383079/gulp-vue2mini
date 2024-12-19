"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineIterator = void 0;
const util_1 = require("../util/util");
class LineIterator {
    constructor(content) {
        this.lines = content instanceof Array ? content : (0, util_1.splitLine)(content);
    }
    lines;
    index = -1;
    get length() {
        return this.lines.length;
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
        return this.lines[this.position];
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
        const i = this.lines[this.position + 1];
        for (const item of items) {
            if (i.indexOf(item) >= 0) {
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
        return this.lines.slice(pos, pos + len);
    }
    move(length = 1) {
        this.position += length;
    }
    indexOf(code, offset = 1) {
        for (let i = this.position + offset; i < this.length; i++) {
            if (this.lines[i].indexOf(code) >= 0) {
                return i;
            }
        }
        return -1;
    }
    forEach(cb) {
        while (this.moveNext()) {
            if (cb(this.current, this.position) === false) {
                break;
            }
        }
    }
}
exports.LineIterator = LineIterator;
