import { BaseCompliper, CompliperFile, ICompliper } from '../../compiler';
export declare class StyleProject extends BaseCompliper implements ICompliper {
    readyFile(src: CompliperFile): undefined | CompliperFile | CompliperFile[];
    compileFile(src: CompliperFile): void;
}
