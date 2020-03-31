# gulp-vue2mini
简单的将vue 转化为小程序代码

## 使用示例请查看【[此处](https://github.com/zx648383079/gulp-vue2mini/tree/example)】

## 使用方法

安装

```bash
npm i gulp-vue2mini --save-dev
```

暂不支持 `gulp watch`

gulpfile.js 使用

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
        .pipe(template('sass'))
        .pipe(template('presass'))
        .pipe(sass())
        .pipe(template('endsass'))   // 提取 sass 部分


gulp.src('src/**/*.{vue,html}')
        .pipe(template('json'))   // 提取并转化 json 部分

gulp.src('src/**/*.{vue,html}')
        .pipe(template('tpl'))   // 提取 html 代码并转化成 wxml 代码

```


[转化核心](src/parser)

支持 ts sass

支持拆解html js ts sass css 写在一个文件上的情况

sass 支持ttf文件自动转化为 base64

sass 引用模式自动处理

自动转化html 为 wxml, 自动转化 v-if v-for v-else v-show

支持json自动生成，支持 属性合并

#### 注意：span 标签下不能包含其他标签，否则会自动转换为view

## 更新

### 标签属性转化列表


属性名 | 目标属性
---------|----------
 `v-if` | `wx:if="{{  }}"`
 `v-elseif` | `wx:elif="{{  }}"`
 `v-else` | `wx:else`
 `v-bind:src` | `src`
 `href` | `url`
 `@click` | `bindtap`
 `v-on:click` | `bindtap`
 `(click)` | `bindtap`
 `@touchstart` | `bindtouchstart`
 `@touchmove` | `bindtouchmove`
 `@touchend` | `bindtouchend`
 `:key` | 
 `v-show` | `hidden="{{! }}"`
 `v-for` | `wx:for="{{  }}" wx:for-index=" " wx:for-item=""`
 `v-model` | `value="{{  }}" bind:input=" Changed"`
 第一个支付为`@`且值不为空 | `bind:`
 第一个支付为`:` | `={{ }}`
 其他包含`@` |

支持 对 `picker` `switch` `slider` 执行 `v-model` 值绑定

支持 `:class` 数组形式及 `{active: true}` 形式自动会合并 `class` 

支持 `@click` 直接赋值及直接传参数  `@click="i = 1"`  `@click="tap(i, a)"`

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
