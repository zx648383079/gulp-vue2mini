import * as util from "./util";
import { TOKEN_KEY } from "./types";
import { IMyApp } from "../app.vue";

const app = getApp<IMyApp>();

interface IRequest {
    url: string;
    params?: any;  // 拼接到url上
    data?: any;    // post 数据
    headers?: any;
    mask?: boolean;
    loading?: boolean;
}

export function request<T>(method: 'OPTIONS'| 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'TRACE' | 'CONNECT', requestHandler: IRequest) {
    let { url, params, data, headers, mask, loading } = requestHandler;
    if (loading === undefined || loading) {
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
        wx.request({
            url: util.uriEncode(util.apiEndpoint + url, params),
            data: data,
            method: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].indexOf(method) > -1 ? method : 'GET',
            header: Object.assign({
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }, headers),
            success: function (res) {
                const { data, statusCode } = res;
                if (statusCode === 200) {
                    resolve(data as any);
                    return;
                }
                wx.showToast({
                    title: (data as any).message,
                    icon: 'none',
                    duration: 2000
                });
                if (statusCode === 401) {
                    app && app.setToken();
                    wx.navigateTo({
                        url: '/pages/member/login'
                    });
                }
                // 处理数据
                reject(res)
            },
            fail: function () {
                reject('Network request failed')
            },
            complete: function () {
                wx.hideLoading && wx.hideLoading()
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
export function fetch<T>(url: string, params = {}, loading?: boolean): Promise<T> {
    return request<T>('GET', {
        url,
        params,
        loading,
    });
}

/**
 * 封装post请求
 * @param url
 * @param data
 * @param loading 是否显示加载中
 * @returns {Promise}
 */
export function post<T>(url: string, data = {}, loading?: boolean): Promise<T> {
    return request<T>('POST', {
        url,
        data,
        loading,
    });
}
/**
 * 删除请求
 * @param url 
 * @param loading 是否显示加载中
 */
export function deleteRequest<T>(url: string, loading?: boolean): Promise<T> {
    return request<T>('DELETE', {
        url,
        loading,
    });
}

/**
 * 封装put请求
 * @param url
 * @param data
 * @param loading 是否显示加载中
 * @returns {Promise}
 */
export function put<T>(url: string, data = {}, loading?: boolean) {
    return request<T>('PUT', {
        url,
        data,
        loading,
    });
}

/**
 * 上传文件
 * @param file 要上传文件资源的路径 (本地路径)
 * @param requestHandler 
 * @param name 上传文件的对应的 key
 */
export function uploadFile<T>(file: string, requestHandler: IRequest, name: string = 'file'): Promise<T> {
    let { url, params, data, headers, mask, loading } = requestHandler;
    if (loading === undefined || loading) {
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
            success: function (res) {
                const { data, statusCode } = res;
                if (statusCode === 200) {
                    resolve(data as any);
                    return;
                }
                wx.showToast({
                    title: (data as any).message,
                    icon: 'none',
                    duration: 2000
                });
                if (statusCode === 401) {
                    app && app.setToken();
                    wx.navigateTo({
                        url: '/pages/member/login'
                    });
                }
                // 处理数据
                reject(res)
            },
            fail: function () {
                reject('Network request failed')
            },
            complete: function () {
                wx.hideLoading && wx.hideLoading()
            }
        })
    });
}