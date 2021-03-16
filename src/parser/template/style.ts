import * as fs from 'fs';
import * as path from 'path';
import { consoleLog, ICompliper } from '../../compiler';
import { cssToScss } from '../css';

export class StyleProject implements ICompliper {

    constructor(
        public inputFolder: string,
        public outputFolder: string,
        public options?: any
    ) {
    }

    public compileFile(src: string): void {
        // const ext = path.extname(src);
        const dist = this.outputFile(src);
        fs.writeFileSync(dist, cssToScss(fs.readFileSync(src).toString()));
        this.logFile(src);
    }

    public outputFile(file: string) {
        return path.resolve(this.outputFolder, path.relative(this.inputFolder, file));
    }

    public unlink(src: string) {
        const dist = this.outputFile(src);
        if (fs.existsSync(dist)) {
            fs.unlinkSync(dist);
        }
    }

    public logFile(file: string, tip = 'Finished') {
        consoleLog(file, tip, this.inputFolder);
    }
}
