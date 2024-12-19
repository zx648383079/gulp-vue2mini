"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StyleParser = void 0;
const path = require("path");
const compiler_1 = require("../../compiler");
const tokenizer_1 = require("../../tokenizer");
const compiler_2 = require("../../compiler");
const util_1 = require("../../util");
class StyleParser {
    project;
    constructor(project) {
        this.project = project;
        const varPrefix = this.project.options?.prefix;
        this.compiler = new compiler_2.ThemeStyleCompiler(true, typeof varPrefix === 'string' && varPrefix.length > 0, varPrefix ?? 'zre');
    }
    themeItems = {};
    tokenizer = new tokenizer_1.StyleTokenizer();
    compiler;
    preppendItems = [];
    themeUsedKeys = [];
    get length() {
        return Object.keys(this.themeItems).length;
    }
    get(theme) {
        return Object.prototype.hasOwnProperty.call(this.themeItems, theme) ? this.themeItems[theme] : undefined;
    }
    render(file) {
        this.preppendItems = [];
        this.themeUsedKeys = [];
        const content = this.renderPart(file, true);
        return [...this.preppendItems, this.compiler.renderTheme(this.themeItems, this.themeUsedKeys), content].filter(i => !!i).join('\n');
    }
    renderPart(file, isEntry = false) {
        const content = typeof file.content !== 'undefined' ? file.content : this.project.fileContent(file);
        const needTheme = this.needTheme(content);
        const hasTheme = this.hasTheme(content);
        if (!needTheme && !hasTheme) {
            return this.renderImport(content, file);
        }
        let blockItems = this.tokenizer.render(content);
        if (hasTheme) {
            const [theme, items] = this.compiler.separateThemeStyle(blockItems);
            this.pushTheme(theme);
            blockItems = items;
            if (isEntry) {
                this.project.link.lock(file.src, () => {
                    this.project.link.trigger('theme', file.mtime);
                });
            }
        }
        this.project.link.push('theme', file.src);
        let [res, _, keys] = this.compiler.renderAny(blockItems, this.themeItems);
        if (keys.length > 0) {
            for (const key of keys) {
                if (this.themeUsedKeys.indexOf(key) >= 0) {
                    continue;
                }
                this.themeUsedKeys.push(key);
            }
        }
        return this.renderImport(res, file);
    }
    pushTheme(items) {
        for (const key in items) {
            if (Object.prototype.hasOwnProperty.call(items, key)) {
                this.themeItems[key] = Object.assign(Object.prototype.hasOwnProperty.call(this.themeItems, key) ? this.themeItems[key] : {}, items[key]);
            }
        }
        if (this.project.options?.debug) {
            this.project.logger.debug(items);
        }
    }
    extractTheme(content) {
        if (!this.hasTheme(content)) {
            return;
        }
        const [theme] = this.compiler.separateThemeStyle(this.tokenizer.render(content));
        this.pushTheme(theme);
    }
    renderImport(content, file) {
        if (file.type !== 'scss' && file.type !== 'sass') {
            return content;
        }
        if (content.length < 6) {
            return content;
        }
        const ext = file.extname;
        const folder = file.dirname;
        return (0, util_1.regexReplace)(content, /@(import)\s+["'](.+?)["'];*/g, match => {
            if (match[2].startsWith('sass:')) {
                this.preppendItems.push(match[0]);
                return '';
            }
            const importFile = path.resolve(folder, match[2].indexOf('.') > 0 ? match[2] : ('_' + match[2] + ext));
            this.project.link.push(importFile, file.src);
            return this.renderPart(new compiler_1.CompilerFile(importFile, file.mtime, undefined, (0, util_1.getExtensionName)(importFile)));
        });
    }
    hasTheme(content) {
        return content.indexOf('@theme ') >= 0;
    }
    needTheme(content) {
        return /:.+@[a-z]+/.test(content);
    }
    importer = {
        canonicalize: (url, _) => {
            return new URL(url);
        },
        load: url => {
            const fileName = url.toString();
            const ext = (0, util_1.getExtensionName)(fileName);
            return {
                contents: this.renderPart(new compiler_1.CompilerFile(fileName, 0, undefined, ext)),
                syntax: ext === 'sass' ? 'indented' : 'scss'
            };
        }
    };
}
exports.StyleParser = StyleParser;
