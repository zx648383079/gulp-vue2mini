"use strict";
exports.__esModule = true;
var fs_1 = require("fs");
var ts_1 = require("./ts");
var cache_1 = require("./cache");
var path = require("path");
var html_1 = require("./html");
var element_1 = require("./element");
var compiler_1 = require("../compiler");
var cachesFiles = new cache_1.CacheManger();
var REGEX_ASSET = /(src|href)=["']([^"'\>]+)/g;
function parseToken(file, content) {
    var time = fs_1.statSync(file).mtimeMs;
    if (cachesFiles.has(file, time)) {
        return cachesFiles.get(file);
    }
    if (!content) {
        content = fs_1.readFileSync(file).toString();
    }
    var tokens = [];
    var isLayout = false;
    var canRender = true;
    var currentFolder = path.dirname(file);
    var replacePath = function (text) {
        return text.replace(REGEX_ASSET, function ($0, _, $2) {
            if ($2.indexOf('://') >= 0) {
                return $0;
            }
            if ($2.charAt(0) === '/') {
                return $0;
            }
            return $0.replace($2, path.resolve(currentFolder, $2));
        });
    };
    content.split(ts_1.LINE_SPLITE).forEach(function (line, i) {
        var token = converterToken(line);
        if (!token) {
            tokens.push({
                type: 'text',
                content: replacePath(line)
            });
            return;
        }
        if (token.type === 'comment' && i < 1) {
            token.type = 'layout';
            canRender = false;
        }
        if (token.type === 'content') {
            isLayout = true;
        }
        tokens.push(token);
    });
    var page = {
        tokens: tokens,
        isLayout: isLayout,
        file: file,
        canRender: canRender
    };
    cachesFiles.set(file, page, time);
    return page;
}
function renderFile(file, content) {
    var page = parseToken(file, content);
    if (!page.canRender) {
        return '';
    }
    var ext = path.extname(file);
    var layout = null;
    var renderPage = function (item, data) {
        var lines = [];
        item.tokens.forEach(function (token) {
            if (token.type == 'comment' || token.type === 'layout') {
                return;
            }
            if (token.type == 'content') {
                lines.push(data);
                return;
            }
            if (token.type === 'text') {
                lines.push(token.content);
                return;
            }
            if (token.type !== 'extend') {
                lines.push(token.content);
                return;
            }
            var args = token.content.split('@');
            if (args[0].indexOf('.') <= 0) {
                args[0] += ext;
            }
            var amount = args.length > 1 ? parseInt(args[1], 10) : 1;
            var extendFile = path.resolve(path.dirname(item.file), args[0]);
            var next = parseToken(extendFile);
            if (next.isLayout) {
                layout = next;
                return;
            }
            var nextStr = renderPage(next);
            for (; amount > 0; amount--) {
                lines.push(nextStr);
            }
        });
        return lines.join(ts_1.LINE_SPLITE);
    };
    content = renderPage(page);
    return mergeStyle(layout ? renderPage(layout, content) : content, file);
}
exports.renderFile = renderFile;
function mergeStyle(content, file) {
    var currentFolder = path.dirname(file);
    var replacePath = function (text) {
        return text.replace(REGEX_ASSET, function ($0, _, $2) {
            if ($2.indexOf('://') >= 0) {
                return $0;
            }
            if ($2.charAt(0) === '/') {
                return $0;
            }
            return $0.replace($2, path.relative(currentFolder, $2).replace('\\', '/'));
        });
    };
    var data = html_1.htmlToJson(replacePath(content));
    var headers = [];
    var footers = [];
    var styles = [];
    var scripts = [];
    var styleLang = 'css';
    var scriptLang = 'js';
    var eachElement = function (root) {
        if (root.node !== 'element') {
            root.map(eachElement);
            return;
        }
        if (root.tag === 'link') {
            headers.push(root.clone());
            root.ignore = true;
            return;
        }
        if (root.tag === 'style') {
            root.ignore = true;
            var lang_1 = root.attr('lang');
            if (lang_1 && lang_1 !== 'css') {
                styleLang = lang_1;
            }
            if (root.children) {
                styles.push.apply(styles, root.children);
            }
            return;
        }
        if (root.tag !== 'script') {
            root.map(eachElement);
            return;
        }
        if (root.attr('src')) {
            footers.push(root.clone());
            root.ignore = true;
            return;
        }
        var lang = root.attr('lang');
        if (lang && lang !== 'js') {
            scriptLang = lang;
        }
        root.ignore = true;
        if (root.children) {
            scripts.push.apply(scripts, root.children);
        }
    };
    data.map(eachElement);
    var lines = [];
    styles.forEach(function (item) {
        if (item.text) {
            lines.push(item.text);
        }
    });
    var style = lines.join(ts_1.LINE_SPLITE);
    if (style.length > 0 && ['scss', 'sass'].indexOf(styleLang) >= 0) {
        style = compiler_1.Compiler.sass(style, file, styleLang);
    }
    lines = [];
    scripts.forEach(function (item) {
        if (item.text) {
            lines.push(item.text);
        }
    });
    var script = lines.join(ts_1.LINE_SPLITE);
    if (script.length > 0 && scriptLang === 'ts') {
        script = compiler_1.Compiler.ts(script, file);
    }
    var pushStyle = function (root) {
        var _a, _b, _c, _d;
        if (root.node !== 'element') {
            return;
        }
        if (root.tag === 'head') {
            (_a = root.children) === null || _a === void 0 ? void 0 : _a.push.apply(_a, headers);
            if (style.length > 0) {
                (_b = root.children) === null || _b === void 0 ? void 0 : _b.push(element_1.Element.create('style', [element_1.Element.text(style)]));
            }
            headers = [];
            return;
        }
        if (root.tag === 'body') {
            (_c = root.children) === null || _c === void 0 ? void 0 : _c.push.apply(_c, footers);
            if (script.length > 0) {
                (_d = root.children) === null || _d === void 0 ? void 0 : _d.push(element_1.Element.create('script', [element_1.Element.text(script)]));
            }
            return;
        }
        root.map(pushStyle);
    };
    data.map(pushStyle);
    return html_1.jsonToHtml(data);
}
exports.mergeStyle = mergeStyle;
function converterToken(line) {
    line = line.trim();
    if (line.length < 0) {
        return;
    }
    if (line.charAt(0) !== '@') {
        return;
    }
    var content = line.substr(1);
    var comment = '';
    var i = content.indexOf(' ');
    if (i > 0) {
        comment = content.substr(i).trim();
        content = content.substr(0, i);
    }
    if (content.length < 1) {
        return;
    }
    var type = 'extend';
    if (content === '@') {
        type = 'comment';
    }
    else if (content === '...') {
        type = 'content';
    }
    return {
        type: type,
        content: content,
        comment: comment
    };
}
