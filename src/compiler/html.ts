import { SINGLE_TAGS, ElementToken } from '../tokenizer';
import { LINE_SPLITE } from '../util';
import { Compiler } from './base';

/**
 * 美化
 * @param indent 缩进
 */
export function htmlBeautify(indent: string = '    '): (item: ElementToken, content: string, level: number) => string {
    return (item: ElementToken, content: string, level: number) => {
        if (item.node === 'root') {
            return content;
        }
        if (item.node === 'text') {
            return item.text + '';
        }
        const spaces = indent.length > 0 ?  LINE_SPLITE + indent.repeat(level - 1) : indent;
        if (item.node === 'comment') {
            return `${spaces}<!-- ${item.text} -->`;
        }
        let attr = item.attributeString();
        if (attr.length > 0) {
            attr = ' ' + attr;
        }
        if (item.tag === '!DOCTYPE') {
            return `<${item.tag}${attr}>`;
        }
        if (SINGLE_TAGS.indexOf(item.tag) >= 0) {
            return `${spaces}<${item.tag}${attr}/>`;
        }
        const endSpaces = item.children && !item.isTextChild() ? spaces : '';
        return `${spaces}<${item.tag}${attr}>${content}${endSpaces}</${item.tag}>`;
    };
}

export class TemplateCompiler implements Compiler<ElementToken, string> {

    /**
     *
     */
    constructor(
        public indent = '',
    ) {
    }

    public render(data: ElementToken): string {
        return data.toString(htmlBeautify(this.indent));
    }

    public map(data: ElementToken, cb: (item: ElementToken) => any) {
        if (!data.children) {
            return;
        }
        data.children.forEach(item => {
            item.parent = data;
            if (item.ignore) {
                return;
            }
            cb(item);
        });
    }

    public toString(data: ElementToken, cb: (item: ElementToken, content: string, level: number) => string, level: number = 0): string {
        let str = '';
        this.map(data, item => {
            str += this.toString(item, cb, level + 1);
        });
        if (data.node === 'root') {
            return str;
        }
        return cb(data, str, level);
    }

    public toMap(data: ElementToken, cb: (item: ElementToken, children?: any[]) => any): any[] | any {
        const children: any[] = [];
        this.map(data, item => {
            children.push(this.toMap(item, cb));
        });
        if (data.node === 'root') {
            return children;
        }
        return cb(data, children.length < 1 ? undefined : children);
    }
}