import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';
import { TemplateProject } from './parser/template/project';
import { MiniProject } from './parser/mini/project';
import { formatArgv } from './argv';
import { StyleProject } from './parser/template/style';
import { ICompliper } from './compiler';

process.env.INIT_CWD = process.cwd();

const argv = formatArgv(process.argv, {
    mini: false,
    css: false,
    theme: false,
    watch: false,
    help: false,
    input: 'src',
    output: 'dist'
});

const helpText = `
Usage: vue2mini <command>
    --mini 编译小程序
    --theme 编译模板
    --css 转css为scss
    --help 帮助
    --input 源码文件或文件夹，默认为src
    --output 编译后保存的文件夹，默认为dist

Example:
    vue2mini --mini --input=src --output=dist

`;
if (argv.params.help) {
    console.log(helpText);
    process.exit(0);
}

const input = path.resolve(process.cwd(), argv.params.input);
const outputFolder = path.resolve(process.cwd(), argv.params.output);

if (!fs.existsSync(input)) {
    console.log('File [' + input + '] not found!');
    process.exit(0);
}
const inputState = fs.statSync(input);

const inputFolder = inputState.isDirectory() ? input : path.dirname(input);

const createProject = (): ICompliper|undefined => {
    if (argv.params.mini) {
        return new MiniProject(inputFolder, outputFolder, argv.params);
    }
    if (argv.params.theme) {
        return new TemplateProject(inputFolder, outputFolder, argv.params);
    }
    if (argv.params.css) {
        return new StyleProject(inputFolder, outputFolder, argv.params);
    }
    return undefined;
};

const project = createProject();

if (!project) {
    console.log(helpText);
    process.exit(0);
}

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
};


const compilerFile = (src: string) => {
    try {
        project?.compileFile(src);
    } catch (error) {
        project?.logFile(src, ' Failure \n' + error.message);
    }
};

if (argv.params.watch) {
    chokidar.watch(inputFolder).on('unlink', file => {
        project?.unlink(file);
    }).on('add', compilerFile).on('change', compilerFile);
} else {
    if (inputState.isFile()) {
        compilerFile(input);
    } else {
        eachFile(inputFolder, compilerFile);
    }
}
