import { CharIterator } from '../iterator';
import { isEmptyCode, isLineCode } from '../util';
export var StyleTokenType;
(function (StyleTokenType) {
    StyleTokenType[StyleTokenType["COMMENT"] = 0] = "COMMENT";
    StyleTokenType[StyleTokenType["CHASET"] = 1] = "CHASET";
    StyleTokenType[StyleTokenType["IMPORT"] = 2] = "IMPORT";
    StyleTokenType[StyleTokenType["INCLUDE"] = 3] = "INCLUDE";
    StyleTokenType[StyleTokenType["EXTEND"] = 4] = "EXTEND";
    StyleTokenType[StyleTokenType["USE"] = 5] = "USE";
    StyleTokenType[StyleTokenType["FORWARD"] = 6] = "FORWARD";
    StyleTokenType[StyleTokenType["TEXT"] = 7] = "TEXT";
    StyleTokenType[StyleTokenType["STYLE_GROUP"] = 8] = "STYLE_GROUP";
    StyleTokenType[StyleTokenType["STYLE"] = 9] = "STYLE";
})(StyleTokenType || (StyleTokenType = {}));
export const StyleTokenCoverter = {
    [StyleTokenType.EXTEND]: '@extend',
    [StyleTokenType.CHASET]: '@charset',
    [StyleTokenType.USE]: '@use',
    [StyleTokenType.FORWARD]: '@forward',
    [StyleTokenType.IMPORT]: '@import',
    [StyleTokenType.INCLUDE]: '@include',
};
export class StyleTokenizer {
    isIndent;
    constructor(isIndent = false) {
        this.isIndent = isIndent;
    }
    autoIndent(content) {
        this.isIndent = content.indexOf('{') < 0;
    }
    render(content) {
        const reader = content instanceof CharIterator ? content : new CharIterator(content);
        reader.reset();
        return this.renderBlock(reader);
    }
    renderBlock(reader, indentLength = 0) {
        const items = [];
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
    parserBlock = (reader, indentLength) => {
        let code;
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
    };
    getPreviousLine(reader, start, end = 0) {
        while (start > end) {
            const code = reader.readSeek(--start);
            if (isLineCode(code)) {
                return start;
            }
        }
        return -1;
    }
    isComment(reader) {
        const tag = reader.read(2);
        if (tag === '//') {
            return true;
        }
        if (tag !== '//' && tag !== '/*') {
            return false;
        }
        return reader.indexOf('*/', 2) > 0;
    }
    getCommentBock(reader) {
        const tag = reader.read(2);
        const start = reader.position + 2;
        let end = reader.indexOf(tag === '//' ? '\n' : '*/', 2);
        if (tag !== '//' && end < 0) {
            end = reader.length;
        }
        const text = reader.read(end - start, 2);
        reader.position = end + (tag === '//' ? 0 : 1);
        if (this.isIndent && tag === '/*') {
            this.moveNewLine(reader);
        }
        return {
            type: StyleTokenType.COMMENT,
            content: text.trim(),
        };
    }
    getTextBlock(line) {
        line = line.trim();
        for (const key in StyleTokenCoverter) {
            if (Object.prototype.hasOwnProperty.call(StyleTokenCoverter, key)) {
                const search = StyleTokenCoverter[key];
                if (line.startsWith(search)) {
                    return {
                        type: key,
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
    getMultipleName(reader, end) {
        const commentItems = [];
        const nameItems = [];
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
    getBlock = (reader, indentLength) => {
        if (this.isIndent) {
            return this.getSassBlock(reader, indentLength);
        }
        let blockStart;
        const endIndex = reader.indexOf(';');
        blockStart = reader.indexOf('{');
        while (blockStart > 0) {
            if (reader.readSeek(blockStart - 1, 1) !== '#') {
                break;
            }
            blockStart = reader.indexOf('{', blockStart - reader.position + 2);
        }
        if (endIndex > 0 && (blockStart < 0 || blockStart > endIndex)) {
            const line = reader.readRange(endIndex);
            reader.position = endIndex;
            return this.getTextBlock(line);
        }
        let blockEnd = this.minIndex(reader.indexOf('}'), reader.indexOf('//'), reader.indexOf('/*'));
        const commaIndex = reader.indexOf(',');
        if (commaIndex > 0 && (blockStart < 0 || blockStart > commaIndex) && (endIndex < 0 || commaIndex < endIndex) && blockEnd >= 0 && commaIndex < blockEnd) {
            const lineIndex = this.minIndex(reader.indexOf('\n'), reader.indexOf('\r'));
            if (lineIndex >= 0 && lineIndex < commaIndex) {
                const line = reader.readRange(lineIndex);
                reader.position = lineIndex - 1;
                return this.getTextBlock(line);
            }
        }
        else {
            if (blockEnd >= 0 && (blockStart < 0 || blockStart > blockEnd)) {
                const line = reader.readRange(blockEnd);
                reader.position = blockEnd - 1;
                return this.getTextBlock(line);
            }
            if (blockStart >= 0 && blockStart < blockEnd) {
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
            name: nameItems,
            children: [...comments, ...this.renderBlock(reader, indentLength)],
        };
    };
    minIndex = (...args) => {
        const items = args.filter(i => i >= 0);
        if (items.length < 1) {
            return -1;
        }
        return Math.min(...items);
    };
    getSassBlock(reader, indentLength) {
        let blockStart;
        let endIndex;
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
            name: nameItems,
            children: [...comments, ...this.renderBlock(reader, indentLength)],
        };
    }
    indentSize(reader, pos = reader.position) {
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
                count++;
                continue;
            }
            break;
        }
        return count;
    }
    jumpEmptyLine(reader, source) {
        let code = reader.readSeek(source);
        if (code == '\n') {
            source += 1;
        }
        else if (code == '\r') {
            source += reader.readSeek(source + 1) === '\n' ? 2 : 1;
        }
        else if (!isEmptyCode(code)) {
            return source;
        }
        let pos = source;
        while (pos < reader.length - 1) {
            code = reader.readSeek(++pos);
            if (isLineCode(code)) {
                return this.jumpEmptyLine(reader, pos);
            }
            if (!isEmptyCode(code)) {
                return source;
            }
        }
        return pos;
    }
    nextIndentSize(reader, pos = reader.position) {
        let inComment = false;
        let code;
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
    moveNewLine(reader) {
        const pos = reader.position;
        const newPos = this.jumpEmptyLine(reader, pos);
        if (newPos === pos) {
            return false;
        }
        reader.position = newPos - 1;
        return true;
    }
    lineEndIsComma(reader, end, start = 0) {
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
