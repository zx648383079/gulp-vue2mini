import { PackPipeline } from './pipeline';
export class PackLoader {
    static _instance;
    static get taskName() {
        return this._instance.taskName;
    }
    static get argv() {
        return this._instance.options;
    }
    static task(name, cb) {
        if (!this._instance) {
            return;
        }
        this._instance.task(name, cb);
    }
    static series(...names) {
        return () => names;
    }
    static input(...items) {
        return new PackPipeline(...items);
    }
}
