import { Attribute } from "./attribute";

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
        this.children.forEach(cb);
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
     * toString
     */
    public toString(cb: (item: Element, content: string, level: number) => string, level: number = 0): string {
        let str = '';
        this.map(item => {
            str += item.toString(cb, level + 1);
        });
        if (!this.node && this.tag === 'root') {
            return str;
        }
        return cb(this, str, level);
    }

    /**
     * toJson
     */
    public toJson(cb: (item: Element, children: any[]) => any): any[] | any {
        let children: any[] = [];
        this.map(item => {
            children.push(item.toJson(cb));
        });
        if (!this.node && this.tag === 'root') {
            return children;
        }
        return cb(this, children);
    }

    /**
     * comment
     */
    public static comment(text: string) {
        return new Element('comment', text);
    }

    public static text(text: string) {
        return new Element('text', text);
    }

    public static noKid(tag: string, attribute?: any) {
        return new Element(tag, undefined, 'element', undefined, Attribute.create(attribute));
    }

    public static create(tag: string, children: Element[], attribute?: any) {
        return new Element(tag, undefined, 'element', children, Attribute.create(attribute));
    }
}