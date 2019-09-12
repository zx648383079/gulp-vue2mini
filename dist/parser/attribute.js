"use strict";
exports.__esModule = true;
var Attribute = (function () {
    function Attribute(items) {
        if (items === void 0) { items = {}; }
        this.items = items;
    }
    Attribute.prototype.get = function (key) {
        return this.items.hasOwnProperty(key) ? this.items[key] : undefined;
    };
    Attribute.prototype.set = function (key, value) {
        if (typeof key === 'object') {
            Object.assign(this.items, key);
            return this;
        }
        if (typeof value === 'undefined') {
            return this["delete"](key);
        }
        this.items[key] = value;
        return this;
    };
    Attribute.prototype.filter = function (cb) {
        for (var key in this.items) {
            if (this.items.hasOwnProperty(key) && cb(key, this.items[key]) === true) {
                delete this.items[key];
            }
        }
        return this;
    };
    Attribute.prototype["delete"] = function (key) {
        delete this.items[key];
        return this;
    };
    Attribute.prototype.on = function (keys, cb) {
        var _this = this;
        if (typeof keys === 'object') {
            keys.forEach(function (key) {
                _this.on(key, cb);
            });
            return this;
        }
        if (!this.items.hasOwnProperty(keys)) {
            return this;
        }
        var val = cb(this.items[keys], keys);
        if (typeof val === 'undefined') {
            delete this.items[keys];
            return this;
        }
        if (typeof val !== 'object') {
            this.items[keys] = val;
            return this;
        }
        if (val instanceof Array) {
            delete this.items[keys];
            this.items[val[0]] = val[1];
            return this;
        }
        this.items = Object.assign(this.items, val);
        return this;
    };
    Attribute.prototype.map = function (cb) {
        for (var key in this.items) {
            if (this.items.hasOwnProperty(key)) {
                cb(key, this.items[key]);
            }
        }
        return this;
    };
    Attribute.prototype.toString = function () {
        var data = [];
        this.map(function (key, value) {
            if (typeof value === 'undefined' || value === false) {
                return;
            }
            if (value === true) {
                data.push(key);
                return;
            }
            if (Array.isArray(value)) {
                value = value.join(' ');
            }
            ;
            data.push(key + "=\"" + value + "\"");
        });
        return data.join(' ');
    };
    Attribute.create = function (attribute) {
        if (!attribute) {
            return new Attribute();
        }
        if (attribute instanceof Attribute) {
            return attribute;
        }
        return new Attribute(attribute);
    };
    return Attribute;
}());
exports.Attribute = Attribute;
