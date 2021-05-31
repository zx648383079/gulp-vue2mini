import { htmlToJson } from '../html';
import { Element } from '../element';
import { joinLine } from '../util';
import { MiniProject } from './project';

type STYLE_SCRIPT = 'style'| 'script';


interface IVueResultItem {
    type: string;
    content: string;
}

interface IScriptResultItem extends IVueResultItem {
    isPage?: boolean;
    isComponent?: boolean;
    isApp?: boolean;
}

interface IVueResult {
    template?: string;
    style?: IVueResultItem;
    script?: IScriptResultItem;
    json?: string;
}

export class VueParser {

    constructor(
        private project: MiniProject
    ) {}

    /**
     * 拆分文件
     * @param content 
     * @param ext 
     * @param srcFile 
     * @returns 
     */
    public render(content: string, ext: string, srcFile: string): IVueResult {
        if (ext === 'json') {
            return {json: content};
        }
        if (['less', 'css', 'wxss', 'scss', 'sass'].indexOf(ext) >= 0) {
            return {style: {type: ext, content: this.project.style.render(content, srcFile)}};
        }
        if ('js' === ext) {
            return {script: {type: ext, content}};
        }
        if ('ts' === ext) {
            return this.splitTsFile(content, []);
        }
        const data = htmlToJson(content);
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
                    items[item.tag as STYLE_SCRIPT].lines.push(item.children[0].text as never);
                    if (item.attribute && item.attribute.items.lang) {
                        items[item.tag as STYLE_SCRIPT].type = item.attribute.items.lang as string;
                    }
                }
                continue;
            }
            if (item.tag !== 'template' || (item.attribute && item.attribute.items && Object.keys(item.attribute.items).length > 0)) {
                items.html.push(item as never);
                continue;
            }
            if (item.children && item.children.length > 0) {
                items.html = [].concat(items.html, item.children as any);
            }
        }
        const res: IVueResult = {};
        if (items.style.lines.length > 0) {
            res.style = {type: items.style.type, content: this.project.style.render(joinLine(items.style.lines), srcFile)};
        }
        let tplFuns: string[] = [];
        if (items.html.length > 0) {
            const wxml = this.project.template.render(new Element('root', undefined, undefined, items.html));
            res.template = wxml.template;
            tplFuns = wxml.func || [];
        }
        if (items.script.lines.length > 0) {
            const json = this.splitTsFile(joinLine(items.script.lines), tplFuns);
            res.script = {type: items.script.type, content: json.script ? json.script.content : ''};
            res.json = json.json;
        }
        if (res.script && res.script.isApp) {
            res.template = undefined;
        }
        return res;
    }

    private splitTsFile(content: string, tplfuns?: string[]): IVueResult {
        const res = this.project.script.render(content, tplfuns);
        const data: IVueResult = {
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
