const IS_DEV = !1;

const BASIC_HOST = IS_DEV ? 'http://<测试网址>' : 'https://<正式网址>';

export const apiEndpoint = BASIC_HOST + '/open/';
export const assetUri = BASIC_HOST;
export const appId = '<App ID>';
export const secret = '<App Secret>';