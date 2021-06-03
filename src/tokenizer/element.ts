import { Attribute } from './attribute';

export class ElementToken {
    public ignore = false;

    public parent?: ElementToken;
    /**
     * comment
     */
    public static comment(text: string) {
        return ElementToken.nodeElement('comment', text);
    }

    public static text(text: string) {
        return ElementToken.nodeElement('text', text);
    }

    public static nodeElement(node: string, text: string| ElementToken[]) {
        if (typeof text === 'object') {
            return new ElementToken(undefined, undefined, node, text);
        }
        return new ElementToken(undefined, text, node);
    }

    public static noKid(tag: string, attribute?: any) {
        return new ElementToken(tag, undefined, 'element', undefined, Attribute.create(attribute));
    }

    public static create(tag: string, children: ElementToken[], attribute?: any) {
        return new ElementToken(tag, undefined, 'element', children, Attribute.create(attribute));
    }

    

    public static jsonCallback(item: ElementToken, children?: any[]): any[] | any {
        if (item.node === 'root') {
            return children;
        }
        if (item.node === 'text' || item.node === 'comment') {
            return {
                node: item.node,
                text: item.text
            };
        }
        const data: any = {
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

    constructor(
        public tag: string = '',
        public text?: string,
        public node?: string,
        public children?: ElementToken[],
        public attribute?: Attribute
    ) {
    }

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
    public push(...items: ElementToken[]) {
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
    public map(cb: (item: ElementToken) => any) {
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
    public toString(cb: (item: ElementToken, content: string, level: number) => string, level: number = 0): string {
        let str = '';
        this.map(item => {
            str += item.toString(cb, level + 1);
        });
        if (this.node === 'root') {
            return str;
        }
        return cb(this, str, level);
    }

    public toMap(cb: (item: ElementToken, children?: any[]) => any): any[] | any {
        const children: any[] = [];
        this.map(item => {
            children.push(item.toMap(cb));
        });
        if (this.node === 'root') {
            return children;
        }
        return cb(this, children.length < 1 ? undefined : children);
    }

    public clone() {
        return new ElementToken(this.tag, this.text, this.node, this.children, this.attribute);
    }


}
