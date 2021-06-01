"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateTokenizer = exports.REGEX_ASSET = void 0;
var cache_1 = require("../cache");
var path = require("path");
var util_1 = require("../util");
exports.REGEX_ASSET = /(src|href|action)=["']([^"'\>]+)/g;
var TemplateTokenizer = (function () {
    function TemplateTokenizer(project) {
        this.project = project;
        this.cachesFiles = new cache_1.CacheManger();
    }
    TemplateTokenizer.prototype.render = function (file) {
        var _this = this;
        var time = file.mtime;
        if (this.cachesFiles.has(file.src, time)) {
            return this.cachesFiles.get(file.src);
        }
        var tokens = [];
        var isLayout = false;
        var canRender = true;
        var currentFolder = file.dirname;
        var ext = file.extname;
        var replacePath = function (text) {
            return text.replace(exports.REGEX_ASSET, function ($0, _, $2) {
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
        util_1.splitLine(this.project.fileContent(file)).forEach(function (line, i) {
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
            if (token.type === 'random') {
                token.content = replacePath(token.content);
            }
            if (token.type === 'extend') {
                if (token.content.indexOf('.') <= 0) {
                    token.content += ext;
                }
                token.content = path.resolve(currentFolder, token.content);
                _this.project.link.push(token.content, file.src);
            }
            tokens.push(token);
        });
        var page = {
            tokens: tokens,
            isLayout: isLayout,
            file: file.src,
            canRender: canRender
        };
        this.cachesFiles.set(file.src, page, time);
        return page;
    };
    TemplateTokenizer.prototype.converterToken = function (line) {
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
        if (content === 'theme') {
            return;
        }
        var type = 'extend';
        if (content === '@') {
            type = 'comment';
        }
        else if (content === '...') {
            type = 'content';
        }
        else if (content.indexOf('~') === 0 && line.indexOf('@@') > 2) {
            type = 'random';
            content = line.substr(2);
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
            amount: parseInt(amount, 10) || 1,
        };
    };
    return TemplateTokenizer;
}());
exports.TemplateTokenizer = TemplateTokenizer;
