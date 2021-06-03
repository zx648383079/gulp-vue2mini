export interface Iterator<T, K = T[]> {
    get length(): number;
    get position(): number;
    set position(i: number);
    get canNext(): boolean;
    get canBack(): boolean;
    get current(): T;
    moveNext(): boolean;
    moveBack(): boolean;
    nextIs(...items: T[]): boolean;
    read(length?: number, offset?: number): T | K | undefined;
    move(length?: number): void;
    reset(): void;
    indexOf(code: T, offset?: number): number;
    forEach(cb: (code: T, i: number) => void | false): void;
}
