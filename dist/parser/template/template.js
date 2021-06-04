"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateParser = void 0;
var path = require("path");
var compiler_1 = require("../../compiler");
var tokenizer_1 = require("../../tokenizer");
var util_1 = require("../../util");
var tokenizer_2 = require("./tokenizer");
var TemplateParser = (function () {
    function TemplateParser(project) {
        this.project = project;
        this.tokenizer = new tokenizer_1.TemplateTokenizer();
        this.compiler = new compiler_1.TemplateCompiler();
    }
    TemplateParser.prototype.render = function (file) {
        var _this = this;
        var page = this.project.tokenizer.render(file);
        if (!page.canRender) {
            return {
                template: '',
            };
        }
        var layout = null;
        var renderPage = function (item, data) {
            var lines = [];
            item.tokens.forEach(function (token) {
                if (token.type === 'comment' || token.type === 'layout') {
                    return;
                }
                if (token.type === 'content') {
                    lines.push(data);
                    return;
                }
                if (token.type === 'text') {
                    lines.push(token.content);
                    return;
                }
                if (token.type === 'random') {
                    var args = token.content.split('@@');
                    lines.push(args[Math.floor(Math.random() * args.length)]);
                    return;
                }
                if (token.type !== 'extend') {
                    lines.push(token.content);
                    return;
                }
                var next = _this.project.tokenizer.render(new compiler_1.CompilerFile(token.content));
                if (next.isLayout) {
                    layout = next;
                    return;
                }
                var amount = token.amount || 1;
                for (; amount > 0; amount--) {
                    lines.push(renderPage(next));
                }
            });
            return util_1.joinLine(lines);
        };
        var content = renderPage(page);
        return {
            template: this.mergeStyle(layout ? renderPage(layout, content) : content, file.src, file.mtime)
        };
    };
    TemplateParser.prototype.mergeStyle = function (content, file, time) {
        var currentFolder = path.dirname(file);
        var replacePath = function (text) {
            return text.replace(tokenizer_2.REGEX_ASSET, function ($0, _, $2) {
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
        var data = this.tokenizer.render(replacePath(content));
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
                var l = root.attr('lang');
                if (l && l !== 'css') {
                    styleLang = l;
                }
                if (root.children && root.children.length > 0) {
                    styles = styles.concat(root.children);
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
            if (root.children && root.children.length > 0) {
                scripts = scripts.concat(root.children);
            }
        };
        data.map(eachElement);
        var lines = [];
        styles.forEach(function (item) {
            if (item.text) {
                lines.push(item.text);
            }
        });
        var style = this.project.style.render(new compiler_1.CompilerFile(file, time, '', styleLang, util_1.joinLine(lines)));
        if (style.length > 0 && ['scss', 'sass'].indexOf(styleLang) >= 0) {
            style = compiler_1.PluginCompiler.sass(style, file, styleLang, {
                importer: this.project.style.importer,
            });
        }
        lines = [];
        scripts.forEach(function (item) {
            if (item.text) {
                lines.push(item.text);
            }
        });
        var script = this.project.script.render(util_1.joinLine(lines));
        if (script.length > 0 && scriptLang === 'ts') {
            script = compiler_1.PluginCompiler.ts(script, file);
        }
        var pushStyle = function (root) {
            var _a, _b;
            if (root.node !== 'element') {
                return;
            }
            if (root.tag === 'head') {
                if (headers.length > 0) {
                    root.children = !root.children ? headers : root.children.concat(headers);
                }
                if (style.length > 0) {
                    (_a = root.children) === null || _a === void 0 ? void 0 : _a.push(tokenizer_1.ElementToken.create('style', [tokenizer_1.ElementToken.text(style)]));
                }
                headers = [];
                return;
            }
            if (root.tag === 'body') {
                if (footers.length > 0) {
                    root.children = !root.children ? footers : root.children.concat(footers);
                }
                if (script.length > 0) {
                    (_b = root.children) === null || _b === void 0 ? void 0 : _b.push(tokenizer_1.ElementToken.create('script', [tokenizer_1.ElementToken.text(script)]));
                }
                footers = [];
                return;
            }
            root.map(pushStyle);
        };
        data.map(pushStyle);
        this.compiler.indent = this.project.compilerMin ? '' : '    ';
        return this.compiler.render(data);
    };
    TemplateParser.prototype.extractStyle = function (content) {
        var regex = /<style[\s\S]+?>([\s\S]+?)<\/style>/g;
        var items = [];
        var match;
        while (null !== (match = regex.exec(content))) {
            items.push(match[1]);
        }
        return items.join('\r\n');
    };
    return TemplateParser;
}());
exports.TemplateParser = TemplateParser;
