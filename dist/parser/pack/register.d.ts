import { PackPipeline } from './pipeline';
import { PackProject } from './project';
export declare class PackLoader {
    static _instance: PackProject;
    static task(name: string, cb: Function): void;
    static series(...names: string[]): Function;
    static input(...items: string[]): PackPipeline;
}
