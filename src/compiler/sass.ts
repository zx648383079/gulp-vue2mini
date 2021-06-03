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
        const resetName = (names: string[]): string => {
            return names.map(i => {
                return i.indexOf('&') === 0 ? i.substring(1) : (' ' + i);
            }).join('');
        };
        const findTreeName = (names: string[]): string[][] => {
            if (names.length < 2) {
                return this.splitRuleName(names[0]).map(i => {
                    return [i];
                });
            }
            const args: string[][] = [];
            const cache: string[][] = [];
            const getName = (i: number, j: number): string => {
                if (cache.length <= i) {
                    cache.push(this.splitRuleName(names[i]));
                }
                const pos = cache[i].length - 1 - j;
                if (pos < 0) {
                    return '';
                }
                return cache[i][pos];
            };
            let index = 0;
            iloop:
            while (true) {
                const name = getName(0, index);
                if (name === '') {
                    break;
                }
                for (let i = 1; i < names.length; i++) {
                    if (name !== getName(i, index)) {
                        break iloop;
                    }
                }
                args.push([name]);
                index ++;
            }
            index = args.length;
            if (index < 1) {
                return [names];
            }
            args.push(names.map((i, j) => {
                const c = cache.length > j ? cache[j] : this.splitRuleName(i);
                return resetName(c.splice(0, c.length - index));
            }));
            return args.reverse();
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