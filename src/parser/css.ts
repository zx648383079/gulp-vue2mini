import { LINE_SPLITE } from './types';

enum BLOCK_TYPE {
    COMMENT,
    CHASET,
    IMPORT,
    INCLUDE,
    TEXT,
    STYLE_GROUP,
    STYLE,
}

interface IBlockItem {
    [key: string]: any;
    type: BLOCK_TYPE;
    text?: string;
    children?: IBlockItem[];
}

/**
 * 判断是否是空字符
 * @param code 字符
 * @returns true
 */
const isEmptyCode = (code: string): boolean => {
    return code === ' ' || code === '\r' || code === '\n' || code === '\t';
};

export function cssToJson(content: string) {
    let pos = -1;
    /**
     * 判断是否是评论
     */
    const isComment = () => {
        const tag = content.substr(pos, 2);
        if (tag === '//') {
            return true;
        }
        if (tag !== '//' && tag !== '/*') {
            return false;
        }
        return content.indexOf('*/', pos + 2) > 0;
    };
    /**
     * 获取评论元素，并移动位置
     */
    const getCommentBock = (): IBlockItem => {
        const tag = content.substr(pos, 2);
        const start = pos + 2;
        let end = content.indexOf(tag === '//' ? '\n' : '*/', start);
        if (tag !== '//' && end < 0) {
            end = content.length;
        }
        const text = content.substring(start, end);
        pos = end + (tag === '//' ? 0 : 2);
        return {
            type: BLOCK_TYPE.COMMENT,
            text: text.trim(),
        };
    };
    const getTextBlock = (line: string): IBlockItem|boolean => {
        if (line.indexOf('@charset') >= 0) {
            return {
                type: BLOCK_TYPE.CHASET,
                text: line.replace(/@charset\s*/, '')
            };
        }
        if (line.indexOf('@import') >= 0) {
            return {
                type: BLOCK_TYPE.IMPORT,
                text: line.replace(/@import\s*/, '')
            };
        }
        if (line.indexOf('@include') >= 0) {
            return {
                type: BLOCK_TYPE.INCLUDE,
                text: line.replace(/@include\s*/, '')
            };
        }
        const args = line.split(':', 2);
        if (args.length === 2) {
            return {
                type: BLOCK_TYPE.STYLE,
                name: args[0].trim(),
                value: args[1].trim(),
            };
        }
        if (line.trim().length < 1) {
            return false;
        }
        return {
            type: BLOCK_TYPE.TEXT,
            text: line,
        };
    };
    const getBlock = (): IBlockItem|boolean => {
        const endIndex = content.indexOf(';', pos);
        const blockStart = content.indexOf('{', pos);
        if (endIndex > 0 && (blockStart < 0 || blockStart > endIndex)) {
            const line = content.substring(pos, endIndex);
            pos = endIndex;
            return getTextBlock(line);
        }
        if (blockStart < 0) {
            const line = content.substring(pos);
            pos = content.length;
            return getTextBlock(line);
        }
        const name = content.substring(pos, blockStart);
        pos = blockStart + 1;
        return {
            type: BLOCK_TYPE.STYLE_GROUP,
            name: name.split(',').map(i => i.trim()).filter(i => i.length > 0),
            children: parserBlocks()
        };
    };
    const parserBlock = (): IBlockItem | boolean => {
        let code: string;
        while (pos < content.length) {
            code = content.charAt(++pos);
            if (isEmptyCode(code)) {
                continue;
            }
            if (code === '/' && isComment()) {
                return getCommentBock();
            }
            if (code === '}') {
                return true;
            }
            return getBlock();
        }
        return false;
    };
    const parserBlocks = () => {
        const items: IBlockItem[] = [];
        while (pos < content.length) {
            const item = parserBlock();
            if (item === true) {
                break;
            }
            if (item) {
                items.push(item);
            }
        }
        return items;
    };
    return parserBlocks();
}

function blockToString(items: IBlockItem[], level: number = 1, indent: string = '    '): string {
    const spaces = indent.length > 0 ?  indent.repeat(level - 1) : indent;
    const lines: string[] = [];
    if (level > 1) {
        items = items.sort((a, b) => {
            if (a.type === b.type) {
                return 0;
            }
            if (a.type === BLOCK_TYPE.STYLE_GROUP) {
                return 1;
            }
            if (b.type === BLOCK_TYPE.STYLE_GROUP) {
                return -1;
            }
            return 0;
        });
    }
    for (const item of items) {
        if (item.type === BLOCK_TYPE.CHASET) {
            lines.push(spaces + '@charset ' + item.text + ';');
            continue;
        }
        if (item.type === BLOCK_TYPE.TEXT) {
            lines.push(spaces + item.text + ';');
            continue;
        }
        if (item.type === BLOCK_TYPE.COMMENT) {
            const text = item.text as string;
            if (text.indexOf('\n') < 0) {
                lines.push(spaces + '// ' + item.text);
                continue;
            }
            lines.push(spaces + '/* ' + text.split('\n').map(i => i.trim()).join('\n' + spaces) + ' */');
            continue;
        }
        if (item.type === BLOCK_TYPE.IMPORT) {
            lines.push(spaces + '@import ' + item.text + ';');
            continue;
        }
        if (item.type === BLOCK_TYPE.INCLUDE) {
            lines.push(spaces + '@include ' + item.text + ';');
            continue;
        }
        if (item.type === BLOCK_TYPE.STYLE) {
            lines.push(spaces + item.name + ': ' + item.value + ';');
        }
        if (item.type === BLOCK_TYPE.STYLE_GROUP) {
            lines.push(spaces + (typeof item.name === 'object' ? item.name.join(',' + LINE_SPLITE + spaces) : item.name) + ' {');
            lines.push(blockToString(item.children as IBlockItem[], level + 1, indent));
            lines.push(spaces + '}');
        }
    }
    return lines.join(LINE_SPLITE);
}

/**
 * 展开所有的标签
 * @param items blocks
 * @returns array
 */
function expandBlock(items: IBlockItem[]): IBlockItem[] {
    const mergeName = (name: string[], prefix: string[]): string[] => {
        if (prefix.length < 1) {
            return name;
        }
        const args: string[] = [];
        prefix.forEach(i => {
            name.forEach(j => {
                args.push(j.indexOf('&') === 0 ? i + j.substring(1) : (i + ' ' + j));
            });
        });
        return args;
    };
    // 合并成 一维
    const mergeChildren = (prefix: string[], item: IBlockItem): IBlockItem[] =>  {
        if (!item.children || item.children.length < 1) {
            return [];
        }
        const block: IBlockItem = {
            type: item.type,
            name: mergeName(item.name, prefix),
            children: [],
        };
        let children: IBlockItem[] = [];
        for (const line of item.children) {
            if (line.type !== BLOCK_TYPE.STYLE_GROUP) {
                block.children?.push(line);
                continue;
            }
            children = children.concat(mergeChildren(block.name, line));
        }
        return [block].concat(children);
    };
    // 展开标签
    const data: IBlockItem[] = [];
    // 根据name 找到块
    const nameBlcok = (name: string): IBlockItem|undefined => {
        for (const item of data) {
            if (item.type !== BLOCK_TYPE.STYLE_GROUP) {
                continue;
            }
            if (item.name === name) {
                return item;
            }
        }
        return undefined;
    };
    const mergeBlock = (item: IBlockItem, children: IBlockItem[]) => {
        if (!item.children) {
            item.children = children;
            return;
        }
        children.forEach(i => {
            if (i.type !== BLOCK_TYPE.STYLE) {
                item.children?.push(i);
                return;
            }
            for (const j of item.children as IBlockItem[]) {
                if (j.type === BLOCK_TYPE.STYLE && j.name === i.name) {
                    j.value = i.value;
                    return;
                }
            }
            item.children?.push(i);
        });
    };
    const appendBlock = (item: IBlockItem) => {
        if (item.name || item.name.length < 0) {
            return;
        }
        item.name.forEach((name: string) => {
            const block = nameBlcok(name);
            const children = item.children?.map(i => {
                return {
                    ...i
                };
            });
            if (block) {
                mergeBlock(block, children as IBlockItem[]);
                return;
            }
            data.push({
                type: item.type,
                name,
                children
            });
        });
    };
    for (const item of items) {
        if (item.type !== BLOCK_TYPE.STYLE_GROUP) {
            data.push(item);
            continue;
        }
        if (!item.children || item.children.length < 1) {
            continue;
        }
        mergeChildren([], item).forEach(appendBlock);
    }
    return data;
}

/**
 * 拆分css的规则名
 * @param name 规则名
 * @returns 分段的规则名
 */
export function splitRuleName(name: string): string[] {
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
            tag = (args.length > 0 ? '&' : '') + code;
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

/**
 * 拆分标签
 * @param items []
 */
function splitBlock(items: IBlockItem[]): IBlockItem[] {
    const data: IBlockItem[] = [];
    const resetName = (names: string[]): string => {
        return names.map(i => {
            return i.indexOf('&') === 0 ? i.substring(1) : (' ' + i);
        }).join('');
    };
    const findTreeName = (names: string[]): string[][] => {
        if (names.length < 2) {
            return splitRuleName(names[0]).map(i => {
                return [i];
            });
        }
        const args: string[][] = [];
        const cache: string[][] = [];
        const getName = (i: number, j: number): string => {
            if (cache.length <= i) {
                cache.push(splitRuleName(names[i]));
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
            const c = cache.length > j ? cache[j] : splitRuleName(i);
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
    const mergeStyle = (parent: IBlockItem[], children: IBlockItem[]) => {
        children.forEach(i => {
            if (i.type !== BLOCK_TYPE.STYLE) {
                parent.push(i);
                return;
            }
            for (const j of parent) {
                if (j.type === BLOCK_TYPE.STYLE && j.name === i.name) {
                    j.value = i.value;
                    return;
                }
            }
            parent.push(i);
        });
    };
    const appendBlock = (names: string[][], children: IBlockItem[], parent: IBlockItem[]): void => {
        if (names.length < 1) {
            mergeStyle(parent, children);
            return;
        }
        const name = names.shift() as string[];
        for (const item of parent) {
            if (item.type !== BLOCK_TYPE.STYLE_GROUP) {
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
        const block: IBlockItem = {
            type: BLOCK_TYPE.STYLE_GROUP,
            name,
            children: []
        };
        parent.push(block);
        appendBlock(names, children, block.children as IBlockItem[]);
    };
    const createTree = (item: IBlockItem, parent: IBlockItem[]) => {
        if (item.type !== BLOCK_TYPE.STYLE_GROUP) {
            parent.push(item);
            return;
        }
        const name = findTreeName(typeof item.name === 'object' ? item.name : [item.name]);
        appendBlock(name, item.children as IBlockItem[], parent);
    };
    for (const item of items) {
        createTree(item, data);
    }
    return data;
}

export function cssToScss(content: string): string {
    const items = cssToJson(content);
    const blocks = splitBlock(items);
    return blockToString(blocks);
}
