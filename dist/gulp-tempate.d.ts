/// <reference types="node" />
import { Transform } from "readable-stream";
export declare function dealTemplateFile(contentBuff: Buffer, path: string, ext: string, wantTag: string): Buffer;
export declare function template(tag: string): Transform;
