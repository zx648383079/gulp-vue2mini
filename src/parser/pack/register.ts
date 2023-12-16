import { PackPipeline } from './pipeline';
import { PackProject } from './project';

export class PackLoader {

    public static _instance: PackProject;

    /**
     * 当前运行的任务名
     */
    public static get taskName(): string {
        return this._instance.taskName;
    }

    /**
     * 当前命令输入的参数
     */
    public static get argv(): {
        custom: string|boolean;
        min?: boolean;
        debug?: boolean;
    } {
        return this._instance.options;
    }

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

    /**
     * 输入文件
     * @param items 
     * @returns 
     */
    public static input(...items: string[]): PackPipeline {
        return new PackPipeline(...items);
    }
}