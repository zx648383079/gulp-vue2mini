"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StyleTokenizer = exports.StyleTokenCoverter = exports.StyleTokenType = void 0;
var iterator_1 = require("../iterator");
var util_1 = require("../util");
var StyleTokenType;
(function (StyleTokenType) {
    StyleTokenType[StyleTokenType["COMMENT"] = 0] = "COMMENT";
    StyleTokenType[StyleTokenType["CHASET"] = 1] = "CHASET";
    StyleTokenType[StyleTokenType["IMPORT"] = 2] = "IMPORT";
    StyleTokenType[StyleTokenType["INCLUDE"] = 3] = "INCLUDE";
    StyleTokenType[StyleTokenType["EXTEND"] = 4] = "EXTEND";
    StyleTokenType[StyleTokenType["USE"] = 5] = "USE";
    StyleTokenType[StyleTokenType["TEXT"] = 6] = "TEXT";
    StyleTokenType[StyleTokenType["STYLE_GROUP"] = 7] = "STYLE_GROUP";
    StyleTokenType[StyleTokenType["STYLE"] = 8] = "STYLE";
})(StyleTokenType = exports.StyleTokenType || (exports.StyleTokenType = {}));
exports.StyleTokenCoverter = (_a = {},
    _a[StyleTokenType.EXTEND] = '@extend',
    _a[StyleTokenType.CHASET] = '@charset',
    _a[StyleTokenType.USE] = '@use',
    _a[StyleTokenType.IMPORT] = '@import',
    _a[StyleTokenType.INCLUDE] = '@include',
    _a);
var StyleTokenizer = (function () {
    function StyleTokenizer(isIndent) {
        var _this = this;
        if (isIndent === void 0) { isIndent = false; }
        this.isIndent = isIndent;
        this.parserBlock = function (reader, indentLength) {
            var code;
            while (reader.canNext) {
                if (_this.isIndent) {
                    if (_this.moveNewLine(reader)) {
                        return indentLength > 0;
                    }
                    if (_this.indentSize(reader, reader.position) < indentLength) {
                        return true;
                    }
                }
                reader.moveNext();
                code = reader.current;
                if (!_this.isIndent && (0, util_1.isEmptyCode)(code)) {
                    continue;
                }
                if (code === '/' && _this.isComment(reader)) {
                    return _this.getCommentBock(reader);
                }
                if (!_this.isIndent && code === '}') {
                    return true;
                }
                return _this.getBlock(reader, indentLength);
            }
            return false;
        };
        this.getBlock = function (reader, indentLength) {
            if (_this.isIndent) {
                return _this.getSassBlock(reader, indentLength);
            }
            var blockStart;
            var endIndex = reader.indexOf(';');
            blockStart = reader.indexOf('{');
            if (endIndex > 0 && (blockStart < 0 || blockStart > endIndex)) {
                var line = reader.readRange(endIndex);
                reader.position = endIndex;
                return _this.getTextBlock(line);
            }
            var blockEnd = _this.minIndex(reader.indexOf('}'), reader.indexOf('//'), reader.indexOf('/*'));
            var commaIndex = reader.indexOf(',');
            if (commaIndex > 0 && (blockStart < 0 || blockStart > commaIndex) && (endIndex < 0 || commaIndex < endIndex) && blockEnd >= 0 && commaIndex < blockEnd) {
                var lineIndex = _this.minIndex(reader.indexOf('\n'), reader.indexOf('\r'));
                if (lineIndex >= 0 && lineIndex < commaIndex) {
                    var line = reader.readRange(lineIndex);
                    reader.position = lineIndex - 1;
                    return _this.getTextBlock(line);
                }
            }
            else {
                if (blockEnd >= 0 && (blockStart < 0 || blockStart > blockEnd)) {
                    var line = reader.readRange(blockEnd);
                    reader.position = blockEnd - 1;
                    return _this.getTextBlock(line);
                }
                if (blockStart >= 0 && blockStart < blockEnd) {
                    blockEnd = _this.getPreviousLine(reader, blockStart, reader.position);
                    if (blockEnd > 0) {
                        var line = reader.readRange(blockEnd);
                        reader.position = blockEnd - 1;
                        return _this.getTextBlock(line);
                    }
                }
            }
            if (blockStart < 0) {
                var line = reader.readRange();
                reader.moveEnd();
                return _this.getTextBlock(line);
            }
            var _a = _this.getMultipleName(reader, blockStart), nameItems = _a[0], comments = _a[1];
            return {
                type: StyleTokenType.STYLE_GROUP,
                name: nameItems,
                children: __spreadArray(__spreadArray([], comments, true), _this.renderBlock(reader, indentLength), true),
            };
        };
        this.minIndex = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var items = args.filter(function (i) { return i >= 0; });
            if (items.length < 1) {
                return -1;
            }
            return Math.min.apply(Math, items);
        };
    }
    StyleTokenizer.prototype.autoIndent = function (content) {
        this.isIndent = content.indexOf('{') < 0;
    };
    StyleTokenizer.prototype.render = function (content) {
        var reader = content instanceof iterator_1.CharIterator ? content : new iterator_1.CharIterator(content);
        reader.reset();
        return this.renderBlock(reader);
    };
    StyleTokenizer.prototype.renderBlock = function (reader, indentLength) {
        if (indentLength === void 0) { indentLength = 0; }
        var items = [];
        while (reader.canNext) {
            var item = this.parserBlock(reader, indentLength);
            if (item === true) {
                break;
            }
            if (item) {
                items.push(item);
            }
        }
        return items;
    };
    StyleTokenizer.prototype.getPreviousLine = function (reader, start, end) {
        if (end === void 0) { end = 0; }
        while (start > end) {
            var code = reader.readSeek(--start);
            if ((0, util_1.isLineCode)(code)) {
                return start;
            }
        }
        return -1;
    };
    StyleTokenizer.prototype.isComment = function (reader) {
        var tag = reader.read(2);
        if (tag === '//') {
            return true;
        }
        if (tag !== '//' && tag !== '/*') {
            return false;
        }
        return reader.indexOf('*/', 2) > 0;
    };
    StyleTokenizer.prototype.getCommentBock = function (reader) {
        var tag = reader.read(2);
        var start = reader.position + 2;
        var end = reader.indexOf(tag === '//' ? '\n' : '*/', 2);
        if (tag !== '//' && end < 0) {
            end = reader.length;
        }
        var text = reader.read(end - start, 2);
        reader.position = end + (tag === '//' ? 0 : 1);
        if (this.isIndent && tag === '/*') {
            this.moveNewLine(reader);
        }
        return {
            type: StyleTokenType.COMMENT,
            content: text.trim(),
        };
    };
    StyleTokenizer.prototype.getTextBlock = function (line) {
        line = line.trim();
        for (var key in exports.StyleTokenCoverter) {
            if (Object.prototype.hasOwnProperty.call(exports.StyleTokenCoverter, key)) {
                var search = exports.StyleTokenCoverter[key];
                if (line.startsWith(search)) {
                    return {
                        type: key,
                        content: line.substring(search.length).trim(),
                    };
                }
            }
        }
        var args = line.split(':', 2);
        if (args.length === 2) {
            return {
                type: StyleTokenType.STYLE,
                name: args[0].trim(),
                content: args[1].trim(),
            };
        }
        if (line.length < 1) {
            return false;
        }
        return {
            type: StyleTokenType.TEXT,
            content: line,
        };
    };
    StyleTokenizer.prototype.getMultipleName = function (reader, end) {
        var commentItems = [];
        var nameItems = [];
        var name = '';
        var endPush = function () {
            name = name.trim();
            if (name.length > 0) {
                nameItems.push(name);
                name = '';
            }
        };
        reader.move(-1);
        while (reader.canNext && reader.position < end) {
            reader.moveNext();
            var code = reader.current;
            if (code === '{') {
                break;
            }
            if (this.isComment(reader)) {
                commentItems.push(this.getCommentBock(reader));
                continue;
            }
            if (code !== ',') {
                name += code;
                continue;
            }
            endPush();
        }
        endPush();
        return [nameItems, commentItems];
    };
    StyleTokenizer.prototype.getSassBlock = function (reader, indentLength) {
        var blockStart;
        var endIndex;
        endIndex = this.minIndex(reader.indexOf('\n'), reader.indexOf('\r'), reader.length, reader.indexOf('//') - 1, reader.indexOf('/*') - 1);
        var lineIndentLength = this.indentSize(reader);
        var nextIndentLength = this.nextIndentSize(reader);
        if (lineIndentLength === indentLength) {
            if (nextIndentLength < lineIndentLength) {
                var line = reader.readRange(endIndex);
                reader.position = endIndex;
                return this.getTextBlock(line);
            }
            if (nextIndentLength === lineIndentLength) {
                if (!this.lineEndIsComma(reader, endIndex, reader.position)) {
                    var line = reader.readRange(endIndex);
                    reader.position = endIndex;
                    return this.getTextBlock(line);
                }
                var pos = reader.position;
                while (reader.moveNext()) {
                    var code = reader.current;
                    if (!(0, util_1.isLineCode)(code)) {
                        continue;
                    }
                    this.moveNewLine(reader);
                    nextIndentLength = this.indentSize(reader);
                    if (nextIndentLength > indentLength) {
                        break;
                    }
                }
                endIndex = reader.position;
                reader.position = pos;
            }
        }
        blockStart = endIndex;
        indentLength = nextIndentLength;
        var _a = this.getMultipleName(reader, blockStart), nameItems = _a[0], comments = _a[1];
        this.moveNewLine(reader);
        return {
            type: StyleTokenType.STYLE_GROUP,
            name: nameItems,
            children: __spreadArray(__spreadArray([], comments, true), this.renderBlock(reader, indentLength), true),
        };
    };
    StyleTokenizer.prototype.indentSize = function (reader, pos) {
        if (pos === void 0) { pos = reader.position; }
        var count = 0;
        while (pos < reader.length) {
            var code = reader.readSeek(pos++);
            if ((0, util_1.isLineCode)(code)) {
                if (count > 0) {
                    break;
                }
                continue;
            }
            if (code === '\t') {
                count += 4;
                continue;
            }
            if (code === ' ') {
                count++;
                continue;
            }
            break;
        }
        return count;
    };
    StyleTokenizer.prototype.jumpEmptyLine = function (reader, source) {
        var code = reader.readSeek(source);
        if (code == '\n') {
            source += 1;
        }
        else if (code == '\r') {
            source += reader.readSeek(source + 1) === '\n' ? 2 : 1;
        }
        else if (!(0, util_1.isEmptyCode)(code)) {
            return source;
        }
        var pos = source;
        while (pos < reader.length - 1) {
            code = reader.readSeek(++pos);
            if ((0, util_1.isLineCode)(code)) {
                return this.jumpEmptyLine(reader, pos);
            }
            if (!(0, util_1.isEmptyCode)(code)) {
                return source;
            }
        }
        return pos;
    };
    StyleTokenizer.prototype.nextIndentSize = function (reader, pos) {
        if (pos === void 0) { pos = reader.position; }
        var inComment = false;
        var code;
        while (pos < reader.length) {
            code = reader.readSeek(++pos);
            if (!inComment && code === '/' && reader.readSeek(pos + 1) === '*') {
                inComment = true;
                pos += 1;
                continue;
            }
            if (inComment && code === '*' && reader.readSeek(pos + 1) === '/') {
                while (pos < reader.length) {
                    code = reader.readSeek(++pos);
                    if (!(0, util_1.isLineCode)(code)) {
                        continue;
                    }
                    return this.indentSize(reader, this.jumpEmptyLine(reader, pos));
                }
            }
            if (!inComment && (0, util_1.isLineCode)(code)) {
                return this.indentSize(reader, this.jumpEmptyLine(reader, pos));
            }
        }
        return 0;
    };
    StyleTokenizer.prototype.moveNewLine = function (reader) {
        var pos = reader.position;
        var newPos = this.jumpEmptyLine(reader, pos);
        if (newPos === pos) {
            return false;
        }
        reader.position = newPos - 1;
        return true;
    };
    StyleTokenizer.prototype.lineEndIsComma = function (reader, end, start) {
        if (start === void 0) { start = 0; }
        while (end > start) {
            var code = reader.readSeek(--end);
            if (code === ',') {
                return true;
            }
            if (!(0, util_1.isLineCode)(code)) {
                return false;
            }
        }
        return false;
    };
    return StyleTokenizer;
}());
exports.StyleTokenizer = StyleTokenizer;
