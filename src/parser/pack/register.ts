import { PackPipeline } from './pipeline';
import { PackProject } from './project';

export class PackLoader {

    public static _instance: PackProject;

    /**
     * 注册任务
     * @param name 任务名称，默认 default
     * @param cb 
     * @returns 
     */
    public static task(name: string, cb: Function) {
        if (!this._instance) {
            return;
        }
        this._instance.task(name, cb);
    }

    /**
     * 执行多个任务
     * @param names 任务的名称
     * @returns 
     */
    public static series(...names: string[]): Function {
        return () => names;
    }

    public static input(...items: string[]): PackPipeline {
        return new PackPipeline(...items);
    }
}