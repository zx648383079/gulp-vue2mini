import { StyleToken, StyleTokenizer, StyleTokenType } from '../tokenizer';
import { isEmptyCode } from '../util';
import { Compiler } from './base';
import { StyleCompiler } from './style';

export class SassCompiler implements Compiler<StyleToken[]|string, string> {

    /**
     *
     */
    constructor(
        private tokenizer = new StyleTokenizer(),
        private compiler = new StyleCompiler()
    ) {
    }

    public render(data: StyleToken[]|string): string {
        if (typeof data !== 'object') {
            this.tokenizer.autoIndent(data);
            data = this.tokenizer.render(data);
        }
        return this.compiler.render(this.splitBlock(data));
    }

    /**
     * 拆分css的规则名
     * @param name 规则名
     * @returns 分段的规则名
     */
     public splitRuleName(name: string): string[] {
        name = name.trim();
        if (name.length < 2) {
            return [name];
        }
        const tags: any = {
            '[': ']',
            '(': ')',
        };
        const args: string[] = [];
        let tag = '';
        let pos = 0;
        if (name.charAt(pos) === '&') {
            const k = name.charAt(pos + 1);
            let i = pos + 1;
            while (i < name.length) {
                if (name.charAt(++ i) !== k) {
                    break;
                }
            }
            tag = name.substring(pos, i);
            pos = i + 1;
        }
        const appendTag = () => {
            const item = tag.trim();
            tag = '';
            if (item.length < 1) {
                return;
            }
            const c = item.charAt(0);
            if (c === '&') {
                args.push(item);
                return;
            }
            if (c === '>' || c === '+' || c === '~') {
                args.push('&' + item);
                return;
            }
            args.push(item);
        };
        let startTag = '';
        let endTag = '';
        let endCount = 0;
        while (pos < name.length) {
            const code = name.charAt(pos);
            pos ++;
            if (endCount > 0) {
                tag += code;
                if (code === startTag) {
                    endCount ++;
                } else if (code === endTag) {
                    endCount --;
                }
                continue;
            }
            if (Object.prototype.hasOwnProperty.call(tags, code)) {
                startTag = code;
                endTag = tags[code];
                endCount = 1;
                tag += code;
                continue;
            }
            if (code === '>' || code === '~' || code === '+') {
                appendTag();
                // 允许后面跟空格
                let i = pos;
                while (i < name.length) {
                    if (!isEmptyCode(name.charAt(i))) {
                        break;
                    }
                    i ++;
                }
                tag =  (args.length > 0 ? '&' : '') + code;
                pos = i;
                continue;
            }
            if (code === '.') {
                appendTag();
                tag = (args.length > 0 && !isEmptyCode(name.charAt(pos - 2)) ? '&' : '') + code;
                continue;
            }
            if (code === ':') {
                appendTag();
                // 判断是否出现连续的 :
                let i = pos;
                while (i < name.length) {
                    if (name.charAt(++ i) !== ':') {
                        break;
                    }
                }
                tag =  (args.length > 0 ? '&' : '') + name.substring(pos - 1, i);
                pos = i;
                continue;
            }
            if (isEmptyCode(code)) {
                appendTag();
                tag = '';
                continue;
            }
            tag += code;
        }
        appendTag();
        return args;
    }

    public splitBlock(items: StyleToken[]): StyleToken[] {
        const data: StyleToken[] = [];
        // 合并
        const resetName = (names: string[], hasPrefix = false): string => {
            return names.map((val, j) => {
                if (j === 0) {
                    return val.indexOf('&') === 0 && !hasPrefix ? val.substring(1) : val;
                }
                return val.indexOf('&') === 0 ? val.substring(1) : (' ' + val);
            }).join('');
        };
        // 转成 [[第一级], [第二级的格式]...]
        const findTreeName = (names: string[]): string[][] => {
            if (names.length < 2) {
                return this.splitRuleName(names[0]).map(i => {
                    return [i];
                });
            }
            const reverseArgs: string[][] = [];
            const args: string[][] = [];
            const cache: string[][] = [];
            const getCacheName = (i: number, j: number): string => {
                if (cache.length <= i) {
                    cache.push(this.splitRuleName(names[i]));
                }
                const pos = j < 0 ? cache[i].length + j : j;
                if (pos >= cache[i].length) {
                    return '';
                }
                return cache[i][pos];
            };
            const getReverseName = (i: number, j: number): string => {
                return getCacheName(i, - 1 - j);
            };
            let index = 0;
            let isEnd = false;
            // 正序查相同
            while (true) {
                const name = getCacheName(0, index);
                if (name === '') {
                    break;
                }
                isEnd = false;
                for (let i = 1; i < names.length; i++) {
                    if (name !== getCacheName(i, index)) {
                        isEnd = true;
                        break;
                    }
                }
                if (isEnd) {
                    break;
                }
                args.push([name]);
                index ++;
            }
            // 倒序查相同
            index = 0;
            while (true) {
                const name = getReverseName(0, index);
                // cache[i].length - index - 1 <= args.length 倒序查找的值不能小于正序查找的位置
                if (name === '' || cache[0].length - index - 1 <= args.length) {
                    break;
                }
                isEnd = false;
                for (let i = 1; i < names.length; i++) {
                    if (name !== getReverseName(i, index)) {
                        isEnd = true;
                        break;
                    }
                    if (cache[i].length - index - 1 <= args.length) {
                        isEnd = true;
                        break;
                    }
                }
                if (isEnd) {
                    break;
                }
                reverseArgs.push([name]);
                index ++;
            }
            if (reverseArgs.length < 1 && args.length < 1) {
                return [names];
            }
            reverseArgs.push(names.map((i, j) => {
                const c = cache.length > j ? cache[j] : this.splitRuleName(i);
                const start = args.length;
                const end = c.length - reverseArgs.length;
                return resetName(c.splice(start, end - start), start > 0);
            }));
            return [...args, ...reverseArgs.reverse()];
        };
        const arrEq = (a: string[], b: string[]): boolean => {
            if (a.length !== b.length) {
                return false;
            }
            for (const i of a) {
                if (b.indexOf(i) < 0) {
                    return false;
                }
            }
            return true;
        };
        const mergeStyle = (parent: StyleToken[], children: StyleToken[]) => {
            children.forEach(i => {
                if (i.type !== StyleTokenType.STYLE) {
                    parent.push(i);
                    return;
                }
                for (const j of parent) {
                    if (j.type === StyleTokenType.STYLE && j.name === i.name) {
                        j.content = i.content;
                        return;
                    }
                }
                parent.push(i);
            });
        };
        const appendBlock = (names: string[][], children: StyleToken[], parent: StyleToken[]): void => {
            if (names.length < 1) {
                mergeStyle(parent, children);
                return;
            }
            const name = names.shift() as string[];
            for (const item of parent) {
                if (item.type !== StyleTokenType.STYLE_GROUP) {
                    continue;
                }
                if (!arrEq(name, item.name as string[])) {
                    continue;
                }
                if (!item.children) {
                    item.children = [];
                }
                appendBlock(names, children, item.children);
                return;
            }
            const block: StyleToken = {
                type: StyleTokenType.STYLE_GROUP,
                name,
                children: []
            };
            parent.push(block);
            appendBlock(names, children, block.children as StyleToken[]);
        };
        const createTree = (item: StyleToken, parent: StyleToken[]) => {
            if (item.type !== StyleTokenType.STYLE_GROUP) {
                parent.push(item);
                return;
            }
            const name = findTreeName(typeof item.name === 'object' ? item.name as string[] : [item.name] as string[]);
            appendBlock(name, item.children as StyleToken[], parent);
        };
        for (const item of items) {
            createTree(item, data);
        }
        return data;
    }

}