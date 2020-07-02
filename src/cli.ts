import * as fs from "fs";
import * as path from "path";
import * as chokidar from "chokidar";
import { UiCompliper } from "./parser/ui";
import { MiniCompliper } from "./compiler";
import { formatArgv } from "./argv";

process.env.INIT_CWD = process.cwd();

const argv = formatArgv(process.argv, {
    mini: false,
    watch: false,
    input: 'src',
    output: 'dist'
});

const input = path.resolve(process.cwd(), argv.params.input);
const outputFolder = path.resolve(process.cwd(), argv.params.output);

const inputState = fs.statSync(input);

const inputFolder = inputState.isDirectory() ? input : path.dirname(input);

const compiler = argv.params.mini ? new MiniCompliper(inputFolder, outputFolder, argv.params) : new UiCompliper(inputFolder, outputFolder, argv.params);

const eachFile = (folder: string, cb: (file: string) => void) => {
    const dirInfo = fs.readdirSync(folder);
    dirInfo.forEach(item => {
        const location = path.join(folder, item);
        const info = fs.statSync(location);
        if (info.isDirectory()) {
            eachFile(location, cb);
            return;
        }
        cb(location);
    });
}


const compilerFile = (src: string) => {
    try {
        compiler.compileFile(src);
    } catch (error) {
        compiler.logFile(src, ' Failure \n' + error.message);
    }
};

if (argv.params.watch) {
    chokidar.watch(inputFolder).on("unlink", file => {
        const dist = compiler.outputFile(file);
        if (fs.existsSync(dist)) {
            fs.unlinkSync(dist);
        }
    }).on('add', compilerFile).on('change', compilerFile);
} else {
    if (inputState.isFile()) {
        compilerFile(input);
    } else {
        eachFile(inputFolder, compilerFile);
    }
}