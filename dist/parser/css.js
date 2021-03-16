"use strict";
exports.__esModule = true;
exports.cssToScss = exports.cssToJson = void 0;
var tslib_1 = require("tslib");
var types_1 = require("./types");
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
function cssToJson(content) {
    var pos = -1;
    var isComment = function () {
        var tag = content.substr(pos, 2);
        if (tag === '//') {
            return true;
        }
        if (tag !== '//' && tag !== '/*') {
            return false;
        }
        return content.indexOf('*/', pos + 2) > 0;
    };
    var getCommentBock = function () {
        var tag = content.substr(pos, 2);
        var start = pos + 2;
        var end = content.indexOf(tag === '//' ? '\n' : '*/', start);
        if (tag !== '//' && end < 0) {
            end = content.length;
        }
        var text = content.substring(start, end);
        pos = end + (tag === '//' ? 0 : 2);
        return {
            type: BLOCK_TYPE.COMMENT,
            content: text.trim()
        };
    };
    var isEmpty = function (code) {
        return code === ' ' || code === '\r' || code === '\n' || code === '\t';
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
                value: args[1].trim()
            };
        }
        if (line.trim().length < 1) {
            return false;
        }
        return {
            type: BLOCK_TYPE.TEXT,
            text: line
        };
    };
    var getBlock = function () {
        var endIndex = content.indexOf(';', pos);
        var blockStart = content.indexOf('{', pos);
        if (endIndex > 0 && (blockStart < 0 || blockStart > endIndex)) {
            var line = content.substring(pos, endIndex);
            pos = endIndex;
            return getTextBlock(line);
        }
        if (blockStart < 0) {
            var line = content.substring(pos);
            pos = content.length;
            return getTextBlock(line);
        }
        var name = content.substring(pos, blockStart);
        pos = blockStart + 1;
        return {
            type: BLOCK_TYPE.STYLE_GROUP,
            name: name.split(',').map(function (i) { return i.trim(); }).filter(function (i) { return i.length > 0; }),
            children: parserBlocks()
        };
    };
    var parserBlock = function () {
        var code;
        while (pos < content.length) {
            code = content.charAt(++pos);
            if (isEmpty(code)) {
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
        while (pos < content.length) {
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
            lines.push(spaces + '/* ' + text.split('\n').map(function (i) { return i.trim(); }).join('\n' + spaces) + ' */');
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
            lines.push(spaces + (typeof item.name === 'object' ? item.name.join(',' + types_1.LINE_SPLITE + spaces) : item.name) + ' {');
            lines.push(blockToString(item.children, level + 1, indent));
            lines.push(spaces + '}');
        }
    }
    return lines.join(types_1.LINE_SPLITE);
}
function expandBlock(items) {
    var mergeName = function (name, prefix) {
        if (prefix.length < 1) {
            return name;
        }
        var args = [];
        prefix.forEach(function (i) {
            name.forEach(function (j) {
                args.push(j.indexOf('&') === 0 ? i + j.substring(1) : (i + ' ' + j));
            });
        });
        return args;
    };
    var mergeChildren = function (prefix, item) {
        var _a;
        if (!item.children || item.children.length < 1) {
            return [];
        }
        var block = {
            type: item.type,
            name: mergeName(item.name, prefix),
            children: []
        };
        var children = [];
        for (var _i = 0, _b = item.children; _i < _b.length; _i++) {
            var line = _b[_i];
            if (line.type !== BLOCK_TYPE.STYLE_GROUP) {
                (_a = block.children) === null || _a === void 0 ? void 0 : _a.push(line);
                continue;
            }
            children = children.concat(mergeChildren(block.name, line));
        }
        return [block].concat(children);
    };
    var data = [];
    var nameBlcok = function (name) {
        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
            var item = data_1[_i];
            if (item.type !== BLOCK_TYPE.STYLE_GROUP) {
                continue;
            }
            if (item.name === name) {
                return item;
            }
        }
        return undefined;
    };
    var mergeBlock = function (item, children) {
        if (!item.children) {
            item.children = children;
            return;
        }
        children.forEach(function (i) {
            var _a, _b;
            if (i.type !== BLOCK_TYPE.STYLE) {
                (_a = item.children) === null || _a === void 0 ? void 0 : _a.push(i);
                return;
            }
            for (var _i = 0, _c = item.children; _i < _c.length; _i++) {
                var j = _c[_i];
                if (j.type === BLOCK_TYPE.STYLE && j.name === i.name) {
                    j.value = i.value;
                    return;
                }
            }
            (_b = item.children) === null || _b === void 0 ? void 0 : _b.push(i);
        });
    };
    var appendBlock = function (item) {
        if (item.name || item.name.length < 0) {
            return;
        }
        item.name.forEach(function (name) {
            var _a;
            var block = nameBlcok(name);
            var children = (_a = item.children) === null || _a === void 0 ? void 0 : _a.map(function (i) {
                return tslib_1.__assign({}, i);
            });
            if (block) {
                mergeBlock(block, children);
                return;
            }
            data.push({
                type: item.type,
                name: name,
                children: children
            });
        });
    };
    for (var _i = 0, items_2 = items; _i < items_2.length; _i++) {
        var item = items_2[_i];
        if (item.type !== BLOCK_TYPE.STYLE_GROUP) {
            data.push(item);
            continue;
        }
        if (!item.children || item.children.length < 1) {
            continue;
        }
        mergeChildren([], item).forEach(appendBlock);
    }
    return data;
}
function splitBlock(items) {
    var data = [];
    var splitName = function (name) {
        var args = [name];
        var splitTag = function (a, tag, replace) {
            var b = [];
            a.forEach(function (val) {
                val.split(tag).forEach(function (v, i) {
                    b.push(i > 0 ? replace + v.trim() : v.trim());
                });
            });
            return b;
        };
        args = splitTag(args, '+', '&+');
        args = splitTag(args, '~', '&~');
        args = splitTag(args, '::', '&::');
        args = splitTag(args, ':', '&:');
        return splitTag(args, ' ', '');
    };
    var resetName = function (names) {
        return names.map(function (i) {
            return i.indexOf('&') === 0 ? i.substring(1) : (' ' + i);
        }).join('');
    };
    var findTreeName = function (names) {
        if (names.length < 2) {
            return splitName(names[0]).map(function (i) {
                return [i];
            });
        }
        var args = [];
        var cache = [];
        var getName = function (i, j) {
            if (cache.length <= i) {
                cache.push(splitName(names[i]));
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
            var c = cache.length > j ? cache[j] : splitName(i);
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
    for (var _i = 0, items_3 = items; _i < items_3.length; _i++) {
        var item = items_3[_i];
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
