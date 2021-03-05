// import { readFileSync, writeFileSync } from 'fs';
//import { dealTemplateFile } from './gulp-tempate';
// import { htmlToJson } from './parser/html';

// import { splitFile } from "./parser/vue";

// let srcPath = '';

// const input = readFileSync(srcPath);
// const content = input.toString();

// const res = dealTemplateFile(input, srcPath, '.vue', 'tpl');

// const res = JSON.stringify(htmlToJson(content));

// writeFileSync(__dirname + '/index.json', res);

// export type Constructor = {
//     new (...args: any[]): any
// }

// export function Prop() {
//     return (target: Vue, key: string) => {
//       console.log(target, key);
//     }
// }

// export function PropA(): ClassDecorator {
//     return (target: any) => {
//       console.log(target);
//     }
// }

// @PropA()
// class Vue {
//     @Prop() public aa!: boolean;
// }

// new Vue();

// const res = splitFile(`<template>
//     <div @click="tap(1)"></div>
//     <div @click="tap(1, 2)"></div>
//     <input v-model="value" bindinput="onValue(index)"/>
//     <input v-model="val"/>
// </template>
// <script>
// export class Detail extends WxPage<IPageData> {

// }
// </script>`);

// console.log(res);
