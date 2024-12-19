import { joinLine, LINE_SPLITE, splitLine } from '../../util';
const CLASS_REG = /(export\s+(default\s+)?)?class\s+(\S+)\s+extends\s(WxPage|WxApp|WxComponent)[^\s\{]+/;
export class ScriptParser {
    constructor(_) { }
    render(source, templateFunc) {
        let content = source.replace(/import.+?from\s+.+?\.vue["'];/, '')
            .replace(/import.+?from\s+.+?typings.+?;/, '').replace(/@(WxJson|WxAppJson)\([\s\S]+?\)/, '');
        const match = content.match(CLASS_REG);
        if (!match) {
            return { script: content };
        }
        content = this.parseMethodToObject(this.appendMethod(content, templateFunc, match[0], match[4].indexOf('Component') > 0), {
            methods: '@WxMethod',
            lifetimes: '@WxLifeTime',
            pageLifetimes: '@WxPageLifeTime',
        }).replace(match[0], 'class ' + match[3]);
        const reg = new RegExp('(Page|Component)\\(new\\s+' + match[3]);
        const res = {
            isApp: match[4] === 'WxApp',
            isComponent: match[4] === 'WxComponent',
            isPage: match[4] === 'WxPage',
            script: !reg.test(content) ? content + LINE_SPLITE + match[4].substring(2) + '(new ' + match[3] + '());' : content,
        };
        if (res.isApp || res.isPage || res.isComponent) {
            res.json = this.parseJson(source);
        }
        return res;
    }
    parseJson(content) {
        const match = content.match(/@(WxJson|WxAppJson)(\([\s\S]+?\))/);
        if (!match) {
            return;
        }
        return match[2].trim();
    }
    parseMethodToObject(content, maps) {
        const strCount = (search, line) => {
            return line.split(search).length - 1;
        };
        const getTag = (line) => {
            for (const key in maps) {
                if (maps.hasOwnProperty(key) && line.indexOf(maps[key]) >= 0) {
                    return key;
                }
            }
            return;
        };
        const lines = splitLine(content);
        let num = 0;
        let inMethod = 0;
        let method;
        const data = {};
        let block = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (inMethod === 0) {
                method = getTag(line);
                if (!method) {
                    continue;
                }
                num = 0;
                inMethod = 1;
                lines[i] = '';
                block = [];
                if (!data.hasOwnProperty(method)) {
                    data[method] = {
                        i,
                        items: []
                    };
                }
                continue;
            }
            if (inMethod < 1) {
                continue;
            }
            const leftNum = strCount('{', line);
            num += leftNum - strCount('}', line);
            if (inMethod === 1) {
                block.push(line.replace(/public\s/, ''));
                lines[i] = '';
                if (leftNum > 0) {
                    if (num === 0) {
                        data[method + ''].items.push(joinLine(block));
                        inMethod = 0;
                        continue;
                    }
                    inMethod = 2;
                    continue;
                }
                continue;
            }
            block.push(line);
            lines[i] = '';
            if (num === 0) {
                data[method + ''].items.push(joinLine(block));
                inMethod = 0;
                continue;
            }
        }
        for (const key in data) {
            if (!data.hasOwnProperty(key)) {
                continue;
            }
            const reg = new RegExp(key + '[^=\\{\\}\\(\\)]*=\\s*\\{');
            if (!reg.test(content)) {
                lines[data[key].i] = key + '={' + data[key].items.join(',') + '}';
                delete data[key];
            }
        }
        content = joinLine(lines);
        for (const key in data) {
            if (!data.hasOwnProperty(key)) {
                continue;
            }
            const reg = new RegExp(key + '[^=\\{\\}\\(\\)]*=\\s*\\{');
            content = content.replace(reg, key + '={' + data[key].items.join(',') + ',');
        }
        return content;
    }
    appendMethod(content, tplFuns, classLine = '', isComponent = false) {
        if (!tplFuns || tplFuns.length < 1) {
            return content;
        }
        let pos = content.indexOf(classLine);
        let code = '';
        while (pos < content.length) {
            code = content.charAt(++pos);
            if (code === '{') {
                break;
            }
        }
        if (isComponent) {
            const lines = [];
            for (const item of tplFuns) {
                lines.push('@WxMethod');
                lines.push(item);
            }
            tplFuns = lines;
        }
        return joinLine([content.substring(0, pos + 1)].concat(tplFuns, [content.substring(pos + 2)]));
    }
}
