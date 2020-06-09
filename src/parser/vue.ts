import { parseJson, parsePage, LINE_SPLITE } from './ts';
import { htmlToJson } from './html';
import { jsonToWxml, wxmlFunc } from './wxml';
import { Element } from './element';

interface ITemplate {
    type: string;
    content: string;
}

interface IFileTemplate {
    html?: ITemplate;
    style?: ITemplate;
    script?: ITemplate;
    json?: ITemplate;
}

type STYLE_SCRIPT = 'style'| 'script';

/**
 * 拆分文件
 * @param content 内容
 * @param ext 文件后缀
 * @param appendJson 追加的字符串
 */
export function splitFile(content: string, ext: string = 'vue', appendJson?: any): IFileTemplate {
    if (ext === 'json') {
        return {json: {type: 'json', content}};
    }
    if (['scss', 'sass',].indexOf(ext) >= 0) {
        return {style: {type: 'sass', content}};
    }
    if (['less', 'css', 'wxss'].indexOf(ext) >= 0) {
        return {style: {type: ext, content}};
    }
    if ('js' === ext) {
        return {script: {type: ext, content}};
    }
    if ('ts' === ext) {
        return splitTsFile(content, [], appendJson);
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
    }
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
    let res: IFileTemplate = {};
    if (items.style.lines.length > 0) {
        res.style = {type: ['scss', 'sass'].indexOf(items.style.type) >= 0 ? 'sass' : items.style.type, content: items.style.lines.join(LINE_SPLITE)}
    }
    let tplFuns: string[] = [];
    if (items.html.length > 0) {
        let wxml = jsonToWxml(new Element('root', undefined, undefined, items.html))
        tplFuns = wxmlFunc;
        res.html = {type: 'wxml', content: wxml};
    }
    if (items.script.lines.length > 0) {
        let json = splitTsFile(items.script.lines.join(LINE_SPLITE), tplFuns, appendJson);
        res.script = {type: items.script.type, content: json.script ? json.script.content : ''}
        res.json =json.json;
    }
    return res;
}

function splitTsFile(content: string, tplfuns?: string[], appendJson?: any): IFileTemplate {
    const json = parseJson(content, appendJson);
    let data: IFileTemplate = {
        script: {
            type: 'ts',
            content: parsePage(content, tplfuns)
        }
    };
    data['json'] = {type: 'json', content: json || '{}'};
    return data;
}