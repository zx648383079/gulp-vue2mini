import * as ts from 'typescript';
import { PackProject } from './project';
export declare class Host implements ts.CompilerHost {
    private input;
    private fallback;
    private languageVersion;
    getDefaultLibLocation?: () => string;
    realpath?: (path: string) => string;
    getDirectories?: (path: string) => string[];
    directoryExists?: (path: string) => boolean;
    readDirectory?: (rootDir: string, extensions: string[], excludes: string[], includes: string[], depth?: number) => string[];
    constructor(input: PackProject, options: ts.CompilerOptions);
    getNewLine(): string;
    useCaseSensitiveFileNames(): boolean;
    getCurrentDirectory: () => string;
    getCanonicalFileName(filename: string): string;
    getDefaultLibFileName(options: ts.CompilerOptions): string;
    writeFile(): void;
    fileExists(fileName: string): boolean;
    readFile(fileName: string): string | undefined;
    getSourceFile(fileName: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void): ts.SourceFile | undefined;
}
