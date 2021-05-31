interface ILinkData {
    [key: string]: string[];
}

type LinkUpdateEvent = (file: string, mtime: number, source: string, ... args: any[]) => void;

export class LinkManager {

    private data: ILinkData = {}; // 关联文件
    private listeners: LinkUpdateEvent[] = [];

    /**
     * 触发更新
     * @param key 触发文件
     * @param mtime 文件的更改时间
     */
     public trigger(key: string, mtime: number, ... args: any[]) {
        if (!Object.prototype.hasOwnProperty.call(this.data, key)) {
            return;
        }
        this.data[key].forEach(file => {
            if (file) {
                this.listeners.forEach(cb => {
                    cb(file, mtime, key, ...args);
                });
            }
        });
    }

    public on(callback: LinkUpdateEvent) {
        this.listeners.push(callback);
    }

    /**
     * 添加链接文件
     * @param key 触发文件
     * @param file 目标包含触发文件
     */
    public push(key: string, file: string) {
        if (!Object.prototype.hasOwnProperty.call(this.data, key)) {
            this.data[key] = [file];
            return;
        }
        if (this.data[key].indexOf(file) >= 0) {
            return;
        }
        this.data[key].push(file);
    }

    /**
     * 删除文件，移除所有关联
     * @param file 
     */
    public remove(file: string): void;
    /**
     * 文件中删除了对key 的引用
     * @param key 
     * @param file 
     */
    public remove(key: string, file: string): void;
    /**
     * 更新文件，重置文件中的引用
     * @param file 
     * @param clearLink 
     */
    public remove(file: string, clearLink: true): void;
    public remove(key: string, file?: string|boolean) {
        if (!file) {
            this.removeFile(key);
            return;
        }
        if (file === true) {
            this.removeLink(key);
            return;
        }
        if (!Object.prototype.hasOwnProperty.call(this.data, key)) {
            return;
        }
        for (let index = this.data[key].length - 1; index >= 0; index--) {
            if (this.data[key][index] === file) {
                this.data[key].splice(index, 1);
            }
        }
    }

    private removeFile(file: string) {
        if (Object.prototype.hasOwnProperty.call(this.data, file)) {
            delete this.data[file];
        }
        this.removeLink(file);
    }

    private removeLink(file: string) {
        for (const key in this.data) {
            if (Object.prototype.hasOwnProperty.call(this.data, key)) {
                for (let index = this.data[key].length - 1; index >= 0; index--) {
                    if (this.data[key][index] === file) {
                        this.data[key].splice(index, 1);
                    }
                }
            }
        }
    }
}