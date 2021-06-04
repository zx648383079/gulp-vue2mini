import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';
import { TemplateProject } from './parser/template/project';
import { MiniProject } from './parser/mini/project';
import { formatArgv } from './argv';
import { StyleProject } from './parser/style/style';
import { CompilerFile, IProjectCompiler } from './compiler';
import { eachFile } from './util';

process.env.INIT_CWD = process.cwd();

const argv = formatArgv(process.argv, {
    mini: false,
    css: false,
    theme: false,
    watch: false,
    help: false,
    debug: false,
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
    --min 压缩ts和sass 生成的文件代码，仅对模板有效
    --watch 监听脚本变动，自动处理
    --debug 开启debug模式显示具体错误来源

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

const createProject = (): IProjectCompiler|undefined => {
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

const initTime = new Date().getTime();

const renderFile = (file: CompilerFile|string) => {
    if (typeof file !== 'object') {
        file = new CompilerFile(file);
    }
    if (argv.params.watch && file.mtime && file.mtime > initTime) {
        project.booted();
    }
    try {
        if (file.mtime < initTime) {
            file.mtime = initTime;
        }
        project?.compileFile(file);
    } catch (error) {
        project?.logFile(file, ' Failure \n' + error.message);
        if (argv.params.debug) {
            console.log(error);
        }
    }
};

if (argv.params.watch) {
    chokidar.watch(inputFolder).on('unlink', file => {
        project?.unlink(file);
    }).on('add', (file, stats) => {
        renderFile(new CompilerFile(file, stats?.mtimeMs))
    }).on('change', (file, stats) => {
        renderFile(new CompilerFile(file, stats?.mtimeMs))
    });
} else {
    if (inputState.isFile()) {
        renderFile(new CompilerFile(input, initTime));
    } else {
        eachFile(inputFolder, renderFile);
    }
}
