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
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatThemeCss = exports.themeCss = exports.cssToScss = exports.splitRuleName = exports.cssToJson = void 0;
var iterator_1 = require("./iterator");
var util_1 = require("./util");
var BLOCK_TYPE;
(function (BLOCK_TYPE) {
    BLOCK_TYPE[BLOCK_TYPE["COMMENT"] = 0] = "COMMENT";
    BLOCK_TYPE[BLOCK_TYPE["CHASET"] = 1] = "CHASET";
    BLOCK_TYPE[BLOCK_TYPE["IMPORT"] = 2] = "IMPORT";
    BLOCK_TYPE[BLOCK_TYPE["INCLUDE"] = 3] = "INCLUDE";
    BLOCK_TYPE[BLOCK_TYPE["TEXT"] = 4] = "TEXT";
    BLOCK_TYPE[BLOCK_TYPE["STYLE_GROUP"] = 5] = "STYLE_GROUP";
    BLOCK_TYPE[BLOCK_TYPE["STYLE"] = 6] = "STYLE";
})(BLOCK_TYPE || (BLOCK_TYPE = {}));
var isEmptyCode = function (code) {
    return code === ' ' || code === '\r' || code === '\n' || code === '\t';
};
function cssToJson(content) {
    var reader = new iterator_1.CharIterator(content);
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
        return {
            type: BLOCK_TYPE.COMMENT,
            text: text.trim(),
        };
    };
    var getTextBlock = function (line) {
        if (line.indexOf('@charset') >= 0) {
            return {
                type: BLOCK_TYPE.CHASET,
                text: line.replace(/@charset\s*/, '')
            };
        }
        if (line.indexOf('@import') >= 0) {
            return {
                type: BLOCK_TYPE.IMPORT,
                text: line.replace(/@import\s*/, '')
            };
        }
        if (line.indexOf('@include') >= 0) {
            return {
                type: BLOCK_TYPE.INCLUDE,
                text: line.replace(/@include\s*/, '')
            };
        }
        var args = line.split(':', 2);
        if (args.length === 2) {
            return {
                type: BLOCK_TYPE.STYLE,
                name: args[0].trim(),
                value: args[1].trim(),
            };
        }
        if (line.trim().length < 1) {
            return false;
        }
        return {
            type: BLOCK_TYPE.TEXT,
            text: line,
        };
    };
    var getBlock = function () {
        var endIndex = reader.indexOf(';');
        var blockStart = reader.indexOf('{');
        if (endIndex > 0 && (blockStart < 0 || blockStart > endIndex)) {
            var line = reader.readRange(endIndex);
            reader.index = endIndex;
            return getTextBlock(line);
        }
        var endMap = [reader.indexOf('}'), reader.indexOf('//'), reader.indexOf('/*')].filter(function (i) { return i > 0; });
        var blockEnd = endMap.length < 1 ? -1 : Math.min.apply(Math, endMap);
        if (blockEnd > 0 && (blockStart < 0 || blockStart > blockEnd)) {
            var line = reader.readRange(blockEnd);
            reader.index = blockEnd - 1;
            return getTextBlock(line);
        }
        if (blockStart < 0) {
            var line = reader.readRange();
            reader.moveEnd();
            return getTextBlock(line);
        }
        var name = reader.readRange(blockStart);
        reader.index = blockStart;
        return {
            type: BLOCK_TYPE.STYLE_GROUP,
            name: name.split(',').map(function (i) { return i.trim(); }).filter(function (i) { return i.length > 0; }),
            children: parserBlocks()
        };
    };
    var parserBlock = function () {
        var code;
        while (reader.canNext) {
            code = reader.next();
            if (isEmptyCode(code)) {
                continue;
            }
            if (code === '/' && isComment()) {
                return getCommentBock();
            }
            if (code === '}') {
                return true;
            }
            return getBlock();
        }
        return false;
    };
    var parserBlocks = function () {
        var items = [];
        while (reader.canNext) {
            var item = parserBlock();
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
function blockToString(items, level, indent) {
    if (level === void 0) { level = 1; }
    if (indent === void 0) { indent = '    '; }
    var spaces = indent.length > 0 ? indent.repeat(level - 1) : indent;
    var lines = [];
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
        if (item.type === BLOCK_TYPE.CHASET) {
            lines.push(spaces + '@charset ' + item.text + ';');
            continue;
        }
        if (item.type === BLOCK_TYPE.TEXT) {
            lines.push(spaces + item.text + ';');
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
        if (item.type === BLOCK_TYPE.IMPORT) {
            lines.push(spaces + '@import ' + item.text + ';');
            continue;
        }
        if (item.type === BLOCK_TYPE.INCLUDE) {
            lines.push(spaces + '@include ' + item.text + ';');
            continue;
        }
        if (item.type === BLOCK_TYPE.STYLE) {
            lines.push(spaces + item.name + ': ' + item.value + ';');
        }
        if (item.type === BLOCK_TYPE.STYLE_GROUP) {
            lines.push(spaces + (typeof item.name === 'object' ? item.name.join(',' + util_1.LINE_SPLITE + spaces) : item.name) + ' {');
            lines.push(blockToString(item.children, level + 1, indent));
            lines.push(spaces + '}');
        }
    }
    return util_1.joinLine(lines);
}
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
function themeCss(items) {
    var themeOption = {};
    var isThemeDef = function (item) {
        return item.type === BLOCK_TYPE.STYLE_GROUP && item.name[0].indexOf('@theme ') === 0;
    };
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
    var isThemeStyle = function (item) {
        return item.type === BLOCK_TYPE.STYLE && item.value.indexOf('@') === 0;
    };
    var themeStyle = function (item, theme) {
        if (theme === void 0) { theme = 'default'; }
        var name = item.value.substr(1).trim();
        if (!themeOption[theme][name]) {
            throw "[" + theme + "]." + name + " is error value";
        }
        return themeOption[theme][name];
    };
    var defaultStyle = function (item) {
        return themeStyle(item);
    };
    var splitThemeStyle = function (data) {
        var source = [];
        var append = [];
        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
            var item = data_1[_i];
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
    var _a = splitThemeStyle(sourceItems), finishItems = _a[0], appendItems = _a[1];
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
            if (item.name[0].indexOf('body') === 0) {
                item.name[0] = item.name[0].replace('body', 'body' + cls);
            }
            finishItems.push(item);
        }
    });
    return finishItems;
}
exports.themeCss = themeCss;
function formatThemeCss(content) {
    if (content.trim().length < 1) {
        return content;
    }
    var items = cssToJson(content);
    items = themeCss(items);
    return blockToString(items);
}
exports.formatThemeCss = formatThemeCss;
