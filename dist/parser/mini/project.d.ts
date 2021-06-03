import { StyleParser } from './css';
import { VueParser } from './vue';
import { BaseProjectCompiler, CompilerFile, IProjectCompiler } from '../../compiler';
import { ScriptParser } from './ts';
import { LinkManager } from '../../util/link';
import { WxmlCompiler } from './wxml';
import { JsonParser } from './json';
export declare class MiniProject extends BaseProjectCompiler implements IProjectCompiler {
    readonly link: LinkManager;
    readonly script: ScriptParser;
    readonly template: WxmlCompiler;
    readonly style: StyleParser;
    readonly json: JsonParser;
    readonly mix: VueParser;
    readyFile(src: CompilerFile): undefined | CompilerFile | CompilerFile[];
    readyMixFile(src: CompilerFile): CompilerFile[];
    readyMixFile(src: CompilerFile, dist: string): CompilerFile[];
    readyMixFile(src: CompilerFile, ext: string, dist: string): CompilerFile[];
    readyMixFile(src: CompilerFile, content: string, ext: string, dist: string): CompilerFile[];
    compileFile(src: CompilerFile): void;
}
