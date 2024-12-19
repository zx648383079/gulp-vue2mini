"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VueParser = void 0;
const tokenizer_1 = require("../../tokenizer");
const util_1 = require("../../util");
class VueParser {
    project;
    constructor(project) {
        this.project = project;
    }
    tokenizer = new tokenizer_1.TemplateTokenizer();
    render(content, ext, srcFile) {
        if (ext === 'json') {
            return { json: content };
        }
        if (['less', 'css', 'wxss', 'scss', 'sass'].indexOf(ext) >= 0) {
            return { style: { type: ext, content: this.project.style.render(content, srcFile) } };
        }
        if ('js' === ext) {
            return { script: { type: ext, content } };
        }
        if ('ts' === ext) {
            return this.splitTsFile(content, []);
        }
        const data = this.tokenizer.render(content);
        if (!data.children) {
            return {};
        }
        const items = {
            html: [],
            style: {
                type: 'css',
                lines: [],
            },
            script: {
                type: 'js',
                lines: [],
            }
        };
        for (const item of data.children) {
            if (['style', 'script'].indexOf(item.tag) >= 0) {
                if (item.children && item.children.length > 0) {
                    items[item.tag].lines.push(item.children[0].text);
                    if (item.attribute && item.attribute.items.lang) {
                        items[item.tag].type = item.attribute.items.lang;
                    }
                }
                continue;
            }
            if (item.tag !== 'template' || (item.attribute && item.attribute.items && Object.keys(item.attribute.items).length > 0)) {
                items.html.push(item);
                continue;
            }
            if (item.children && item.children.length > 0) {
                items.html = [].concat(items.html, item.children);
            }
        }
        const res = {};
        if (items.style.lines.length > 0) {
            res.style = { type: items.style.type, content: this.project.style.render((0, util_1.joinLine)(items.style.lines), srcFile) };
        }
        let tplFuns = [];
        if (items.html.length > 0) {
            const wxml = this.project.template.render(new tokenizer_1.ElementToken('root', undefined, undefined, items.html));
            res.template = wxml.template;
            tplFuns = wxml.func || [];
        }
        if (items.script.lines.length > 0) {
            const json = this.splitTsFile((0, util_1.joinLine)(items.script.lines), tplFuns);
            res.script = { type: items.script.type, content: json.script ? json.script.content : '' };
            res.json = json.json;
        }
        if (res.script && res.script.isApp) {
            res.template = undefined;
        }
        return res;
    }
    splitTsFile(content, tplfuns) {
        const res = this.project.script.render(content, tplfuns);
        const data = {
            script: {
                type: 'ts',
                content: res.script,
                isApp: res.isApp,
                isComponent: res.isComponent,
                isPage: res.isPage,
            },
        };
        data.json = res.json;
        return data;
    }
}
exports.VueParser = VueParser;
