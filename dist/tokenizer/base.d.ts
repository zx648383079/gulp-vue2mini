export interface Tokenizer<T = any, K = any> {
    render(source: T): K;
}
