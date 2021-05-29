import { CharIterator } from './iterator';
import { joinLine, LINE_SPLITE, splitLine } from './util';

enum BLOCK_TYPE {
    COMMENT,
    CHASET,
    IMPORT,
    INCLUDE,
    EXTEND,
    USE,
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

const TYPE_CONVERTER_MAP: any = {
    [BLOCK_TYPE.EXTEND]: '@extend',
    [BLOCK_TYPE.CHASET]: '@charset',
    [BLOCK_TYPE.USE]: '@use',
    [BLOCK_TYPE.IMPORT]: '@import',
    [BLOCK_TYPE.INCLUDE]: '@include',
};

/**
 * 判断是否是空字符
 * @param code 字符
 * @returns true
 */
const isEmptyCode = (code: string): boolean => {
    return code === ' ' || isLineCode(code) || code === '\t';
};

/**
 * 是否是换行符
 * @param code 
 * @returns 
 */
const isLineCode = (code: string): boolean => {
    return code === '\r' || code === '\n';
};

export function cssToJson(content: string) {
    const reader = new CharIterator(content);
    // 判断方式是否是采取缩进方式
    const isIndent = content.indexOf('{') < 0;

    /**
     * 判断缩进的数量
     * @param pos 
     * @returns 
     */
    const indentSize = (pos = reader.index): number =>  {
        let count = 0;
        while (pos < reader.length) {
            const code = reader.readSeek(pos++);
            if (isLineCode(code)) {
                if (count > 0) {
                    break;
                }
                continue;
            }
            if (code === '\t') {
                count += 4;
                continue;
            }
            if (code === ' ') {
                count ++;
                continue;
            }
            break;
        }
        return count;
    };

    const nextIndentSize = (pos = reader.index): number => {
        let inComment = false;
        let code: string;
        while (pos < reader.length) {
            code = reader.readSeek(++pos);
            if (!inComment && code === '/' && reader.readSeek(pos + 1) === '*') {
                inComment = true;
                pos += 1;
                continue;
            }
            if (inComment && code === '*' && reader.readSeek(pos + 1) === '/') {
                while (pos < reader.length) {
                    code = reader.readSeek(++pos);
                    if (!isLineCode(code)) {
                        continue;
                    }
                    return indentSize(pos);
                }
            }
            if (!inComment && isLineCode(code)) {
                return indentSize(pos);
            }

        }
        return 0;
    };
    /**
     * 判断接下来是否是换行，是的话移动到新的一行开始
     * @returns 
     */
    const moveNewLine = (): boolean => {
        while (reader.canNext) {
            const code = reader.next();
            if (code === '\n') {
                return true;
            }
            if (code !== '\r') {
                reader.move(-1);
                return false;
            }
            if (reader.nextIs('\n')) {
                reader.next();
                return true;
            }
            return true;
        }
        return false;
    } 
    /**
     * 判断是否是评论
     */
    const isComment = () => {
        const tag = reader.read(2);
        if (tag === '//') {
            return true;
        }
        if (tag !== '//' && tag !== '/*') {
            return false;
        }
        return reader.indexOf('*/', 2) > 0;
    };
    /**
     * 获取评论元素，并移动位置
     */
    const getCommentBock = (): IBlockItem => {
        const tag = reader.read(2);
        const start = reader.index + 2;
        let end = reader.indexOf(tag === '//' ? '\n' : '*/', 2);
        if (tag !== '//' && end < 0) {
            end = content.length;
        }
        const text = reader.read(end - start, 2) as string;
        reader.index = end + (tag === '//' ? 0 : 1);
        if (isIndent && tag === '/*') {
            moveNewLine();
        }
        return {
            type: BLOCK_TYPE.COMMENT,
            text: text.trim(),
        };
    };
    const getTextBlock = (line: string): IBlockItem|boolean => {
        line = line.trim();
        for (const key in TYPE_CONVERTER_MAP) {
            if (Object.prototype.hasOwnProperty.call(TYPE_CONVERTER_MAP, key)) {
                const search: string = TYPE_CONVERTER_MAP[key];
                if (line.startsWith(search)) {
                    return {
                        type: key as any,
                        text: line.substr(search.length).trim(),
                    };
                }
            }
        }
        const args = line.split(':', 2);
        if (args.length === 2) {
            return {
                type: BLOCK_TYPE.STYLE,
                name: args[0].trim(),
                value: args[1].trim(),
            };
        }
        if (line.length < 1) {
            return false;
        }
        return {
            type: BLOCK_TYPE.TEXT,
            text: line,
        };
    };
    const getBlock = (indentLength: number): IBlockItem|boolean => {
        let blockStart: number;
        let endIndex: number;
        if (isIndent) {
            endIndex = Math.min(... [reader.indexOf('\n'), reader.indexOf('\r'), reader.length, reader.indexOf('//') - 1, reader.indexOf('/*') - 1].filter(i => i > 0));
            const lineIndentLength = indentSize();
            const nextIndentLength = nextIndentSize();
            if (lineIndentLength === indentLength && nextIndentLength <= lineIndentLength) {
                const line = reader.readRange(endIndex);
                reader.index = endIndex;
                return getTextBlock(line);
            }
            blockStart = endIndex;
            indentLength = nextIndentLength;
        } else {
            const endIndex = reader.indexOf(';');
            blockStart = reader.indexOf('{');
            if (endIndex > 0 && (blockStart < 0 || blockStart > endIndex)) {
                const line = reader.readRange(endIndex) as string;
                reader.index = endIndex;
                return getTextBlock(line);
            }
            // 有可能最后的属性没有 ; 结束符
            const endMap = [reader.indexOf('}'), reader.indexOf('//'), reader.indexOf('/*')].filter(i => i > 0);
            let blockEnd = endMap.length < 1 ? -1 : Math.min(...endMap);
            if (blockEnd > 0 && (blockStart < 0 || blockStart > blockEnd)) {
                const line = reader.readRange(blockEnd);
                reader.index = blockEnd - 1;
                return getTextBlock(line);
            }
            
            if (blockStart < 0) {
                const line = reader.readRange();
                reader.moveEnd();
                return getTextBlock(line);
            }
        }
        const name = reader.readRange(blockStart);
        reader.index = blockStart;
        if (isIndent) {
            moveNewLine();
        }
        return {
            type: BLOCK_TYPE.STYLE_GROUP,
            name: name.split(',').map(i => i.trim()).filter(i => i.length > 0),
            children: parserBlocks(indentLength)
        };
    };
    const parserBlock = (indentLength: number): IBlockItem | boolean => {
        let code: string;
        while (reader.canNext) {
            if (isIndent && moveNewLine()) {
                return indentLength > 0;
            }
            code = reader.next() as string;
            if (!isIndent && isEmptyCode(code)) {
                continue;
            }
            if (code === '/' && isComment()) {
                return getCommentBock();
            }
            if (isIndent && code === '}') {
                return true;
            }
            return getBlock(indentLength);
        }
        return false;
    };
    const parserBlocks = (indentLength = 0) => {
        const items: IBlockItem[] = [];
        while (reader.canNext) {
            const item = parserBlock(indentLength);
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
            lines.push(spaces + '/* ' + splitLine(text).map(i => i.trim()).join(LINE_SPLITE + spaces) + ' */');
            continue;
        }
        if (Object.prototype.hasOwnProperty.call(TYPE_CONVERTER_MAP, item.type)) {
            lines.push(spaces + TYPE_CONVERTER_MAP[item.type] + ' ' + item.text + ';');
            continue;
        }
        if (item.type === BLOCK_TYPE.STYLE) {
            lines.push(spaces + item.name + ': ' + item.value + ';');
            continue;
        }
        if (item.type === BLOCK_TYPE.STYLE_GROUP) {
            lines.push(spaces + (typeof item.name === 'object' ? item.name.join(',' + LINE_SPLITE + spaces) : item.name) + ' {');
            lines.push(blockToString(item.children as IBlockItem[], level + 1, indent));
            lines.push(spaces + '}');
        }
    }
    return joinLine(lines);
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


export function themeCss(items: IBlockItem[]): IBlockItem[] {
    const themeOption: any = {};
    const isThemeDef = (item: IBlockItem): boolean => {
        return item.type === BLOCK_TYPE.STYLE_GROUP && item.name[0].indexOf('@theme ') === 0;
    };
    const appendTheme = (item: IBlockItem) => {
        const name = item.name[0].substr(7).trim();
        if (!themeOption[name]) {
            themeOption[name] = {};
        }
        item.children?.forEach(i => {
            if (i.type === BLOCK_TYPE.STYLE) {
                themeOption[name][i.name] = i.value;
            }
        });
    };
    const sourceItems = [];
    for (const item of items) {
        if (isThemeDef(item)) {
            appendTheme(item);
            continue;
        }
        sourceItems.push(item);
    }
    const isThemeStyle = (item: IBlockItem): boolean => {
        if (item.type !== BLOCK_TYPE.STYLE) {
            return false;
        }
        for (let val of item.value.split(' ') as string[]) {
            val = val.trim();
            if (val.charAt(0) === '@' && val.length > 1) {
                return true;
            }
        }
        return false;
    };
    const themeStyleValue = (name: string, theme = 'default'): string => {
        if (themeOption[theme][name]) {
            return themeOption[theme][name];
        }
        // 允许通过 theme.name 的方式直接访问值
        if (name.indexOf('.') >= 0) {
            [theme, name] = name.split('.', 2);
            if (themeOption[theme][name]) {
                return themeOption[theme][name];
            }
        }
        throw `[${theme}].${name} is error value`;
    }
    const themeStyle = (item: IBlockItem, theme = 'default'): string => {
        const block: string[] = [];
        item.value.split(' ').forEach((val: string) => {
            val = val.trim();
            if (val.length < 1) {
                return;
            }
            if (val.charAt(0) === '@' && val.length > 1) {
                block.push(themeStyleValue(val.substr(1), theme));
                return;
            }
            block.push(val);
        });
        return block.join(' ');
    };
    const defaultStyle = (item: IBlockItem): string => {
        return themeStyle(item);
    };
    const splitThemeStyle = (data: IBlockItem[]): IBlockItem[][] => {
        const source = [];
        const append = [];
        for (const item of data) {
            if (isThemeStyle(item)) {
                append.push({...item});
                item.value = defaultStyle(item);
            }
            if (item.type !== BLOCK_TYPE.STYLE_GROUP || !item.children || item.children.length < 1) {
                source.push(item);
                continue;
            }
            let [s, a] = splitThemeStyle(item.children);
            if (a.length > 0) {
                append.push({...item, children: a});
            }
            source.push({...item, children: s});
        }
        return [source, append];
    };
    const [finishItems, appendItems] = splitThemeStyle(sourceItems);
    if (appendItems.length < 1) {
        return finishItems;
    }
    const cloneStyle = (data: IBlockItem[], theme: string): IBlockItem[] => {
        const children = [];
        for (const item of data) {
            if (isThemeStyle(item)) {
                children.push({...item, value: themeStyle(item, theme)});
                continue;
            }
            if (item.type !== BLOCK_TYPE.STYLE_GROUP) {
                children.push(item);
                continue;
            }
            children.push({...item, name: [...item.name as string[]], children: cloneStyle(item.children as IBlockItem[], theme)});
        }
        return children;
    };
    Object.keys(themeOption).forEach(theme => {
        if (theme === 'default') {
            return;
        }
        const children = cloneStyle(appendItems, theme);
        const cls = '.theme-' + theme;
        for (const item of children) {
            if (item.type !== BLOCK_TYPE.STYLE_GROUP) {
                continue;
            }
            item.name = (item.name as string[]).map(i => {
                if (i.trim() === 'body') {
                    return 'body' + cls;
                }
                return cls + ' ' + i;
            });
            finishItems.push(item);
        }
    });
    return finishItems;
}

export function formatThemeCss(content: string): string {
    if (content.trim().length < 1) {
        return content;
    }
    let items = cssToJson(content);
    items = themeCss(items);
    return blockToString(items);
}
