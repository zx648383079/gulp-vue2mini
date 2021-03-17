# gulp-vue2mini
简单的将vue 转化为小程序代码

## 使用示例请查看【[此处](https://github.com/zx648383079/gulp-vue2mini/tree/example)】

## 使用方法

安装

```bash
npm i gulp-vue2mini --save-dev
```

暂不支持 `gulp watch`

### gulpfile.js 使用

```js
var template = require('gulp-vue2mini');

gulp.src('src/**/*.ts')
        .pipe(template('ts'))   // 去除引入的 微信声明文件


gulp.src('src/**/*.{scss,sass}')
        .pipe(template('presass'))
        .pipe(sass())
        .pipe(template('endsass'))   // 解决兼容小程序的 @import 样式
    

gulp.src('src/**/*.{vue,html}')
        .pipe(template('js'))     // 提取 js 部分

gulp.src('src/**/*.{vue,html}')
        .pipe(template('ts'))      // 提取 ts 部分，进行转化

gulp.src('src/**/*.{vue,html}')
        .pipe(template('css'))    // 提取css 部分

gulp.src('src/**/*.{vue,html}')
        .pipe(template('scss'))
        .pipe(template('presass'))
        .pipe(sass())
        .pipe(template('endsass'))   // 提取 sass 部分


gulp.src('src/**/*.{vue,html}')
        .pipe(template('json'))   // 提取并转化 json 部分

gulp.src('src/**/*.{vue,html}')
        .pipe(template('tpl'))   // 提取 html 代码并转化成 wxml 代码

```
新增 对 vue 编译，但必须保证源目录为 `src` 目标目录为 `dist`

# **推荐** 用下面的方法

```js
await gulp.src('src/test.vue')
    .pipe(template('js'))
    .pipe(gulp.dest('dist/'))
    .pipe(template('css'))
    .pipe(gulp.dest('dist/'))
    .pipe(template('json'))
    .pipe(gulp.dest('dist/'))
    .pipe(template('tpl'))
    .pipe(gulp.dest('dist/'))
    .pipe(template('ts'))
    .pipe(tsProject())
    .pipe(gulp.dest('dist/'))
```


### 自带命令

必须全局安装

```
npm i gulp-vue2mini -g

vue2mini
```

    --watch   监听脚本变动
    --mini    编译小程序
    --theme   编译模板
    --css     转css为scss
    --help    帮助
    --input   源码文件或文件夹，默认为`src`文件夹
    --output  编译后保存的文件夹，默认为`dist`
    --min     压缩ts和sass 生成的文件代码，仅对模板有效

[转化核心](src/parser)

支持 ts sass

支持拆解html js ts sass css 写在一个文件上的情况

sass 支持ttf文件自动转化为 base64

sass 引用模式自动处理

自动转化html 为 wxml, 自动转化 v-if v-for v-else v-show

支持json自动生成，支持 属性合并

#### 注意：span 标签下不能包含其他标签，否则会自动转换为view

## 更新

### 新增模板html生成（与其他功能不共用）

生效条件 以 `@` 开头，前面可以有空格，功能占整行， `@` 后面的内容以空格隔开，空格之后为评论内容，不做生成

    @@             为注释，放在首行为声明此文件不生成html页面
    @...           加载其他引用此文件的文件内容
    @layout/main   加载其他文件，拓展名可以省略
    @item@5        加载其他文件重复5次
    @~  @@         随机取一段，以 @@ 分割，必须包含 @@ 才能生效

加载的样式及样式文件自动合并到 `head` 末尾

加载的脚本及脚本文件自动合并到 `body` 末尾

支持 `ts` `sass` 自动编译

```
vue2mini --watch

```

### 标签属性转化列表


属性名 | 目标属性
---------|----------
 `v-if` | `wx:if="{{  }}"`
 `v-elseif` | `wx:elif="{{  }}"`
 `v-else` | `wx:else`
 `v-bind:src` | `src`
 `href` | `url`
 `@click` | `bindtap`
 `@click.stop` | `catchtap`
 `v-on:click` | `bindtap`
 `(click)` | `bindtap`
 `@touchstart` | `bindtouchstart`
 `@touchmove` | `bindtouchmove`
 `@touchend` | `bindtouchend`
 `:key` | 
 `v-show` | `hidden="{{! }}"`
 `v-for` | `wx:for="{{  }}" wx:for-index=" " wx:for-item=""`
 `v-model` | `value="{{  }}" bind:input=" Changed"`
 第一个字符为`@`且值不为空 | `bind:`
 第一个字符为`:` | `={{ }}`
 其他包含`@` |

支持 对 `picker` `switch` `slider` 执行 `v-model` 值绑定

支持 `:class` 数组形式及 `{active: true}` 形式自动会合并 `class` 

支持 `@click` 直接赋值及直接传参数  `@click="i = 1"` 或 `@click="tap(i, a)"`，直接传参数，最后增加一个为 事件原本的值

定义`WxPage` `WxCommpent` `WxApp` 三个类，增强 `setData` 的智能提示，

`export` 是为了避免提示未使用，编译时会自动去除

增加自动添加 `Page(new Index())` `Commpent(new Index())` `App(new Index())` 到末尾

增加json配置生成
```ts

@WxJson({
    usingComponents: {
        MenuLargeItem: "/components/MenuLargeItem/index",
        MenuItem: "/components/MenuItem/index"
    },
    navigationBarTitleText: "个人中心",
    navigationBarBackgroundColor: "#05a6b1",
    navigationBarTextStyle: "white"
})

```

自动合并页面相关的json文件

支持自动合并 `methods` `lifetimes` `pageLifetimes`， 如果已有 属性会自动合并

    methods  @WxMethod
    lifetimes @WxLifeTime
    pageLifetimes @WxPageLifeTime

自定义部件自动合并方法到`methods`属性中

```ts
methods = {
    aa() {

    }
}

@WxMethod()
tapChange(mode: number) {
}

```

最终生成

```ts
methods = {
    tapChange(mode: number) {
    },
    aa() {
        
    }
}
```

## 标准模板

index.vue

```html
<template>
    <div>
        
    </div>
</template>
<script lang="ts">
import {
    IMyApp
} from '../../app';

const app = getApp<IMyApp>();

interface IPageData {
    items: number[],
}

export class Index extends WxPage<IPageData> {
    public data: IPageData = {
        items: []
    };

    onLoad() {
        this.setData({
            items: []
        });
    }
}
</script>
<style lang="scss" scoped>

</style>
```

### 最终会处理为3个文件

index.wxml

```html

<view></view>

```

index.wxss

```css

```

index.js
```js
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var app = getApp();
var Index = (function () {
    function Index() {
        this.data = {
            items: [],
        };
    }
    Index.prototype.onLoad = function () {
        this.setData({
            items: []
        });
    };
    return Index;
}());
Page(new Index());
```

## 注意

新增了一些指定的声明请[参考](https://github.com/zx648383079/gulp-vue2mini/tree/example/typings/wx/lib.vue.d.ts)

如果 ts 报错太多而中断，可以考虑屏蔽

```js
var plumber = require('gulp-plumber');

.pipe(plumber({
    errorHandler() {
        this.emit('end');
    }
}))
```

