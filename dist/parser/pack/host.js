"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Host = void 0;
const ts = __importStar(require("typescript"));
const path_1 = __importDefault(require("path"));
class Host {
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
        const normalized = path_1.default.normalize(filename);
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
exports.Host = Host;
