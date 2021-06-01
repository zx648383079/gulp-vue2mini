"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatThemeCss = exports.themeCss = exports.separateThemeStyle = exports.cssToScss = exports.splitRuleName = exports.blockToString = exports.cssToJson = void 0;
var iterator_1 = require("./iterator");
var util_1 = require("./util");
var BLOCK_TYPE;
(function (BLOCK_TYPE) {
    BLOCK_TYPE[BLOCK_TYPE["COMMENT"] = 0] = "COMMENT";
    BLOCK_TYPE[BLOCK_TYPE["CHASET"] = 1] = "CHASET";
    BLOCK_TYPE[BLOCK_TYPE["IMPORT"] = 2] = "IMPORT";
    BLOCK_TYPE[BLOCK_TYPE["INCLUDE"] = 3] = "INCLUDE";
    BLOCK_TYPE[BLOCK_TYPE["EXTEND"] = 4] = "EXTEND";
    BLOCK_TYPE[BLOCK_TYPE["USE"] = 5] = "USE";
    BLOCK_TYPE[BLOCK_TYPE["TEXT"] = 6] = "TEXT";
    BLOCK_TYPE[BLOCK_TYPE["STYLE_GROUP"] = 7] = "STYLE_GROUP";
    BLOCK_TYPE[BLOCK_TYPE["STYLE"] = 8] = "STYLE";
})(BLOCK_TYPE || (BLOCK_TYPE = {}));
var TYPE_CONVERTER_MAP = (_a = {},
    _a[BLOCK_TYPE.EXTEND] = '@extend',
    _a[BLOCK_TYPE.CHASET] = '@charset',
    _a[BLOCK_TYPE.USE] = '@use',
    _a[BLOCK_TYPE.IMPORT] = '@import',
    _a[BLOCK_TYPE.INCLUDE] = '@include',
    _a);
var isEmptyCode = function (code) {
    return code === ' ' || isLineCode(code) || code === '\t';
};
var isLineCode = function (code) {
    return code === '\r' || code === '\n';
};
function cssToJson(content) {
    var reader = new iterator_1.CharIterator(content);
    var isIndent = content.indexOf('{') < 0;
    var indentSize = function (pos) {
        if (pos === void 0) { pos = reader.index; }
        var count = 0;
        while (pos < reader.length) {
            var code = reader.readSeek(pos++);
            if (isLineCode(code)) {
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
    var jumpEmptyLine = function (source) {
        var code = reader.readSeek(source);
        if (code == '\n') {
            source += 1;
        }
        else if (code == '\r') {
            source += reader.readSeek(source + 1) === '\n' ? 2 : 1;
        }
        else if (!isEmptyCode(code)) {
            return source;
        }
        var pos = source;
        while (pos < reader.length - 1) {
            code = reader.readSeek(++pos);
            if (isLineCode(code)) {
                return jumpEmptyLine(pos);
            }
            if (!isEmptyCode(code)) {
                return source;
            }
        }
        return pos;
    };
    var nextIndentSize = function (pos) {
        if (pos === void 0) { pos = reader.index; }
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
                    if (!isLineCode(code)) {
                        continue;
                    }
                    return indentSize(jumpEmptyLine(pos));
                }
            }
            if (!inComment && isLineCode(code)) {
                return indentSize(jumpEmptyLine(pos));
            }
        }
        return 0;
    };
    var moveNewLine = function () {
        var pos = reader.index;
        var newPos = jumpEmptyLine(pos);
        if (newPos === pos) {
            return false;
        }
        reader.index = newPos - 1;
        return false;
    };
    var lineEndIsComma = function (end, start) {
        if (start === void 0) { start = 0; }
        while (end > start) {
            var code = reader.readSeek(--end);
            if (code === ',') {
                return true;
            }
            if (!isLineCode(code)) {
                return false;
            }
        }
        return false;
    };
    var getPreviousLine = function (start, end) {
        if (end === void 0) { end = 0; }
        while (start > end) {
            var code = reader.readSeek(--start);
            if (isLineCode(code)) {
                return start;
            }
        }
        return -1;
    };
    var isComment = function () {
        var tag = reader.read(2);
        if (tag === '//') {
            return true;
        }
        if (tag !== '//' && tag !== '/*') {
            return false;
        }
        return reader.indexOf('*/', 2) > 0;
    };
    var getCommentBock = function () {
        var tag = reader.read(2);
        var start = reader.index + 2;
        var end = reader.indexOf(tag === '//' ? '\n' : '*/', 2);
        if (tag !== '//' && end < 0) {
            end = content.length;
        }
        var text = reader.read(end - start, 2);
        reader.index = end + (tag === '//' ? 0 : 1);
        if (isIndent && tag === '/*') {
            moveNewLine();
        }
        return {
            type: BLOCK_TYPE.COMMENT,
            text: text.trim(),
        };
    };
    var getTextBlock = function (line) {
        line = line.trim();
        for (var key in TYPE_CONVERTER_MAP) {
            if (Object.prototype.hasOwnProperty.call(TYPE_CONVERTER_MAP, key)) {
                var search = TYPE_CONVERTER_MAP[key];
                if (line.startsWith(search)) {
                    return {
                        type: key,
                        text: line.substr(search.length).trim(),
                    };
                }
            }
        }
        var args = line.split(':', 2);
        if (args.length === 2) {
            return {
                type: BLOCK_TYPE.STYLE,
                name: args[0].trim(),
                value: args[1].trim(),
            };
        }
        if (line.length < 1) {
            return false;
        }
        return {
            type: BLOCK_TYPE.TEXT,
            text: line,
        };
    };
    var getMultipleName = function (end) {
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
        while (reader.canNext && reader.index < end) {
            var code = reader.next();
            if (code === '{') {
                break;
            }
            if (isComment()) {
                commentItems.push(getCommentBock());
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
    var minIndex = function () {
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
    var getBlock = function (indentLength) {
        var blockStart;
        var endIndex;
        if (isIndent) {
            endIndex = minIndex(reader.indexOf('\n'), reader.indexOf('\r'), reader.length, reader.indexOf('//') - 1, reader.indexOf('/*') - 1);
            var lineIndentLength = indentSize();
            var nextIndentLength = nextIndentSize();
            if (lineIndentLength === indentLength) {
                if (nextIndentLength < lineIndentLength) {
                    var line = reader.readRange(endIndex);
                    reader.index = endIndex;
                    return getTextBlock(line);
                }
                if (nextIndentLength === lineIndentLength) {
                    if (!lineEndIsComma(endIndex, reader.index)) {
                        var line = reader.readRange(endIndex);
                        reader.index = endIndex;
                        return getTextBlock(line);
                    }
                    var pos = reader.index;
                    while (reader.canNext) {
                        var code = reader.next();
                        if (!isLineCode(code)) {
                            continue;
                        }
                        moveNewLine();
                        nextIndentLength = indentSize();
                        if (nextIndentLength > indentLength) {
                            break;
                        }
                    }
                    endIndex = reader.index;
                    reader.index = pos;
                }
            }
            blockStart = endIndex;
            indentLength = nextIndentLength;
        }
        else {
            var endIndex_1 = reader.indexOf(';');
            blockStart = reader.indexOf('{');
            if (endIndex_1 > 0 && (blockStart < 0 || blockStart > endIndex_1)) {
                var line = reader.readRange(endIndex_1);
                reader.index = endIndex_1;
                return getTextBlock(line);
            }
            var blockEnd = minIndex(reader.indexOf('}'), reader.indexOf('//'), reader.indexOf('/*'));
            var commaIndex = reader.indexOf(',');
            if (commaIndex > 0 && (blockStart < 0 || blockStart > commaIndex) && (endIndex_1 < 0 || commaIndex < endIndex_1) && blockEnd >= 0 && commaIndex < blockEnd) {
                var lineIndex = minIndex(reader.indexOf('\n'), reader.indexOf('\r'));
                if (lineIndex >= 0 && lineIndex < commaIndex) {
                    var line = reader.readRange(lineIndex);
                    reader.index = lineIndex - 1;
                    return getTextBlock(line);
                }
            }
            else {
                if (blockEnd >= 0 && (blockStart < 0 || blockStart > blockEnd)) {
                    var line = reader.readRange(blockEnd);
                    reader.index = blockEnd - 1;
                    return getTextBlock(line);
                }
                if (blockStart >= 0 && blockStart < blockEnd) {
                    blockEnd = getPreviousLine(blockStart, reader.index);
                    if (blockEnd > 0) {
                        var line = reader.readRange(blockEnd);
                        reader.index = blockEnd - 1;
                        return getTextBlock(line);
                    }
                }
            }
            if (blockStart < 0) {
                var line = reader.readRange();
                reader.moveEnd();
                return getTextBlock(line);
            }
        }
        var _a = getMultipleName(blockStart), nameItems = _a[0], comments = _a[1];
        if (isIndent) {
            moveNewLine();
        }
        return {
            type: BLOCK_TYPE.STYLE_GROUP,
            name: nameItems,
            children: __spreadArray(__spreadArray([], comments), parserBlocks(indentLength)),
        };
    };
    var parserBlock = function (indentLength) {
        var code;
        while (reader.canNext) {
            if (isIndent) {
                if (moveNewLine()) {
                    return indentLength > 0;
                }
                if (indentSize(reader.index) < indentLength) {
                    return true;
                }
            }
            code = reader.next();
            if (!isIndent && isEmptyCode(code)) {
                continue;
            }
            if (code === '/' && isComment()) {
                return getCommentBock();
            }
            if (!isIndent && code === '}') {
                return true;
            }
            return getBlock(indentLength);
        }
        return false;
    };
    var parserBlocks = function (indentLength) {
        if (indentLength === void 0) { indentLength = 0; }
        var items = [];
        while (reader.canNext) {
            var item = parserBlock(indentLength);
            if (item === true) {
                break;
            }
            if (item) {
                items.push(item);
            }
        }
        return items;
    };
    return parserBlocks();
}
exports.cssToJson = cssToJson;
function blockToString(items, level, indent, isIndent) {
    if (level === void 0) { level = 1; }
    if (indent === void 0) { indent = '    '; }
    if (isIndent === void 0) { isIndent = false; }
    var spaces = indent.length > 0 ? indent.repeat(level - 1) : indent;
    var lines = [];
    var endTextJoin = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        if (isIndent) {
            return items.join('');
        }
        return items.join('') + ';';
    };
    if (level > 1) {
        items = items.sort(function (a, b) {
            if (a.type === b.type) {
                return 0;
            }
            if (a.type === BLOCK_TYPE.STYLE_GROUP) {
                return 1;
            }
            if (b.type === BLOCK_TYPE.STYLE_GROUP) {
                return -1;
            }
            return 0;
        });
    }
    for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
        var item = items_1[_i];
        if (item.type === BLOCK_TYPE.TEXT) {
            lines.push(endTextJoin(spaces, item.text));
            continue;
        }
        if (item.type === BLOCK_TYPE.COMMENT) {
            var text = item.text;
            if (text.indexOf('\n') < 0) {
                lines.push(spaces + '// ' + item.text);
                continue;
            }
            lines.push(spaces + '/* ' + util_1.splitLine(text).map(function (i) { return i.trim(); }).join(util_1.LINE_SPLITE + spaces) + ' */');
            continue;
        }
        if (Object.prototype.hasOwnProperty.call(TYPE_CONVERTER_MAP, item.type)) {
            lines.push(endTextJoin(spaces, TYPE_CONVERTER_MAP[item.type], ' ', item.text));
            continue;
        }
        if (item.type === BLOCK_TYPE.STYLE) {
            lines.push(endTextJoin(spaces, item.name, ': ', item.value));
            continue;
        }
        if (item.type === BLOCK_TYPE.STYLE_GROUP) {
            lines.push(spaces + (typeof item.name === 'object' ? item.name.join(',' + util_1.LINE_SPLITE + spaces) : item.name) + (isIndent ? '' : ' {'));
            lines.push(blockToString(item.children, level + 1, indent, isIndent));
            if (!isIndent) {
                lines.push(spaces + '}');
            }
        }
    }
    return util_1.joinLine(lines);
}
exports.blockToString = blockToString;
function splitRuleName(name) {
    name = name.trim();
    if (name.length < 2) {
        return [name];
    }
    var tags = {
        '[': ']',
        '(': ')',
    };
    var args = [];
    var tag = '';
    var pos = 0;
    if (name.charAt(pos) === '&') {
        var k = name.charAt(pos + 1);
        var i = pos + 1;
        while (i < name.length) {
            if (name.charAt(++i) !== k) {
                break;
            }
        }
        tag = name.substring(pos, i);
        pos = i + 1;
    }
    var appendTag = function () {
        var item = tag.trim();
        tag = '';
        if (item.length < 1) {
            return;
        }
        var c = item.charAt(0);
        if (c === '&') {
            args.push(item);
            return;
        }
        if (c === '>' || c === '+' || c === '~') {
            args.push('&' + item);
            return;
        }
        args.push(item);
    };
    var startTag = '';
    var endTag = '';
    var endCount = 0;
    while (pos < name.length) {
        var code = name.charAt(pos);
        pos++;
        if (endCount > 0) {
            tag += code;
            if (code === startTag) {
                endCount++;
            }
            else if (code === endTag) {
                endCount--;
            }
            continue;
        }
        if (Object.prototype.hasOwnProperty.call(tags, code)) {
            startTag = code;
            endTag = tags[code];
            endCount = 1;
            tag += code;
            continue;
        }
        if (code === '>' || code === '~' || code === '+') {
            appendTag();
            var i = pos;
            while (i < name.length) {
                if (!isEmptyCode(name.charAt(i))) {
                    break;
                }
                i++;
            }
            tag = (args.length > 0 ? '&' : '') + code;
            pos = i;
            continue;
        }
        if (code === '.') {
            appendTag();
            tag = (args.length > 0 && !isEmptyCode(name.charAt(pos - 2)) ? '&' : '') + code;
            continue;
        }
        if (code === ':') {
            appendTag();
            var i = pos;
            while (i < name.length) {
                if (name.charAt(++i) !== ':') {
                    break;
                }
            }
            tag = (args.length > 0 ? '&' : '') + name.substring(pos - 1, i);
            pos = i;
            continue;
        }
        if (isEmptyCode(code)) {
            appendTag();
            tag = '';
            continue;
        }
        tag += code;
    }
    appendTag();
    return args;
}
exports.splitRuleName = splitRuleName;
function splitBlock(items) {
    var data = [];
    var resetName = function (names) {
        return names.map(function (i) {
            return i.indexOf('&') === 0 ? i.substring(1) : (' ' + i);
        }).join('');
    };
    var findTreeName = function (names) {
        if (names.length < 2) {
            return splitRuleName(names[0]).map(function (i) {
                return [i];
            });
        }
        var args = [];
        var cache = [];
        var getName = function (i, j) {
            if (cache.length <= i) {
                cache.push(splitRuleName(names[i]));
            }
            var pos = cache[i].length - 1 - j;
            if (pos < 0) {
                return '';
            }
            return cache[i][pos];
        };
        var index = 0;
        iloop: while (true) {
            var name_1 = getName(0, index);
            if (name_1 === '') {
                break;
            }
            for (var i = 1; i < names.length; i++) {
                if (name_1 !== getName(i, index)) {
                    break iloop;
                }
            }
            args.push([name_1]);
            index++;
        }
        index = args.length;
        if (index < 1) {
            return [names];
        }
        args.push(names.map(function (i, j) {
            var c = cache.length > j ? cache[j] : splitRuleName(i);
            return resetName(c.splice(0, c.length - index));
        }));
        return args.reverse();
    };
    var arrEq = function (a, b) {
        if (a.length !== b.length) {
            return false;
        }
        for (var _i = 0, a_1 = a; _i < a_1.length; _i++) {
            var i = a_1[_i];
            if (b.indexOf(i) < 0) {
                return false;
            }
        }
        return true;
    };
    var mergeStyle = function (parent, children) {
        children.forEach(function (i) {
            if (i.type !== BLOCK_TYPE.STYLE) {
                parent.push(i);
                return;
            }
            for (var _i = 0, parent_1 = parent; _i < parent_1.length; _i++) {
                var j = parent_1[_i];
                if (j.type === BLOCK_TYPE.STYLE && j.name === i.name) {
                    j.value = i.value;
                    return;
                }
            }
            parent.push(i);
        });
    };
    var appendBlock = function (names, children, parent) {
        if (names.length < 1) {
            mergeStyle(parent, children);
            return;
        }
        var name = names.shift();
        for (var _i = 0, parent_2 = parent; _i < parent_2.length; _i++) {
            var item = parent_2[_i];
            if (item.type !== BLOCK_TYPE.STYLE_GROUP) {
                continue;
            }
            if (!arrEq(name, item.name)) {
                continue;
            }
            if (!item.children) {
                item.children = [];
            }
            appendBlock(names, children, item.children);
            return;
        }
        var block = {
            type: BLOCK_TYPE.STYLE_GROUP,
            name: name,
            children: []
        };
        parent.push(block);
        appendBlock(names, children, block.children);
    };
    var createTree = function (item, parent) {
        if (item.type !== BLOCK_TYPE.STYLE_GROUP) {
            parent.push(item);
            return;
        }
        var name = findTreeName(typeof item.name === 'object' ? item.name : [item.name]);
        appendBlock(name, item.children, parent);
    };
    for (var _i = 0, items_2 = items; _i < items_2.length; _i++) {
        var item = items_2[_i];
        createTree(item, data);
    }
    return data;
}
function cssToScss(content) {
    var items = cssToJson(content);
    var blocks = splitBlock(items);
    return blockToString(blocks);
}
exports.cssToScss = cssToScss;
function isThemeDef(item) {
    return item.type === BLOCK_TYPE.STYLE_GROUP && item.name[0].indexOf('@theme ') === 0;
}
;
function separateThemeStyle(items) {
    var themeOption = {};
    var appendTheme = function (item) {
        var _a;
        var name = item.name[0].substr(7).trim();
        if (!themeOption[name]) {
            themeOption[name] = {};
        }
        (_a = item.children) === null || _a === void 0 ? void 0 : _a.forEach(function (i) {
            if (i.type === BLOCK_TYPE.STYLE) {
                themeOption[name][i.name] = i.value;
            }
        });
    };
    var sourceItems = [];
    for (var _i = 0, items_3 = items; _i < items_3.length; _i++) {
        var item = items_3[_i];
        if (isThemeDef(item)) {
            appendTheme(item);
            continue;
        }
        sourceItems.push(item);
    }
    return [themeOption, sourceItems];
}
exports.separateThemeStyle = separateThemeStyle;
function themeCss(items, themeOption) {
    var _a;
    if (!themeOption) {
        _a = separateThemeStyle(items), themeOption = _a[0], items = _a[1];
    }
    var isThemeStyle = function (item) {
        if (item.type !== BLOCK_TYPE.STYLE) {
            return false;
        }
        for (var _i = 0, _a = item.value.split(' '); _i < _a.length; _i++) {
            var val = _a[_i];
            val = val.trim();
            if (val.charAt(0) === '@' && val.length > 1) {
                return true;
            }
        }
        return false;
    };
    var themeStyleValue = function (name, theme) {
        var _a;
        if (theme === void 0) { theme = 'default'; }
        if (themeOption[theme][name]) {
            return themeOption[theme][name];
        }
        if (name.indexOf('.') >= 0) {
            _a = name.split('.', 2), theme = _a[0], name = _a[1];
            if (themeOption[theme][name]) {
                return themeOption[theme][name];
            }
        }
        throw "[" + theme + "]." + name + " is error value";
    };
    var themeStyle = function (item, theme) {
        if (theme === void 0) { theme = 'default'; }
        var block = [];
        item.value.split(' ').forEach(function (val) {
            val = val.trim();
            if (val.length < 1) {
                return;
            }
            if (val.charAt(0) === '@' && val.length > 1) {
                block.push(themeStyleValue(val.substr(1), theme));
                return;
            }
            block.push(val);
        });
        return block.join(' ');
    };
    var defaultStyle = function (item) {
        return themeStyle(item);
    };
    var splitThemeStyle = function (data) {
        var source = [];
        var append = [];
        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
            var item = data_1[_i];
            if (isThemeDef(item)) {
                continue;
            }
            if (isThemeStyle(item)) {
                append.push(__assign({}, item));
                item.value = defaultStyle(item);
            }
            if (item.type !== BLOCK_TYPE.STYLE_GROUP || !item.children || item.children.length < 1) {
                source.push(item);
                continue;
            }
            var _a = splitThemeStyle(item.children), s = _a[0], a = _a[1];
            if (a.length > 0) {
                append.push(__assign(__assign({}, item), { children: a }));
            }
            source.push(__assign(__assign({}, item), { children: s }));
        }
        return [source, append];
    };
    var _b = splitThemeStyle(items), finishItems = _b[0], appendItems = _b[1];
    if (appendItems.length < 1) {
        return finishItems;
    }
    var cloneStyle = function (data, theme) {
        var children = [];
        for (var _i = 0, data_2 = data; _i < data_2.length; _i++) {
            var item = data_2[_i];
            if (isThemeStyle(item)) {
                children.push(__assign(__assign({}, item), { value: themeStyle(item, theme) }));
                continue;
            }
            if (item.type !== BLOCK_TYPE.STYLE_GROUP) {
                children.push(item);
                continue;
            }
            children.push(__assign(__assign({}, item), { name: __spreadArray([], item.name), children: cloneStyle(item.children, theme) }));
        }
        return children;
    };
    Object.keys(themeOption).forEach(function (theme) {
        if (theme === 'default') {
            return;
        }
        var children = cloneStyle(appendItems, theme);
        var cls = '.theme-' + theme;
        for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
            var item = children_1[_i];
            if (item.type !== BLOCK_TYPE.STYLE_GROUP) {
                continue;
            }
            item.name = item.name.map(function (i) {
                if (i.trim() === 'body') {
                    return 'body' + cls;
                }
                return cls + ' ' + i;
            });
            finishItems.push(item);
        }
    });
    return finishItems;
}
exports.themeCss = themeCss;
function formatThemeCss(content) {
    var items;
    if (typeof content !== 'object') {
        if (content.trim().length < 1) {
            return content;
        }
        items = cssToJson(content);
    }
    else {
        items = content;
    }
    items = themeCss(items);
    return blockToString(items);
}
exports.formatThemeCss = formatThemeCss;
