import * as util from "./util";
import { TOKEN_KEY, LOGIN_PATH } from "./types";
import { IMyApp } from "../app.vue";

const app = getApp<IMyApp>();

interface IRequestOption {
    headers?: any;
    mask?: boolean;
    loading?: boolean;
    guest?: boolean; // token失效不自动跳转
}

interface IRequest extends IRequestOption {
    url: string;
    params?: any;  // 拼接到url上
    data?: any;    // post 数据
}

export function request<T>(method: 'OPTIONS'| 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'TRACE' | 'CONNECT', requestHandler: IRequest, option?: IRequestOption) {
    if (option) {
        requestHandler = Object.assign(requestHandler, option);
    }
    let { url, params, data, headers, mask, loading, guest } = requestHandler;
    loading = loading === undefined || loading;
    if (loading) {
      wx.showLoading && wx.showLoading({title: 'Loading...', mask: mask ? mask : false})
    }
    const configs = util.getAppParams();
    if (!params) {
        params = {};
    }
    if (!headers) {
        headers = {};
    }
    // 放入 api 验证权限 
    params.appid = configs.appid;
    params.timestamp = configs.timestamp;
    params.sign = configs.sign;
    const token = wx.getStorageSync(TOKEN_KEY)
    if (token) {
        // 插入登录令牌
        headers.Authorization = 'Bearer ' + token;
    }
    return new Promise<T>((resolve, reject) => {
        wx.request({
            url: util.uriEncode(util.apiEndpoint + url, params),
            data: data,
            method: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].indexOf(method) > -1 ? method : 'GET',
            header: Object.assign({
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }, headers),
            success(res) {
                const { data, statusCode } = res;
                if (statusCode === 200) {
                    resolve(data as any);
                    return;
                }
                if (statusCode !== 401 || !guest) {
                    if (loading) {
                        // 必须先关闭loading
                        loading = false;
                        wx.hideLoading();
                    }
                    wx.showToast({
                        title: (data as any).message,
                        icon: 'none',
                        duration: 2000
                    });
                }
                if (statusCode === 401) {
                    // 登录令牌失效注销
                    app && app.setToken();
                    if (!guest) {
                        wx.navigateTo({
                            url: LOGIN_PATH
                        });
                    }
                }
                // 处理数据
                reject(res)
            },
            fail() {
                reject('Network request failed')
            },
            complete() {
                if (loading && wx.hideLoading) {
                    wx.hideLoading();
                }
            }
        })
    });
}


/**
 * 封装get方法
 * @param url
 * @param data
 * @param loading 是否显示加载中
 * @returns {Promise}
 */
export function fetch<T>(url: string, params = {}, option?: IRequestOption): Promise<T> {
    return request<T>('GET', {
        url,
        params,
    }, option);
}

/**
 * 封装post请求
 * @param url
 * @param data
 * @param loading 是否显示加载中
 * @returns {Promise}
 */
export function post<T>(url: string, data = {}, option?: IRequestOption): Promise<T> {
    return request<T>('POST', {
        url,
        data,
    }, option);
}
/**
 * 删除请求
 * @param url 
 * @param loading 是否显示加载中
 */
export function deleteRequest<T>(url: string, params = {}, option?: IRequestOption): Promise<T> {
    return request<T>('DELETE', {
        url,
        params,
    }, option);
}

/**
 * 封装put请求
 * @param url
 * @param data
 * @param loading 是否显示加载中
 * @returns {Promise}
 */
export function put<T>(url: string, data = {}, option?: IRequestOption) {
    return request<T>('PUT', {
        url,
        data,
    }, option);
}

/**
 * 上传文件
 * @param file 要上传文件资源的路径 (本地路径)
 * @param requestHandler 
 * @param name 上传文件的对应的 key
 */
export function uploadFile<T>(file: string, requestHandler: IRequest, name: string = 'file'): Promise<T> {
    let { url, params, data, headers, mask, loading, guest } = requestHandler;
    loading = loading === undefined || loading;
    if (loading) {
      wx.showLoading && wx.showLoading({title: 'Loading...', mask: mask ? mask : false})
    }
    const configs = util.getAppParams();
    if (!params) {
        params = {};
    }
    if (!headers) {
        headers = {};
    }
    params.appid = configs.appid;
    params.timestamp = configs.timestamp;
    params.sign = configs.sign;
    const token = wx.getStorageSync(TOKEN_KEY)
    if (token) {
        headers.Authorization = 'Bearer ' + token;
    }
    return new Promise<T>((resolve, reject) => {
        wx.uploadFile({
            url: util.uriEncode(util.apiEndpoint + url, params),
            formData: data,
            filePath: file,
            name,
            header: Object.assign({
                'Accept': 'application/json',
            }, headers),
            success(res) {
                let { data, statusCode } = res;
                data = typeof data === 'string' ? JSON.parse(data) : data;
                if (statusCode === 200) {
                    resolve(data as any);
                    return;
                }
                if (statusCode !== 401 || !guest) {
                    if (loading) {
                        // 必须先关闭loading
                        loading = false;
                        wx.hideLoading();
                    }
                    wx.showToast({
                        title: (data as any).message,
                        icon: 'none',
                        duration: 2000
                    });
                }
                if (statusCode === 401) {
                    app && app.setToken();
                    if (!guest) {
                        wx.navigateTo({
                            url: LOGIN_PATH
                        });
                    }
                }
                // 处理数据
                reject(res)
            },
            fail() {
                reject('Network request failed')
            },
            complete() {
                if (loading && wx.hideLoading) {
                    wx.hideLoading();
                }
            }
        })
    });
}


export function downloadFile(requestHandler: IRequest): Promise<WechatMiniprogram.DownloadFileSuccessCallbackResult> {
    let { url, params, headers, mask, loading } = requestHandler;
    loading = loading === undefined || loading;
    if (loading) {
      wx.showLoading && wx.showLoading({title: 'Loading...', mask: mask ? mask : false})
    }
    const configs = util.getAppParams();
    if (!params) {
        params = {};
    }
    if (!headers) {
        headers = {};
    }
    params.appid = configs.appid;
    params.timestamp = configs.timestamp;
    params.sign = configs.sign;
    const token = wx.getStorageSync(TOKEN_KEY)
    if (token) {
        headers.Authorization = 'Bearer ' + token;
    }
    return new Promise<WechatMiniprogram.DownloadFileSuccessCallbackResult>((resolve, reject) => {
        wx.downloadFile({
            url: util.uriEncode(util.apiEndpoint + url, params),
            header: headers,
            success(res) {
                resolve(res);
            },
            fail() {
                reject('Network request failed')
            },
            complete() {
                if (loading && wx.hideLoading) {
                    wx.hideLoading();
                }
            }
        })
    });
}