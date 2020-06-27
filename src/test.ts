// import { readFileSync, writeFileSync, statSync } from 'fs';
// //import { dealTemplateFile } from './gulp-tempate';
// import { htmlToJson } from './parser/html';

// let srcPath = __dirname + '/index.vue';

// const input = readFileSync(srcPath);

// // const res = dealTemplateFile(input, srcPath, '.vue', 'tpl');

// const res = JSON.stringify(htmlToJson(input.toString()))

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
