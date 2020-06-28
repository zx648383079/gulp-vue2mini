interface IArgv<T extends Record<string, any>> {
    _: Array<string>;
    additional: Array<string | number>;
    params: T;
}
export declare function formatArgv<T extends Record<string, any>>(argv?: Array<string>, defaultParams?: T): IArgv<T>;
export {};
