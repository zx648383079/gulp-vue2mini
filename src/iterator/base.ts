export interface Iterator<T, K = T[]> {
    /**
     * 数据的总长度
     */
    get length(): number;
    /**
     * 当前的位置
     */
    get position(): number;
    /**
     * 设置当前位置
     */
    set position(i: number);
    /**
     * 是否还有下一个
     */
    get canNext(): boolean;
    /**
     * 是否能返回上一个
     */
    get canBack(): boolean;

    get current(): T;

    /**
     * 能否移动到下一个
     */
    moveNext(): boolean;
    moveBack(): boolean;

    /**
     * 下一个值是，不移动位置
     * @param items 
     */
    nextIs(...items: T[]): boolean;
    /**
     * 从当前位置开始读取一定长度的数据，不会移动指针
     * @param length 
     */
    read(length?: number, offset?: number): T|K|undefined;
    /**
     * 移动指针
     * @param length 
     */
    move(length?: number): void;

    reset(): void;

    /**
     * 从当前位置开始判读是否还存在指定字符串
     * @param code 
     */
    indexOf(code: T, offset?: number): number;
    /**
     * 循环，从当前位置开始，同时更新当前位置
     * @param cb 
     */
    forEach(cb: (code: T, i: number) => void|false): void;
}