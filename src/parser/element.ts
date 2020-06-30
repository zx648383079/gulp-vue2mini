import { Attribute } from "./attribute";
import { SINGLE_TAGS } from "./html";
import { LINE_SPLITE } from "./ts";

export class Element {
    /**
     *
     */
    constructor(
        public tag: string = '',
        public text?: string,
        public node?: string,
        public children?: Element[],
        public attribute?: Attribute
    ) {
        
    }

    public ignore = false;

    public parent?: Element;

    public attr(key: string | any, value?: any) {
        if (!this.attribute) {
            this.attribute = new Attribute();
        }
        if (typeof value !== 'undefined') {
            this.attribute.set(key, value);
            return this;
        }
        if (typeof key === 'object') {
            this.attribute.set(key);
            return this;
        }
        return this.attribute.get(key);
    }

    /**
     * push
     */
    public push(...items: Element[]) {
        if (!this.children) {
            this.children = [];
        }
        for (const item of items) {
            if (!item) {
                continue;
            }
            this.children.push(item);
        }
        return this;
    }

    /**
     * map
     */
    public map(cb: (item: Element) => any) {
        if (!this.children) {
            return;
        }
        this.children.forEach(item => {
            item.parent = this;
            if (item.ignore) {
                return;
            }
            cb(item);
        });
    }

    /**
     * attributeString
     */
    public attributeString(): string {
        if (!this.attribute) {
            return '';
        }
        return this.attribute.toString();
    }

    /**
     * 判断内容是否为text
     */
    public isTextChild() {
        if (!this.children) {
            return false;
        }
        for (const item of this.children) {
            if (item.node !== 'text') {
                return false;
            }
        }
        return true;
    }

    /**
     * toString
     */
    public toString(cb: (item: Element, content: string, level: number) => string, level: number = 0): string {
        let str = '';
        this.map(item => {
            str += item.toString(cb, level + 1);
        });
        if (this.node === 'root') {
            return str;
        }
        return cb(this, str, level);
    }

    /**
     * toJson
     */
    public toJson(cb: (item: Element, children?: any[]) => any): any[] | any {
        let children: any[] = [];
        this.map(item => {
            children.push(item.toJson(cb));
        });
        if (this.node === 'root') {
            return children;
        }
        return cb(this, children.length < 1 ? undefined : children);
    }

    public clone() {
        return new Element(this.tag, this.text, this.node, this.children, this.attribute);
    }

    /**
     * comment
     */
    public static comment(text: string) {
        return Element.nodeElement('comment', text);
    }

    public static text(text: string) {
        return Element.nodeElement('text', text);
    }

    public static nodeElement(node: string, text: string| Element[]) {
        if (typeof text === 'object') {
            return new Element(undefined, undefined, node, text);
        }
        return new Element(undefined, text, node);
    }

    public static noKid(tag: string, attribute?: any) {
        return new Element(tag, undefined, 'element', undefined, Attribute.create(attribute));
    }

    public static create(tag: string, children: Element[], attribute?: any) {
        return new Element(tag, undefined, 'element', children, Attribute.create(attribute));
    }

    /**
     * 美化
     * @param indent 
     */
    public static htmlBeautify(indent: string = '    '):  (item: Element, content: string, level: number) => string {
        return (item: Element, content: string, level: number) => {
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
            return `${spaces}<${item.tag}${attr}>${content}${endSpaces}</${item.tag}>`
        }
    }

    public static jsonCallback(item: Element, children?: any[]): any[] | any {
        if (item.node === 'root') {
            return children;
        }
        if (item.node === 'text' || item.node === 'comment') {
            return {
                node: item.node,
                text: item.text
            };
        }
        let data: any = {
            node: item.node,
            tag: item.tag
        };
        if (children) {
            data.children = children;
        }
        if (item.attribute) {
            data.attrs = item.attribute;
        }
        return data;
    }
}