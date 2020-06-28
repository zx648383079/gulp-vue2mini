import * as fs from "fs";
import * as path from "path";
import * as chokidar from "chokidar";
import { renderFile } from "./parser/ui";
import { Compiler } from "./compiler";
import { preImport, endImport, replaceTTF } from "./parser/css";
import { splitFile } from "./parser/vue";
import { formatArgv } from "./argv";

process.env.INIT_CWD = process.cwd();

const argv = formatArgv(process.argv, {
    mini: false,
    watch: false,
    input: 'src',
    output: 'dist'
});

const inputFolder = path.resolve(process.cwd(), argv.params.input);
const outputFolder = path.resolve(process.cwd(), argv.params.output);

const inputState = fs.statSync(inputFolder);

const outputFile = (file: string) => {
    return path.resolve(outputFolder, path.relative(inputFolder, file)); 
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
}

const mode = argv.params.mini;

const mkIfNotFolder = (folder: string) => {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }
};

const logFile = (file: string) => {
    const now = new Date();
    console.log('[' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + ']', path.relative(outputFolder, file), 'Finished');
}

/**
 * 处理html
 * @param src 
 */
export const compileHtmlFile = (src: string) => {
    const ext = path.extname(src);
    let dist = outputFile(src);
    const distFolder = path.dirname(dist);
    let content = '';
    if (ext === '.ts') {
        content = Compiler.ts(fs.readFileSync(src).toString(), src);
        dist = dist.replace(ext, '.js');
    } else if (ext === '.scss') {
        content = Compiler.sass(fs.readFileSync(src).toString(), src, 'scss');
        dist = dist.replace(ext, '.css');
    } else if (ext === '.sass') {
        content = Compiler.sass(fs.readFileSync(src).toString(), src, 'scss');
        dist = dist.replace(ext, '.css');
    } else if (ext === '.html') {
        content = renderFile(src);
    } else {
        mkIfNotFolder(distFolder);
        fs.copyFileSync(src, dist);
        return;
    }
    if (content.length < 1) {
        return;
    }
    mkIfNotFolder(distFolder);
    fs.writeFileSync(dist, content);
    logFile(dist);
};
/**
 * 处理小程序
 * @param src 
 */
export const compileMiniFile = (src: string) => {
    const ext = path.extname(src);
    let dist = outputFile(src);
    const distFolder = path.dirname(dist);
    let content = '';
    if (ext === '.ts') {
        content = Compiler.ts(fs.readFileSync(src).toString(), src);
        dist = dist.replace(ext, '.js');
    } else if (ext === '.scss') {
        content = Compiler.sass(preImport(fs.readFileSync(src).toString()), src, 'scss');
        content = endImport(content);
        content = replaceTTF(content, path.dirname(src));
        dist = dist.replace(ext, '.wxss');
    } else if (ext === '.sass') {
        content = Compiler.sass(preImport(fs.readFileSync(src).toString()), src, 'sass');
        content = endImport(content);
        content = replaceTTF(content, path.dirname(src));
        dist = dist.replace(ext, '.wxss');
    } else if (ext === '.html' || ext === '.vue') {
        let data = {};
        let jsonPath = src.replace(ext, '.json');
        if (fs.existsSync(jsonPath)) {
            const json = fs.readFileSync(jsonPath).toString();
            data = json.trim().length > 0 ? JSON.parse(json) : {};
        }
        const res: any = splitFile(fs.readFileSync(src).toString(), ext.substr(1).toLowerCase(), data);
        mkIfNotFolder(distFolder);
        for (const key in res) {
            if (res.hasOwnProperty(key)) {
                const item = res[key];
                if (item.type === 'json') {
                    fs.writeFileSync(dist.replace(ext, '.json'), item.content);
                    continue;
                }
                if (item.type === 'wxml') {
                    fs.writeFileSync(dist.replace(ext, '.wxml'), item.content);
                    continue;
                }
                if (item.type === 'css') {
                    fs.writeFileSync(dist.replace(ext, '.wxss'), item.content);
                    continue;
                }
                if (item.type === 'js') {
                    fs.writeFileSync(dist.replace(ext, '.js'), item.content);
                    continue;
                }
                if (item.type === 'ts') {
                    fs.writeFileSync(dist.replace(ext, '.js'), Compiler.ts(item.content, src));
                    continue;
                }
                if (item.type === 'scss') {
                    content = Compiler.sass(preImport(item.content), src, 'scss');
                    content = endImport(content);
                    content = replaceTTF(content, path.dirname(src));
                    fs.writeFileSync(dist.replace(ext, '.js'), content);
                    continue;
                }
                if (item.type === 'sass') {
                    content = Compiler.sass(preImport(item.content), src, 'sass');
                    content = endImport(content);
                    content = replaceTTF(content, path.dirname(src));
                    fs.writeFileSync(dist.replace(ext, '.js'), content);
                    continue;
                }
            }
        }

        return;
    } else if (['.ttf', '.json'].indexOf(ext) >= 0) {
        return;
    } else {
        if (ext === '.css') {
            dist = dist.replace(ext, '.wxss');
        }
        mkIfNotFolder(distFolder);
        fs.copyFileSync(src, dist);
        return;
    }
    if (content.length < 1) {
        return;
    }
    mkIfNotFolder(distFolder);
    fs.writeFileSync(dist, content);
    logFile(dist);
};

const compilerFile = mode ? compileMiniFile : compileHtmlFile;

if (inputState.isFile()) {
    compilerFile(inputFolder);
} else {
    eachFile(inputFolder, compilerFile);
}

if (argv.params.watch) {
    chokidar.watch(inputFolder).on("unlink", file => {
        fs.unlinkSync(outputFile(file));
    }).on('add', compilerFile).on('change', compilerFile);
}