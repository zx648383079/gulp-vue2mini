import * as ts from 'typescript';
import { PackProject } from './project';
import * as path from 'path';

export class Host implements ts.CompilerHost {


    private fallback: ts.CompilerHost;
    private languageVersion: ts.ScriptTarget;
    public getDefaultLibLocation?: () => string;
    public realpath?: (path: string) => string;
	public getDirectories?: (path: string) => string[];
	public directoryExists?: (path: string) => boolean;
	public readDirectory?: (rootDir: string, extensions: string[], excludes: string[], includes: string[], depth?: number) => string[];

    constructor(
        private input: PackProject,
        options: ts.CompilerOptions,
    ) {
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
	}

	getCanonicalFileName(filename: string) {
        const normalized = path.normalize(filename);
        if (!this.useCaseSensitiveFileNames()) {
            return normalized.toLowerCase();
        }
        return normalized;
	}

	getDefaultLibFileName(options: ts.CompilerOptions) {
		return this.fallback.getDefaultLibFileName(options);
	}

	writeFile() {}

	public fileExists (fileName: string) {
		let sourceFile = this.input.getFile(fileName);
		if (sourceFile) {
            return true;
        }
		return this.fallback.fileExists(fileName);
	}

	public readFile(fileName: string) {
		let sourceFile = this.input.getFile(fileName);
		if (sourceFile) {
            return this.input.readSync(sourceFile);
        }
		return this.fallback.readFile(fileName);
	}

	public getSourceFile(fileName: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void): ts.SourceFile|undefined {
		const sourceFile = this.input.getFile(fileName);
		if (sourceFile) {
            return ts.createSourceFile(
                sourceFile.src,
                this.input.readSync(sourceFile),
                this.languageVersion,
            );
        }
		return this.fallback.getSourceFile(fileName, languageVersion, onError);
	}

	

}