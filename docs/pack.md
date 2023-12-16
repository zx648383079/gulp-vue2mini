# 执行打包命令

安装

```bash
npm i gulp-vue2mini --save-dev
```

## 第一步，在工作目录根文件夹添加文件

packfile.js

```js
var loader = require('gulp-vue2mini').PackLoader;

loader.task('default', async () => {
    await loader.input('src/**/*.ts')
    .ts()
    .output('dist/**/');
    await loader.input('src/**/*.scss')
    .sass({

    })
    .output('dist/**/');
});
```

## 第二步，执行命令

```
vue2mini --custom=default --min
vue2mini --custom --min
```

## 输入规则

请参考 【[glob](https://github.com/isaacs/node-glob)】

## 输出规则

    * 输入的路径从后数的单个文件夹位
    ** 匹配多个文件夹位，补齐跟输入路径深度一样 
    / 以/结尾会自动加文件名，表示生成多个文件，否则合并成一个文件


```ts
console.log(renderOutputRule('src/aa.js', 'disk/')); // disk/aa.js
console.log(renderOutputRule('src/b/aa.js', 'disk/*/')); // disk/b/aa.js
console.log(renderOutputRule('src/ccc/vv/vv/aa.js', 'disk/**/')); // disk/ccc/vv/vv/aa.js
console.log(renderOutputRule('src/cc/gg/aa.js', 'disk/*/')); // disk/gg/aa.js
console.log(renderOutputRule('src/b/c/f/g/aa.js', 'disk/*/**/*/')); // disk/b/c/f/g/aa.js
```