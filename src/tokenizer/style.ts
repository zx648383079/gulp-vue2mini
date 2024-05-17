import { CharIterator } from '../iterator';
import { isEmptyCode, isLineCode } from '../util';
import { Tokenizer } from './base';

export enum StyleTokenType {
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

export const StyleTokenCoverter: any = {
    [StyleTokenType.EXTEND]: '@extend',
    [StyleTokenType.CHASET]: '@charset',
    [StyleTokenType.USE]: '@use',
    [StyleTokenType.IMPORT]: '@import',
    [StyleTokenType.INCLUDE]: '@include',
};

export interface StyleToken {
    type: StyleTokenType;
    content?: string;
    name?: string[]|string;
    children?: StyleToken[];
}

export class StyleTokenizer implements Tokenizer<string|CharIterator, StyleToken[]> {

    /**
     * 是否是以缩进为方式
     * @param isIndent 
     */
    constructor(
        private isIndent = false,
    ) {
    }

    public autoIndent(content: string) {
        this.isIndent = content.indexOf('{') < 0;
    }
    
    public render(content: string|CharIterator): StyleToken[] {
        const reader = content instanceof CharIterator ? content : new CharIterator(content);
        reader.reset();
        return this.renderBlock(reader);
    }

    private renderBlock(reader: CharIterator, indentLength = 0) {
        const items: StyleToken[] = [];
        while (reader.canNext) {
            const item = this.parserBlock(reader, indentLength);
            if (item === true) {
                break;
            }
            if (item) {
                items.push(item);
            }
        }
        return items;
    }


    private parserBlock = (reader: CharIterator, indentLength: number): StyleToken | boolean => {
        let code: string;
        while (reader.canNext) {
            if (this.isIndent) {
                if (this.moveNewLine(reader)) {
                    return indentLength > 0;
                }
                if (this.indentSize(reader, reader.position) < indentLength) {
                    return true;
                }
            }
            reader.moveNext();
            code = reader.current;
            if (!this.isIndent && isEmptyCode(code)) {
                continue;
            }
            if (code === '/' && this.isComment(reader)) {
                return this.getCommentBock(reader);
            }
            if (!this.isIndent && code === '}') {
                return true;
            }
            return this.getBlock(reader, indentLength);
        }
        return false;
    }


    /**
     * 反向获取最后出现的换行符
     * @param reader 
     * @param start 
     * @param end 
     * @returns 
     */
    private getPreviousLine(reader: CharIterator, start: number, end = 0): number {
        while (start > end) {
            const code = reader.readSeek(--start);
            if (isLineCode(code)) {
                return start;
            }
        }
        return -1;
    }

    /**
     * 判断是否是评论
     * @param reader 
     * @returns 
     */
    private isComment(reader: CharIterator) {
        const tag = reader.read(2);
        if (tag === '//') {
            return true;
        }
        if (tag !== '//' && tag !== '/*') {
            return false;
        }
        return reader.indexOf('*/', 2) > 0;
    }

    /**
     * 获取评论元素，并移动位置
     * @returns 
     */
    private getCommentBock(reader: CharIterator): StyleToken {
        const tag = reader.read(2);
        const start = reader.position + 2;
        let end = reader.indexOf(tag === '//' ? '\n' : '*/', 2);
        if (tag !== '//' && end < 0) {
            end = reader.length;
        }
        const text = reader.read(end - start, 2) as string;
        reader.position = end + (tag === '//' ? 0 : 1);
        if (this.isIndent && tag === '/*') {
            this.moveNewLine(reader);
        }
        return {
            type: StyleTokenType.COMMENT,
            content: text.trim(),
        };
    }

    /**
     * 解析属性或其他
     * @param line 
     * @returns 
     */
    private getTextBlock(line: string): StyleToken|boolean {
        line = line.trim();
        for (const key in StyleTokenCoverter) {
            if (Object.prototype.hasOwnProperty.call(StyleTokenCoverter, key)) {
                const search: string = StyleTokenCoverter[key];
                if (line.startsWith(search)) {
                    return {
                        type: key as any,
                        content: line.substring(search.length).trim(),
                    };
                }
            }
        }
        const commaIndex = line.indexOf(':');
        if (commaIndex > 0) {
            return {
                type: StyleTokenType.STYLE,
                name: line.substring(0, commaIndex).trim(),
                content: line.substring(commaIndex + 1).trim(),
            };
        }
        if (line.length < 1) {
            return false;
        }
        return {
            type: StyleTokenType.TEXT,
            content: line,
        };
    }

    /**
     * 解析规则名，可能出多行
     * @param reader 
     * @param end 
     * @returns 
     */
    private getMultipleName(reader: CharIterator, end: number) {
        const commentItems = [];
        const nameItems: string[] = [];
        let name = '';
        const endPush = () => {
            name = name.trim();
            if (name.length > 0) {
                nameItems.push(name);
                name = '';
            }
        };
        reader.move(-1);
        while (reader.canNext && reader.position < end) {
            reader.moveNext();
            const code = reader.current;
            if (code === '{') {
                break;
            }
            if (this.isComment(reader)) {
                commentItems.push(this.getCommentBock(reader));
                continue;
            }
            if (code !== ',') {
                name += code;
                continue;
            }
            endPush();
        }
        endPush();
        return [nameItems, commentItems];
    }

    private getBlock = (reader: CharIterator, indentLength: number): StyleToken|boolean => {
        if (this.isIndent) {
            return this.getSassBlock(reader, indentLength);
        }
        let blockStart: number;
        const endIndex = reader.indexOf(';');
        blockStart = reader.indexOf('{');
        // 验证 block 是否正确 允许 #{$prefix} 存在
        while (blockStart > 0) {
            if (reader.readSeek(blockStart - 1, 1) !== '#') {
                break;
            }
            blockStart = reader.indexOf('{', blockStart - reader.position + 2);
        }
        if (endIndex > 0 && (blockStart < 0 || blockStart > endIndex)) {
            const line = reader.readRange(endIndex) as string;
            reader.position = endIndex;
            return this.getTextBlock(line);
        }
        // 有可能最后的属性没有 ; 结束符
        let blockEnd = this.minIndex(reader.indexOf('}'), reader.indexOf('//'), reader.indexOf('/*'));
        const commaIndex = reader.indexOf(',');
        // 如果下一行包含, 表示当前行为属性，下一行是规则名，
        if (commaIndex > 0 && (blockStart < 0 || blockStart > commaIndex) && (endIndex < 0 || commaIndex < endIndex) && blockEnd >= 0 && commaIndex < blockEnd) {
            const lineIndex = this.minIndex(reader.indexOf('\n'), reader.indexOf('\r'));
            if (lineIndex >= 0 && lineIndex < commaIndex) {
                const line = reader.readRange(lineIndex);
                reader.position = lineIndex - 1;
                return this.getTextBlock(line);
            }
            // 存在多个逗号分开的名称
        } else {
            if (blockEnd >= 0 && (blockStart < 0 || blockStart > blockEnd)) {
                const line = reader.readRange(blockEnd);
                reader.position = blockEnd - 1;
                return this.getTextBlock(line);
            }
            if (blockStart >= 0 && blockStart < blockEnd) {
                // 如果 下一行包含 { 表明下一行是新的style_group, 当前行为style
                blockEnd = this.getPreviousLine(reader, blockStart, reader.position);
                if (blockEnd > 0) {
                    const line = reader.readRange(blockEnd);
                    reader.position = blockEnd - 1;
                    return this.getTextBlock(line);
                }
            }
        }
        if (blockStart < 0) {
            const line = reader.readRange();
            reader.moveEnd();
            return this.getTextBlock(line);
        }
        const [nameItems, comments] = this.getMultipleName(reader, blockStart);
        return {
            type: StyleTokenType.STYLE_GROUP,
            name: nameItems as string[],
            children: [...comments as StyleToken[], ...this.renderBlock(reader, indentLength)],
        };
    }

    private minIndex = (...args: number[]): number => {
        const items = args.filter(i => i >= 0);
        if (items.length < 1) {
            return -1;
        }
        return Math.min(...items);
    }

//  下面是判断sass 的方法

    private getSassBlock(reader: CharIterator, indentLength: number): StyleToken|boolean {
        let blockStart: number;
        let endIndex: number;
        endIndex = this.minIndex(reader.indexOf('\n'), reader.indexOf('\r'), reader.length, reader.indexOf('//') - 1, reader.indexOf('/*') - 1);
        const lineIndentLength = this.indentSize(reader);
        let nextIndentLength = this.nextIndentSize(reader);
        if (lineIndentLength === indentLength) {
            if (nextIndentLength < lineIndentLength) {
                const line = reader.readRange(endIndex);
                reader.position = endIndex;
                return this.getTextBlock(line);
            }
            if (nextIndentLength === lineIndentLength) {
                // 判断 多行的规则名情况
                if (!this.lineEndIsComma(reader, endIndex, reader.position)) {
                    const line = reader.readRange(endIndex);
                    reader.position = endIndex;
                    return this.getTextBlock(line);
                }
                const pos = reader.position;
                while (reader.moveNext()) {
                    const code = reader.current;
                    if (!isLineCode(code)) {
                        continue;
                    }
                    this.moveNewLine(reader);
                    nextIndentLength = this.indentSize(reader);
                    if (nextIndentLength > indentLength) {
                        break;
                    }
                }
                endIndex = reader.position;
                reader.position = pos;
            }
        }
        blockStart = endIndex;
        indentLength = nextIndentLength;
        const [nameItems, comments] = this.getMultipleName(reader, blockStart);
        this.moveNewLine(reader);
        return {
            type: StyleTokenType.STYLE_GROUP,
            name: nameItems as string[],
            children: [...comments as StyleToken[], ...this.renderBlock(reader, indentLength)],
        };
    }

    /**
     * 判断缩进的数量
     * @param reader 
     * @param pos 
     * @returns 
     */
    private indentSize(reader: CharIterator, pos = reader.position): number {
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
    }

    /**
     * 计算排除空行后的新行起始位置
     * @param reader 
     * @param source 
     * @returns 
     */
    private jumpEmptyLine(reader: CharIterator, source: number): number {
        let code = reader.readSeek(source);
        if (code == '\n') {
            source += 1;
        } else if (code == '\r') {
            source += reader.readSeek(source + 1) === '\n' ? 2 : 1;
        } else if (!isEmptyCode(code)) {
            return source;
        }
        let pos = source;
        while (pos < reader.length - 1) {
            code = reader.readSeek(++ pos);
            if (isLineCode(code)) {
                return this.jumpEmptyLine(reader, pos);
            }
            if (!isEmptyCode(code)) {
                return source;
            }
        }
        return pos;
    }

    /**
     * 计算下一有效行的缩进数量
     * @param reader 
     * @param pos 
     * @returns 
     */
    private nextIndentSize(reader: CharIterator, pos = reader.position): number {
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
                    return this.indentSize(reader, this.jumpEmptyLine(reader, pos));
                }
            }
            if (!inComment && isLineCode(code)) {
                return this.indentSize(reader, this.jumpEmptyLine(reader, pos));
            }

        }
        return 0;
    }

    /**
     * 移动到新行的开始位置，排除空行，并返回是否移动了
     * @param reader 
     * @returns 
     */
    private moveNewLine(reader: CharIterator): boolean {
        const pos = reader.position;
        const newPos = this.jumpEmptyLine(reader, pos);
        if (newPos === pos) {
            return false;
        }
        reader.position = newPos - 1;
        return true;
    }

    /**
     * 判断行的结尾是否是逗号，
     * @param reader 
     * @param end 
     * @param start 
     * @returns 
     */
    private lineEndIsComma(reader: CharIterator, end: number, start = 0): boolean {
        while (end > start) {
            const code = reader.readSeek(--end);
            if (code === ',') {
                return true;
            }
            if (!isLineCode(code)) {
                return false;
            }
        }
        return false;
    }
}