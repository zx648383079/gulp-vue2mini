export interface Compiler<T = any, K = any> {
    render(source: T): K;
}
