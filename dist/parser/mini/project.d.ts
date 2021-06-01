import { StyleParser } from './css';
import { VueParser } from './vue';
import { BaseCompliper, CompliperFile, ICompliper } from '../../compiler';
import { ScriptParser } from './ts';
import { LinkManager } from '../link';
import { TemplateParser } from './wxml';
import { JsonParser } from './json';
export declare class MiniProject extends BaseCompliper implements ICompliper {
    readonly link: LinkManager;
    readonly script: ScriptParser;
    readonly template: TemplateParser;
    readonly style: StyleParser;
    readonly json: JsonParser;
    readonly mix: VueParser;
    readyFile(src: CompliperFile): undefined | CompliperFile | CompliperFile[];
    readyMixFile(src: CompliperFile): CompliperFile[];
    readyMixFile(src: CompliperFile, dist: string): CompliperFile[];
    readyMixFile(src: CompliperFile, ext: string, dist: string): CompliperFile[];
    readyMixFile(src: CompliperFile, content: string, ext: string, dist: string): CompliperFile[];
    compileFile(src: CompliperFile): void;
}
