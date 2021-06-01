import { CompliperFile } from '../compiler';
export declare const LINE_SPLITE = "\r\n";
export declare const splitLine: (content: string) => string[];
export declare const joinLine: (lines: string[]) => string;
export declare function firstUpper(val: string): string;
export declare function studly(val: string, isFirstUpper?: boolean): string;
export declare function eachFile(folder: string, cb: (file: CompliperFile) => void): void;
