import { StyleToken, StyleTokenCoverter, StyleTokenType } from '../tokenizer';
import { LINE_SPLITE, splitLine } from '../util';
import { Compiler } from './base';

export class StyleCompiler implements Compiler<StyleToken[], string> {

    /**
     *
     */
    constructor(
        private indent = '    ',
        private isIndent = false,
    ) {
    }

    public render(data: StyleToken[]): string {
        const endTextJoin = (...items: string[]) => {
            if (this.isIndent) {
                return items.join('');
            }
            return items.join('') + ';';
        }
        return this.toString(data, (item, content, level) => {
            const spaces = this.indent.length > 0 ? this.indent.repeat(level) : this.indent;
            if (item.type === StyleTokenType.TEXT) {
                return endTextJoin(spaces, item.content as string) + LINE_SPLITE;
            }
            if (item.type === StyleTokenType.COMMENT) {
                const text = item.content!;
                if (text.indexOf('\n') < 0) {
                    return spaces + '// ' + item.content + LINE_SPLITE;
                }
                return spaces + '/* ' + splitLine(text).map(i => i.trim()).join(LINE_SPLITE + spaces) + ' */' + LINE_SPLITE;
            }
            if (Object.prototype.hasOwnProperty.call(StyleTokenCoverter, item.type)) {
                return endTextJoin(spaces, StyleTokenCoverter[item.type], ' ', item.content as string) + LINE_SPLITE;
            }
            if (item.type === StyleTokenType.STYLE) {
                return endTextJoin(spaces, item.name as string, ': ', item.content as string) + LINE_SPLITE;
            }
            if (item.type === StyleTokenType.STYLE_GROUP) {
                const line = spaces + (typeof item.name === 'object' ? item.name.join(',' + LINE_SPLITE + spaces) : item.name) + (this.isIndent ? '' : ' {') + LINE_SPLITE + content;
                if (!this.isIndent) {
                    return line + spaces + '}' + LINE_SPLITE;
                }
                return line;
            }
            return '';
        });
    }

    public map(data: StyleToken[]|StyleToken, cb: (item: StyleToken) => any) {
        const items = data instanceof Array ? data : data.children;
        if (!items) {
            return;
        }
        items.forEach(item => {
            cb(item);
        });
    }

    public toString(data: StyleToken[]|StyleToken, cb: (item: StyleToken, content: string, level: number) => string, level: number = 0): string {
        let str = '';
        if (level > 0 && data instanceof Array) {
            data = data.sort((a, b) => {
                if (a.type === b.type) {
                    return 0;
                }
                if (a.type === StyleTokenType.STYLE_GROUP) {
                    return 1;
                }
                if (b.type === StyleTokenType.STYLE_GROUP) {
                    return -1;
                }
                return 0;
            });
        }
        this.map(data, item => {
            str += this.toString(item, cb, level + 1);
        });
        if (data instanceof Array) {
            return str;
        }
        return cb(data, str, level);
    }

    public toMap(data: StyleToken[]|StyleToken, cb: (item: StyleToken, children?: any[]) => any): any[] | any {
        const children: any[] = [];
        this.map(data, item => {
            children.push(this.toMap(item, cb));
        });
        if (data instanceof Array) {
            return children;
        }
        return cb(data, children.length < 1 ? undefined : children);
    }
}