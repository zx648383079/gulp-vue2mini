"use strict";
exports.__esModule = true;
exports.UiCompliper = void 0;
var fs = require("fs");
var ts_1 = require("./ts");
var cache_1 = require("./cache");
var path = require("path");
var html_1 = require("./html");
var element_1 = require("./element");
var compiler_1 = require("../compiler");
var UglifyJS = require("uglify-js");
var CleanCSS = require("clean-css");
var REGEX_ASSET = /(src|href|action)=["']([^"'\>]+)/g;
var REGEX_SASS_IMPORT = /@import\s+["'](.+?)["'];/g;
var UiCompliper = (function () {
    function UiCompliper(inputFolder, outputFolder, options) {
        this.inputFolder = inputFolder;
        this.outputFolder = outputFolder;
        this.options = options;
        this.linkFiles = {};
        this.cachesFiles = new cache_1.CacheManger();
    }
    UiCompliper.prototype.triggerLinkFile = function (key) {
        var _this = this;
        if (!Object.prototype.hasOwnProperty.call(this.linkFiles, key)) {
            return;
        }
        this.linkFiles[key].forEach(function (file) {
            _this.compileFile(file);
        });
    };
    UiCompliper.prototype.addLinkFile = function (key, file) {
        if (!Object.prototype.hasOwnProperty.call(this.linkFiles, key)) {
            this.linkFiles[key] = [file];
            return;
        }
        if (this.linkFiles[key].indexOf(file) >= 0) {
            return;
        }
        this.linkFiles[key].push(file);
    };
    UiCompliper.prototype.converterToken = function (line) {
        var _a;
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
        if (type === 'extend' && /[\<\>]/.test(content)) {
            return;
        }
        var amount = '1';
        if (type === 'extend' && content.indexOf('@') > 0) {
            _a = content.split('@'), content = _a[0], amount = _a[1];
        }
        return {
            type: type,
            content: content,
            comment: comment,
            amount: parseInt(amount, 10) || 1
        };
    };
    UiCompliper.prototype.parseToken = function (file, content) {
        var _this = this;
        var time = fs.statSync(file).mtimeMs;
        if (this.cachesFiles.has(file, time)) {
            return this.cachesFiles.get(file);
        }
        if (!content) {
            content = fs.readFileSync(file).toString();
        }
        var tokens = [];
        var isLayout = false;
        var canRender = true;
        var currentFolder = path.dirname(file);
        var ext = path.extname(file);
        var replacePath = function (text) {
            return text.replace(REGEX_ASSET, function ($0, _, $2) {
                if ($2.indexOf('#') === 0 || $2.indexOf('javascript:') === 0) {
                    return $0;
                }
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
            var token = _this.converterToken(line);
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
            if (token.type === 'extend') {
                if (token.content.indexOf('.') <= 0) {
                    token.content += ext;
                }
                token.content = path.resolve(currentFolder, token.content);
                _this.addLinkFile(token.content, file);
            }
            tokens.push(token);
        });
        var page = {
            tokens: tokens,
            isLayout: isLayout,
            file: file,
            canRender: canRender
        };
        this.cachesFiles.set(file, page, time);
        return page;
    };
    UiCompliper.prototype.renderFile = function (file, content) {
        var _this = this;
        var page = this.parseToken(file, content);
        if (!page.canRender) {
            return '';
        }
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
                var next = _this.parseToken(token.content);
                if (next.isLayout) {
                    layout = next;
                    return;
                }
                var amount = token.amount || 1;
                var nextStr = renderPage(next);
                for (; amount > 0; amount--) {
                    lines.push(nextStr);
                }
            });
            return lines.join(ts_1.LINE_SPLITE);
        };
        content = renderPage(page);
        return this.mergeStyle(layout ? renderPage(layout, content) : content, file);
    };
    UiCompliper.prototype.mergeStyle = function (content, file) {
        var currentFolder = path.dirname(file);
        var replacePath = function (text) {
            return text.replace(REGEX_ASSET, function ($0, _, $2) {
                if ($2.indexOf('#') === 0 || $2.indexOf('javascript:') === 0) {
                    return $0;
                }
                if ($2.indexOf('://') >= 0) {
                    return $0;
                }
                if ($2.charAt(0) === '/') {
                    return $0;
                }
                var fileName = path.relative(currentFolder, $2).replace('\\', '/').replace(/\.ts$/, '.js').replace(/\.(scss|sass|less)$/, '.css');
                return $0.replace($2, fileName);
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
        return html_1.jsonToHtml(data, this.options && this.options.min ? '' : '    ');
    };
    UiCompliper.prototype.getSassImport = function (content, file) {
        if (content.length < 6) {
            return;
        }
        var ext = path.extname(file);
        var folder = path.dirname(file);
        var res;
        while (res = REGEX_SASS_IMPORT.exec(content)) {
            this.addLinkFile(path.resolve(folder, res[1].indexOf('.') > 0 ? res[1] : ('_' + res[1] + ext)), file);
        }
    };
    UiCompliper.prototype.compileFile = function (src) {
        var ext = path.extname(src);
        var dist = this.outputFile(src);
        var distFolder = path.dirname(dist);
        var content = '';
        if (ext === '.ts') {
            content = compiler_1.Compiler.ts(fs.readFileSync(src).toString(), src);
            if (content && content.length > 0 && this.options && this.options.min) {
                content = UglifyJS.minify(content).code;
            }
            dist = dist.replace(ext, '.js');
        }
        else if (ext === '.scss' || ext === '.sass') {
            this.triggerLinkFile(src);
            var name_1 = path.basename(src);
            if (name_1.indexOf('_') === 0) {
                return;
            }
            content = fs.readFileSync(src).toString();
            this.getSassImport(content, src);
            content = compiler_1.Compiler.sass(content, src, ext.substr(1));
            if (content && content.length > 0 && this.options && this.options.min) {
                content = new CleanCSS().minify(content).styles;
            }
            dist = dist.replace(ext, '.css');
        }
        else if (ext === '.html') {
            this.triggerLinkFile(src);
            content = this.renderFile(src);
        }
        else {
            this.mkIfNotFolder(distFolder);
            fs.copyFileSync(src, dist);
            return;
        }
        if (content.length < 1) {
            return;
        }
        this.mkIfNotFolder(distFolder);
        fs.writeFileSync(dist, content);
        this.logFile(src);
    };
    UiCompliper.prototype.mkIfNotFolder = function (folder) {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
    };
    UiCompliper.prototype.outputFile = function (file) {
        return path.resolve(this.outputFolder, path.relative(this.inputFolder, file));
    };
    UiCompliper.prototype.logFile = function (file, tip) {
        if (tip === void 0) { tip = 'Finished'; }
        var now = new Date();
        console.log('[' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + ']', path.relative(this.inputFolder, file), tip);
    };
    return UiCompliper;
}());
exports.UiCompliper = UiCompliper;
