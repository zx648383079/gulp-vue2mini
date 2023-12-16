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
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const chokidar = __importStar(require("chokidar"));
const project_1 = require("./parser/template/project");
const project_2 = require("./parser/mini/project");
const argv_1 = require("./argv");
const style_1 = require("./parser/style/style");
const compiler_1 = require("./compiler");
const util_1 = require("./util");
const project_3 = require("./parser/pack/project");
process.env.INIT_CWD = process.cwd();
const argv = (0, argv_1.formatArgv)(process.argv, {
    mini: false,
    custom: false,
    css: false,
    theme: false,
    watch: false,
    help: false,
    debug: false,
    prefix: 'zre',
    input: 'src',
    output: 'dist'
});
const helpText = `
Usage: vue2mini <command>
    --mini 编译小程序
    --theme 编译模板
    --custom 自定义功能，引用当前目录中的 packfile.js
    --css 转css为scss
    --prefix 前缀,css 中的值前缀, 有值则启用var, 默认启用
    --help 帮助
    --input 源码文件或文件夹,默认为src
    --output 编译后保存的文件夹,默认为dist
    --min 压缩ts和sass 生成的文件代码,仅对模板有效
    --watch 监听脚本变动,自动处理
    --debug 开启debug模式显示具体错误来源

Example:
    vue2mini --mini --input=src --output=dist

`;
if (argv.params.help) {
    console.log(helpText);
    process.exit(0);
}
if (argv.params.custom) {
    argv.params.input = '';
}
const input = path.resolve(process.cwd(), argv.params.input);
const outputFolder = path.resolve(process.cwd(), argv.params.output);
if (!fs.existsSync(input)) {
    console.log('File [' + input + '] not found!');
    process.exit(0);
}
const inputState = fs.statSync(input);
const inputFolder = inputState.isDirectory() ? input : path.dirname(input);
const createProject = () => {
    if (argv.params.mini) {
        return new project_2.MiniProject(inputFolder, outputFolder, argv.params);
    }
    if (argv.params.theme) {
        return new project_1.TemplateProject(inputFolder, outputFolder, argv.params);
    }
    if (argv.params.css) {
        return new style_1.StyleProject(inputFolder, outputFolder, argv.params);
    }
    if (argv.params.custom) {
        return new project_3.PackProject(inputFolder, outputFolder, argv.params);
    }
    return undefined;
};
const project = createProject();
if (!project) {
    console.log(helpText);
    process.exit(0);
}
const initTime = new Date().getTime();
const renderFile = (file) => {
    if (typeof file !== 'object') {
        file = new compiler_1.CompilerFile(file);
    }
    if (argv.params.watch && file.mtime && file.mtime > initTime) {
        project.booted();
    }
    try {
        if (file.mtime < initTime) {
            file.mtime = initTime;
        }
        project?.compileFile(file);
    }
    catch (error) {
        project?.logFile(file, 'Failure \n' + error.message, compiler_1.LogLevel.error);
        if (argv.params.debug) {
            project?.logger.debug(error);
        }
    }
};
if (project instanceof project_3.PackProject) {
    project.compile();
}
else if (argv.params.watch) {
    chokidar.watch(inputFolder).on('unlink', file => {
        project?.unlink(file);
    }).on('add', (file, stats) => {
        renderFile(new compiler_1.CompilerFile(file, stats?.mtimeMs));
    }).on('change', (file, stats) => {
        renderFile(new compiler_1.CompilerFile(file, stats?.mtimeMs));
    });
}
else {
    if (inputState.isFile()) {
        renderFile(new compiler_1.CompilerFile(input, initTime));
    }
    else {
        (0, util_1.eachFile)(inputFolder, renderFile);
    }
}
