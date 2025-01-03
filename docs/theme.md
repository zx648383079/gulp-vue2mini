### 模板html生成（与其他功能不共用）

生效条件 以 `@` 开头，前面可以有空格，功能占整行， `@` 后面的内容以空格隔开，空格之后为评论内容，不做生成

    @@             为注释，放在首行为声明此文件不生成html页面
    @...           加载其他引用此文件的文件内容
    @layout/main   加载其他文件，拓展名可以省略
    @item@5        加载其他文件重复5次
    @~  @@         随机取一段，以 @@ 分割，必须包含 @@ 才能生效
    @title=标题    设置值，以 @ 开头，以 = 分割，不能有空格
    @=title        输出值，以 @= 开头

加载的样式及样式文件自动合并到 `head` 末尾

加载的脚本及脚本文件自动合并到 `body` 末尾

支持 `ts` `sass` 自动编译

```
vue2mini --theme --watch

```

## 新增多主题支持

```css
@theme [主题名] {
    
}
```
默认主题为 `default`

深色主题为 `dark`

此代码必须写在  `style` 标签中，或 `css/scss` 样式中

使用方式 `@定义名` 使用，也可以直接使用 `@主题名.定义名` 使用

### 支持webpack

```ts
import {ThemePlugin} from 'gulp-vue2mini';

new ThemePlugin({
    default: {
        color: '#fff'
    },
    dark: {
        color: '#333'
    }
})
```

允许在单个文件中增加主题设置，仅对当前文件生效，不影响其他文件，全局设置请使用插件配置

### ~~示例~~ (不推荐使用，请考虑使用 css 的 var 搭配 sass 的模块功能实现多主题)

```css
@theme default {
    body: white;
    bodyText: #000;
}

@theme dark {
    body: #000;
    bodyText: white;
}

body {
    background-color: @body;
    color: @bodyText;
}
ul {
    color: @bodyText;
}
```

最终生成样式为

 ## 【新】 默认格式

```css

:root {
    --zre-body: white;
    --zre-body-text: #000;
}

.theme-dark {
    --zre-body: #000;
    --zre-body-text: white;
}

body {
    background-color: var(--zre-body);
    color: var(--zre-body-text);
}
ul {
    color: var(--zre-body-text);
}


```

可选格式 `--prefix`

```css
body {
    background-color: white;
    color: #000;
}
ul {
    color: #000;
}

body.theme-dark {
    background-color: #000;
    color: white;
}
.theme-dark ul {
    color: white;
}
```
具体主题切换请使用js 操作

