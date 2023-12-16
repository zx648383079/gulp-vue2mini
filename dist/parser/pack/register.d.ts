import { PackPipeline } from './pipeline';
import { PackProject } from './project';
export declare class PackLoader {
    static _instance: PackProject;
    static get taskName(): string;
    static get argv(): {
        custom: string | boolean;
        min?: boolean;
        debug?: boolean;
    };
    static task(name: string, cb: Function): void;
    static series(...names: string[]): Function;
    static input(...items: string[]): PackPipeline;
}
