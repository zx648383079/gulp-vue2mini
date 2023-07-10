type LinkUpdateEvent = (file: string, mtime: number, source: string, ...args: any[]) => void;
export declare class LinkManager {
    private data;
    private listeners;
    private lockItems;
    trigger(key: string, mtime: number, ...args: any[]): void;
    on(callback: LinkUpdateEvent): void;
    push(key: string, file: string): void;
    lock(file: string, cb: () => void): void;
    remove(file: string): void;
    remove(key: string, file: string): void;
    remove(file: string, clearLink: true): void;
    private removeFile;
    private removeLink;
}
export {};
