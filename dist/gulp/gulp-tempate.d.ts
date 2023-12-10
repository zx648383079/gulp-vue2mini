/// <reference types="node" resolution-mode="require"/>
import { Transform } from 'readable-stream';
export declare function dealTemplateFile(contentBuff: Buffer, path: string, ext: string, wantTag: string): Buffer;
export declare function renameExt(path: string, ext: string): string;
export declare function replacePath(file: string, search: string, value: string): string;
export declare function template(tag: string, srcFolder?: string, distFolder?: string, tplExt?: string): Transform;
