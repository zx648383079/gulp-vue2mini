import * as ts from 'typescript';
import path from 'path';
export class Host {
    input;
    fallback;
    languageVersion;
    getDefaultLibLocation;
    realpath;
    getDirectories;
    directoryExists;
    readDirectory;
    constructor(input, options) {
        this.input = input;
        this.fallback = ts.createCompilerHost(options);
        this.languageVersion = options.target ?? ts.ScriptTarget.Latest;
        this.getDefaultLibLocation = this.fallback.getDefaultLibLocation;
        this.realpath = this.fallback.realpath;
        this.getDirectories = this.fallback.getDirectories;
        this.directoryExists = this.fallback.directoryExists;
        this.readDirectory = this.fallback.readDirectory;
    }
    getNewLine() {
        return this.fallback.getNewLine();
    }
    useCaseSensitiveFileNames() {
        return this.fallback.useCaseSensitiveFileNames();
    }
    getCurrentDirectory = () => {
        return this.input.inputFolder;
    };
    getCanonicalFileName(filename) {
        const normalized = path.normalize(filename);
        if (!this.useCaseSensitiveFileNames()) {
            return normalized.toLowerCase();
        }
        return normalized;
    }
    getDefaultLibFileName(options) {
        return this.fallback.getDefaultLibFileName(options);
    }
    writeFile() { }
    fileExists(fileName) {
        let sourceFile = this.input.getFile(fileName);
        if (sourceFile) {
            return true;
        }
        return this.fallback.fileExists(fileName);
    }
    readFile(fileName) {
        let sourceFile = this.input.getFile(fileName);
        if (sourceFile) {
            return this.input.readSync(sourceFile);
        }
        return this.fallback.readFile(fileName);
    }
    getSourceFile(fileName, languageVersion, onError) {
        const sourceFile = this.input.getFile(fileName);
        if (sourceFile) {
            return ts.createSourceFile(sourceFile.src, this.input.readSync(sourceFile), this.languageVersion);
        }
        return this.fallback.getSourceFile(fileName, languageVersion, onError);
    }
}
