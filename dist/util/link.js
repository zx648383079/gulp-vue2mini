"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkManager = void 0;
const util_1 = require("./util");
class LinkManager {
    data = {};
    listeners = [];
    lockItems = [];
    trigger(key, mtime, ...args) {
        if (!Object.prototype.hasOwnProperty.call(this.data, key)) {
            return;
        }
        this.data[key].forEach(file => {
            if (!file) {
                return;
            }
            if (this.lockItems.indexOf(file) >= 0) {
                return;
            }
            this.lock(file, () => {
                this.listeners.forEach(cb => {
                    cb(file, mtime, key, ...args);
                });
            });
        });
    }
    on(callback) {
        this.listeners.push(callback);
    }
    push(key, file) {
        if (!Object.prototype.hasOwnProperty.call(this.data, key)) {
            this.data[key] = [file];
            return;
        }
        if (this.data[key].indexOf(file) >= 0) {
            return;
        }
        this.data[key].push(file);
    }
    lock(file, cb) {
        if (this.lockItems.indexOf(file) >= 0) {
            return;
        }
        this.lockItems.push(file);
        const removeLock = () => {
            const j = this.lockItems.indexOf(file);
            if (j < 0) {
                return;
            }
            this.lockItems.splice(j, 1);
        };
        try {
            cb();
        }
        catch (error) {
            removeLock();
            throw error;
        }
        removeLock();
    }
    remove(key, file) {
        if (!file) {
            this.removeFile(key);
            return;
        }
        if (file === true) {
            this.removeLink(key);
            return;
        }
        if (!Object.prototype.hasOwnProperty.call(this.data, key)) {
            return;
        }
        for (let index = this.data[key].length - 1; index >= 0; index--) {
            if (this.data[key][index] === file) {
                this.data[key].splice(index, 1);
            }
        }
    }
    removeFile(file) {
        if (Object.prototype.hasOwnProperty.call(this.data, file)) {
            delete this.data[file];
        }
        this.removeLink(file);
    }
    removeLink(file) {
        (0, util_1.eachObject)(this.data, items => {
            for (let index = items.length - 1; index >= 0; index--) {
                if (items[index] === file) {
                    items.splice(index, 1);
                }
            }
        });
    }
}
exports.LinkManager = LinkManager;
