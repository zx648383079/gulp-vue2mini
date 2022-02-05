import { MiniProject } from './project';


export class JsonParser {

    constructor(
        _: MiniProject
    ) {}
    
    public render(... args: any[]): string {
        return JSON.stringify(this.merge(...args));
    }

    public merge(... args: any[]) {
        const items = [];
        for (const item of args) {
            if (!item) {
                continue;
            }
            if (typeof item === 'object') {
                items.push(item);
                continue;
            }
            if (typeof item !== 'string') {
                continue;
            }
            const res = eval(item.trim());
            if (typeof res === 'object') {
                items.push(res);
            }
        }
        if (items.length < 1) {
            return {};
        }
        return Object.assign({}, ... items);
    }
}