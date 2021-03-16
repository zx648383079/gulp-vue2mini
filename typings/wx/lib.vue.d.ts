/// <reference path="./index.d.ts" />

declare interface IPage<T = any> {
    /** 页面的初始数据
     * 
     * `data` 是页面第一次渲染使用的**初始数据**。
     * 
     * 页面加载时，`data` 将会以`JSON`字符串的形式由逻辑层传至渲染层，因此`data`中的数据必须是可以转成`JSON`的类型：字符串，数字，布尔值，对象，数组。
     * 
     * 渲染层可以通过 `WXML` 对数据进行绑定。
    */
   data?: T

   /** `setData` 函数用于将数据从逻辑层发送到视图层（异步），同时改变对应的 `this.data` 的值（同步）。
    *
    * **注意：**
    *
    * 1. **直接修改 this.data 而不调用 this.setData 是无法改变页面的状态的，还会造成数据不一致**。
    * 1. 仅支持设置可 JSON 化的数据。
    * 1. 单次设置的数据不能超过1024kB，请尽量避免一次设置过多的数据。
    * 1. 请不要把 data 中任何一项的 value 设为 `undefined` ，否则这一项将不被设置并可能遗留一些潜在问题。
    */

   setData?<K extends keyof T>(
     /** 这次要改变的数据
      *
      * 以 `key: value` 的形式表示，将 `this.data` 中的 `key` 对应的值改变成 `value`。
      *
      * 其中 `key` 可以以数据路径的形式给出，支持改变数组中的某一项或对象的某个属性，如 `array[2].message`，`a.b.c.d`，并且不需要在 this.data 中预先定义。
      */
     data: T | Pick<T, K> | any,
     /** setData引起的界面更新渲染完毕后的回调函数，最低基础库： `1.5.0` */
     callback?: () => void
   ): void

   /** 到当前页面的路径，类型为`String`。最低基础库： `1.2.0` */
   route?: string
    /** 生命周期回调—监听页面加载
     *
     * 页面加载时触发。一个页面只会调用一次，可以在 onLoad 的参数中获取打开当前页面路径中的参数。
     */
    onLoad?(
        /** 打开当前页面路径中的参数 */
        query?: { [queryKey: string]: string }
      ): void
      /** 生命周期回调—监听页面显示
       *
       * 页面显示/切入前台时触发。
       */
      onShow?(): void
      /** 生命周期回调—监听页面初次渲染完成
       * 
       * 页面初次渲染完成时触发。一个页面只会调用一次，代表页面已经准备妥当，可以和视图层进行交互。
       * 
     
       * 注意：对界面内容进行设置的 API 如`wx.setNavigationBarTitle`，请在`onReady`之后进行。
      */
      onReady?(): void
      /** 生命周期回调—监听页面隐藏
       *
       * 页面隐藏/切入后台时触发。 如 `navigateTo` 或底部 `tab` 切换到其他页面，小程序切入后台等。
       */
      onHide?(): void
      /** 生命周期回调—监听页面卸载
       *
       * 页面卸载时触发。如`redirectTo`或`navigateBack`到其他页面时。
       */
      onUnload?(): void
      /** 监听用户下拉动作
       *
       * 监听用户下拉刷新事件。
       * - 需要在`app.json`的`window`选项中或页面配置中开启`enablePullDownRefresh`。
       * - 可以通过`wx.startPullDownRefresh`触发下拉刷新，调用后触发下拉刷新动画，效果与用户手动下拉刷新一致。
       * - 当处理完数据刷新后，`wx.stopPullDownRefresh`可以停止当前页面的下拉刷新。
       */
      onPullDownRefresh?(): void
      /** 页面上拉触底事件的处理函数
       *
       * 监听用户上拉触底事件。
       * - 可以在`app.json`的`window`选项中或页面配置中设置触发距离`onReachBottomDistance`。
       * - 在触发距离内滑动期间，本事件只会被触发一次。
       */
      onReachBottom?(): void
      /** 用户点击右上角转发
       *
       * 监听用户点击页面内转发按钮（`<button>` 组件 `open-type="share"`）或右上角菜单“转发”按钮的行为，并自定义转发内容。
       *
       * **注意：只有定义了此事件处理函数，右上角菜单才会显示“转发”按钮**
       *
       * 此事件需要 return 一个 Object，用于自定义转发内容
       */
      onShareAppMessage?(
        /** 分享发起来源参数 */
        options?: WechatMiniprogram.Page.IShareAppMessageOption
      ): WechatMiniprogram.Page.ICustomShareContent
      /** 页面滚动触发事件的处理函数
       *
       * 监听用户滑动页面事件。
       */
      onPageScroll?(
        /** 页面滚动参数 */
        options?: WechatMiniprogram.Page.IPageScrollOption
      ): void
  
      /** 当前是 tab 页时，点击 tab 时触发，最低基础库： `1.9.0` */
      onTabItemTap?(
        /** tab 点击参数 */
        options?: WechatMiniprogram.Page.ITabItemTapOption
      ): void
}


interface IComponentProperty {
    type?: Object | String | Number,
    value?: any,
    observer?: (newVal: any, oldVal: any, changedPath: string) => void
}

interface IComponentLefeTime {
    attached?: Function,
    moved?: Function,
    detached?: Function
}

interface IComponentPageLefeTime {
    show?: Function,
    hide?: Function,
    resize?: Function
}

interface IComponentRelation {
    type?: string,
    linked?: (target: any) => void,
    linkChanged?: (target: any) => void,
    unlinked?: (target: any) => void,
}

interface IBehaviorLefeTime {
    created?: Function,
}

declare interface IBehavior {
    behaviors?: IBehavior[],
    lifetimes?: IBehaviorLefeTime,
    definitionFilter?(defFields: any, definitionFilterArr: any): void,
}

declare const Behavior: (options: IBehavior) => IBehavior;

declare interface IMethod {
  [key: string]: (this: IPage<any>, e:any) => void
}

export declare function WxMethod(): MethodDecorator;

export declare function WxLifeTime(): MethodDecorator;
export declare function WxPageLifeTime(): MethodDecorator;

interface IPageJson {
  [key: string]: any;
  /**
   * 使用的自定义部件
   */
  usingComponents?: {[tag: string]: string},
  /**
   * 导航栏标题内容
   */
  navigationBarTitleText?: string,
  /**
   * 导航栏背景
   */
  navigationBarBackgroundColor?: string,
  /**
   * 导航栏字体颜色
   */
  navigationBarTextStyle?: 'black' | 'white',
  /**
   * 导航栏样式
   */
  navigationStyle?: 'default' | 'custom',
  /**
   * 是否是自定义部件
   */
  component?: boolean,
  /**
   * 窗口的背景色
   */
  backgroundColor?: string,
  /**
   * 下拉 loading 的样式，仅支持 dark / light
   */
  backgroundTextStyle?: 'dark' | 'light',
  /**
   * 顶部窗口的背景色，仅 iOS 支持
   */
  backgroundColorTop?: string,
  /**
   * 底部窗口的背景色，仅 iOS 支持
   */
  backgroundColorBottom?: string,
  /**
   * 是否开启当前页面下拉刷新。
   */
  enablePullDownRefresh?: boolean,
  /**
   * 页面上拉触底事件触发时距页面底部距离，单位为px。
   */
  onReachBottomDistance?: number,
  /**
   * 屏幕旋转设置
   */
  pageOrientation?: 'auto' | 'portrait' | 'landscape',
  /**
   * 设置为 true 则页面整体不能上下滚动。 只在页面配置中有效，无法在 app.json 中设置
   */
  disableScroll?: boolean,
  /**
   * 禁止页面右滑手势返回
   */
  disableSwipeBack?: boolean,
}

export declare function WxJson(options: IPageJson): ClassDecorator;

declare interface IComponent<T = any> extends IPage<T> {
    /**
     * 组件的对外属性，是属性名到属性设置的映射表
     */
    properties?: {[key: string]: IComponentProperty|Object | String | Number},
    /**
     * 组件生命周期声明对象
     */
    lifetimes?: IComponentLefeTime,
    /**
     * 组件生命周期函数，在组件实例进入页面节点树时执行
     */
    attached?: Function,
    ready?: Function,
    options?: any,
    /**
     * 组件接受的外部样式类
     */
    externalClasses?: string|string[],
    /**
     * 组件所在页面的生命周期声明对象，支持页面的 show 、 hide 等生命周期
     */
    pageLifetimes?: IComponentPageLefeTime,
    /**
     * 定义段过滤器
     */
    definitionFilter?: Function,
    /**
     * 组件生命周期声明对象
     */
    methods?: IMethod,
    /**
     * 类似于mixins和traits的组件间代码复用机制
     */
    behaviors?: IBehavior[],
    /**
     * 组件数据字段监听器
     */
    observers?: {[key: string]: (args: any)=>void},
    /**
     * 组件间关系定义
     */
    relations?: {[key: string]: IComponentRelation},

    triggerEvent?(name: string, detail: any, options: any): void,
    createSelectorQuery?(): any,
    selectComponent?(selector: string): any,
    selectAllComponents?(selector: string): any,
    getRelationNodes?(relationKey: string): any,
    groupSetData?(callback: Function): any,
    getTabBar?(): any,
}

declare const Component: (options: IComponent<any>) => void;

declare class WxPage<T = any> implements IPage<T> {

  public data: T;
  public route: string;

  onLoad?(
    /** 打开当前页面路径中的参数 */
    query?: { [queryKey: string]: string }
  ): void
  /** 生命周期回调—监听页面显示
   *
   * 页面显示/切入前台时触发。
   */
  onShow?(): void
  /** 生命周期回调—监听页面初次渲染完成
   * 
   * 页面初次渲染完成时触发。一个页面只会调用一次，代表页面已经准备妥当，可以和视图层进行交互。
   * 
 
   * 注意：对界面内容进行设置的 API 如`wx.setNavigationBarTitle`，请在`onReady`之后进行。
  */
  onReady?(): void
  /** 生命周期回调—监听页面隐藏
   *
   * 页面隐藏/切入后台时触发。 如 `navigateTo` 或底部 `tab` 切换到其他页面，小程序切入后台等。
   */
  onHide?(): void
  /** 生命周期回调—监听页面卸载
   *
   * 页面卸载时触发。如`redirectTo`或`navigateBack`到其他页面时。
   */
  onUnload?(): void
  /** 监听用户下拉动作
   *
   * 监听用户下拉刷新事件。
   * - 需要在`app.json`的`window`选项中或页面配置中开启`enablePullDownRefresh`。
   * - 可以通过`wx.startPullDownRefresh`触发下拉刷新，调用后触发下拉刷新动画，效果与用户手动下拉刷新一致。
   * - 当处理完数据刷新后，`wx.stopPullDownRefresh`可以停止当前页面的下拉刷新。
   */
  onPullDownRefresh?(): void
  /** 页面上拉触底事件的处理函数
   *
   * 监听用户上拉触底事件。
   * - 可以在`app.json`的`window`选项中或页面配置中设置触发距离`onReachBottomDistance`。
   * - 在触发距离内滑动期间，本事件只会被触发一次。
   */
  onReachBottom?(): void
  /** 用户点击右上角转发
   *
   * 监听用户点击页面内转发按钮（`<button>` 组件 `open-type="share"`）或右上角菜单“转发”按钮的行为，并自定义转发内容。
   *
   * **注意：只有定义了此事件处理函数，右上角菜单才会显示“转发”按钮**
   *
   * 此事件需要 return 一个 Object，用于自定义转发内容
   */
  onShareAppMessage?(
    /** 分享发起来源参数 */
    options?: WechatMiniprogram.Page.IShareAppMessageOption
  ): WechatMiniprogram.Page.ICustomShareContent
  /** 页面滚动触发事件的处理函数
   *
   * 监听用户滑动页面事件。
   */
  onPageScroll?(
    /** 页面滚动参数 */
    options?: WechatMiniprogram.Page.IPageScrollOption
  ): void

  /** 当前是 tab 页时，点击 tab 时触发，最低基础库： `1.9.0` */
  onTabItemTap?(
    /** tab 点击参数 */
    options?: WechatMiniprogram.Page.ITabItemTapOption
  ): void

  public setData<K extends keyof T>(
    data: T| Pick<T, K> | any,
    callback?: () => void
  ): void;

  canvasGetImageData(option: WechatMiniprogram.CanvasGetImageDataOption): void;
    /** [wx.canvasPutImageData(Object object, Object this)](wx.canvasPutImageData.md)
     *
     * 将像素数据绘制到画布。在自定义组件下，第二个参数传入自定义组件实例 this，以操作组件内 <canvas> 组件
     *
     * 最低基础库： `1.9.0` */
    canvasPutImageData(option: WechatMiniprogram.CanvasPutImageDataOption): void;
    /** [wx.canvasToTempFilePath(Object object, Object this)](wx.canvasToTempFilePath.md)
     *
     * 把当前画布指定区域的内容导出生成指定大小的图片。在 `draw()` 回调里调用该方法才能保证图片导出成功。 */
    canvasToTempFilePath(option: WechatMiniprogram.CanvasToTempFilePathOption): void;
    /** [[CanvasContext]((CanvasContext)) wx.createCanvasContext(string canvasId, Object this)](wx.createCanvasContext.md)
     *
     * 创建 canvas 的绘图上下文 `CanvasContext` 对象 */
    createCanvasContext(
      /** 要获取上下文的 `<canvas>` 组件 canvas-id 属性 */
      canvasId: string,
    ): WechatMiniprogram.CanvasContext;

    createAudioContext(
      /** `<audio/>` 组件的 id */
      id: string,
    ): WechatMiniprogram.AudioContext;
    /** [[CameraContext]((CameraContext)) wx.createCameraContext()](wx.createCameraContext.md)
     *
     * 创建 `camera` 上下文 `CameraContext` 对象。
     *
     * 最低基础库： `1.6.0` */
    createCameraContext():  WechatMiniprogram.CameraContext;
    /** [[InnerAudioContext]((InnerAudioContext)) wx.createInnerAudioContext()](wx.createInnerAudioContext.md)
     *
     * 创建内部 `audio` 上下文 `InnerAudioContext` 对象。
     *
     * 最低基础库： `1.6.0` */
    createInnerAudioContext():  WechatMiniprogram.InnerAudioContext;
    /** [[LivePlayerContext]((LivePlayerContext)) wx.createLivePlayerContext(string id, Object this)](wx.createLivePlayerContext.md)
     *
     * 创建 `live-player` 上下文 `LivePlayerContext` 对象。
     *
     * 最低基础库： `1.7.0` */
    createLivePlayerContext(
      /** `<live-player/>` 组件的 id */
      id: string,
    ):  WechatMiniprogram.LivePlayerContext;
    /** [[LivePusherContext]((LivePusherContext)) wx.createLivePusherContext()](wx.createLivePusherContext.md)
     *
     * 创建 `live-pusher` 上下文 `LivePusherContext` 对象。
     *
     * 最低基础库： `1.7.0` */
    createLivePusherContext():  WechatMiniprogram.LivePusherContext;
    /** [[MapContext]((MapContext)) wx.createMapContext(string mapId, Object this)](wx.createMapContext.md)
     *
     * 创建 `map` 上下文 `MapContext` 对象。 */
    createMapContext(
      /** `<map/>` 组件的 id */
      mapId: string,
    ):  WechatMiniprogram.MapContext;
    /** [[VideoContext]((VideoContext)) wx.createVideoContext(string id, Object this)](wx.createVideoContext.md)
     *
     * 创建 `video` 上下文 `VideoContext` 对象。 */
    createVideoContext(
      /** `<video/>` 组件的 id */
      id: string,
    ):  WechatMiniprogram.VideoContext;

    public createIntersectionObserver(options: WechatMiniprogram.CreateIntersectionObserverOption,
      ): WechatMiniprogram.IntersectionObserver;
}

declare class WxComponent<T = any> extends WxPage<T> implements IComponent<T> {
    __wxExparserNodeId__: string;
      /**
     * 组件的对外属性，是属性名到属性设置的映射表
     */
    properties?: {[key: string]: IComponentProperty|Object | String | Number};
    /**
     * 组件生命周期声明对象
     */
    lifetimes?: IComponentLefeTime;
    /**
     * 组件生命周期函数，在组件实例进入页面节点树时执行
     */
    attached?(): void;
    ready?(): void;
    options?: any;
    /**
     * 组件接受的外部样式类
     */
    externalClasses?: string|string[];
    /**
     * 组件所在页面的生命周期声明对象，支持页面的 show 、 hide 等生命周期
     */
    pageLifetimes?: IComponentPageLefeTime;
    /**
     * 定义段过滤器
     */
    definitionFilter?(): void;
    /**
     * 组件生命周期声明对象
     */
    methods?: IMethod;
    /**
     * 类似于mixins和traits的组件间代码复用机制
     */
    behaviors?: IBehavior[];
    /**
     * 组件数据字段监听器
     */
    observers?: {[key: string]: (args: any)=>void};
    /**
     * 组件间关系定义
     */
    relations?: {[key: string]: IComponentRelation};

  public triggerEvent(name: string, detail?: any, options?: any): void;
  public createSelectorQuery(): any;
  public selectComponent(selector: string): any;
  public selectAllComponents(selector: string): any;
  public getRelationNodes<T>(relationKey: string): T[];
  public groupSetData(callback: Function): any;
  public getTabBar(): any;
}

interface IAppWindow {
    /**
     * 导航栏背景颜色 默认#000000
     */
    navigationBarBackgroundColor?: string;
    /**
     * 导航栏标题颜色 默认white
     */
    navigationBarTextStyle?: 'black'| 'white';
    /**
     * 导航栏标题文字内容
     */
    navigationBarTitleText: string;
    /**
     * 导航栏样式，仅支持以下值：default 默认样式 custom 自定义导航栏，只保留右上角胶囊按钮
     */
    navigationStyle?: 'default' | 'custom';
    /**
     * 窗口的背景色 默认#fff
     */
    backgroundColor?: string;
    /**
     * 下拉 loading 的样式 默认dark
     */
    backgroundTextStyle?: 'dark'| 'light';

    /**
     * 顶部窗口的背景色，仅 iOS 支持
     */
    backgroundColorTop?: string,
    /**
     * 底部窗口的背景色，仅 iOS 支持
     */
    backgroundColorBottom?: string,
    /**
     * 是否开启当前页面下拉刷新。
     */
    enablePullDownRefresh?: boolean,
    /**
     * 页面上拉触底事件触发时距页面底部距离，单位为px。
     */
    onReachBottomDistance?: number,
    /**
     * 屏幕旋转设置
     */
    pageOrientation?: 'auto' | 'portrait' | 'landscape',

}

interface ITarBarItem {
    /**
     * 页面路径
     */
    pagePath: string;
    /**
     * tab 上按钮文字
     */
    text: string;
    /**
     * 图片路径icon 大小限制为 40kb，建议尺寸为 81px * 81px
     */
    iconPath?: string;
    /**
     * 选中时的图片路径icon 大小限制为 40kb，建议尺寸为 81px * 81px
     */
    selectedIconPath?: string;
}

interface IAppJson {
    /**
     * 页面路径列表
     */
    pages: string[];
    /**
     * 全局的默认窗口表现
     */
    window?: IAppWindow;
    /**
     * 多 tab 应用
     */
    tabBar?: {
        /**
         * tab 上的文字默认颜色，仅支持十六进制颜色
         */
        color: string;
        selectedColor: string;
        backgroundColor: string;
        borderStyle?: 'black' | 'white';
        position?: 'bottom'| 'top';
        custom?: boolean;
        /**
         * tab 的列表
         */
        list: ITarBarItem[]
    };
    /**
     * 各类网络请求的超时时间,单位均为毫秒
     */
    networkTimeout?: {
        request?: number;
        connectSocket?: number;
        uploadFile?: number;
        downloadFile?: number;
    };
    /**
     * 开启 debug 模式
     */
    debug?: boolean,
    /**
     * 插件所有者小程序需要设置这一项来启用插件功能页。
     */
    functionalPages?: boolean;
    /**
     * 启用分包加载时，声明项目分包结构
     */
    subpackages?: any[];
    /**
     * 使用 Worker 处理多线程任务时，设置 Worker 代码放置的目录
     */
    workers?: string;
    /**
     * 申明需要后台运行的能力
     */
    requiredBackgroundModes?: string[];
    /**
     * 声明小程序需要使用的插件。
     */
    plugins?: any;
    /**
     * 分包预下载规则
     */
    preloadRule?: any;
    /**
     * iPad 小程序是否支持屏幕旋转，默认关闭
     */
    resizable?: boolean;
    /**
     * 需要跳转的小程序列表
     */
    navigateToMiniProgramAppIdList?: string[];
    /**
     * 在此处声明的自定义组件视为全局自定义组件
     */
    usingComponents?: {[tag: string]: string};
    /**
     * 小程序接口权限相关设置
     */
    permission?: {
        [key: string]: {
            /**
             * 小程序获取权限时展示的接口用途说明
             */
            desc: string
        }
    };
    /**
     * 指明 sitemap.json 的位置；默认为 'sitemap.json'
     */
    sitemapLocation?: string;
    /**
     * "v2"可表明启用新版的组件样式
     */
    style?: string;
    /**
     * 指定需要引用的扩展库 目前支持以下项目： kbone: 多端开发框架 weui: WeUI 组件库
     */
    useExtendedLib?: {
        [key: string]: boolean
    };
    /**
     * 微信消息用小程序打开
     */
    entranceDeclare?: {
        locationMessage: {
            /**
             * 页面路径 pages/index/index
             */
            path: string;
            /**
             * 参数
             */
            query: string
        }
    };
}

export declare function WxAppJson(options: IAppJson): ClassDecorator;

declare class WxApp<T = any> implements WechatMiniprogram.App.Option {
    public globalData: T;
    /** 生命周期回调—监听小程序初始化
     *
     * 小程序初始化完成时触发，全局只触发一次。
     */
    onLaunch(options: WechatMiniprogram.App.LaunchShowOption): void
    /** 生命周期回调—监听小程序显示
     *
     * 小程序启动，或从后台进入前台显示时
     */
    onShow(options: WechatMiniprogram.App.LaunchShowOption): void
    /** 生命周期回调—监听小程序隐藏
     *
     * 小程序从前台进入后台时
     */
    onHide(): void
    /** 错误监听函数
     *
     * 小程序发生脚本错误，或者 api
     */
    onError(/** 错误信息，包含堆栈 */ error: string): void
    /** 页面不存在监听函数
     *
     * 小程序要打开的页面不存在时触发，会带上页面信息回调该函数
     *
     * **注意：**
     * 1. 如果开发者没有添加 `onPageNotFound` 监听，当跳转页面不存在时，将推入微信客户端原生的页面不存在提示页面。
     * 2. 如果 `onPageNotFound` 回调中又重定向到另一个不存在的页面，将推入微信客户端原生的页面不存在提示页面，并且不再回调 `onPageNotFound`。
     *
     * 最低基础库： 1.9.90
     */
    onPageNotFound(options: WechatMiniprogram.App.PageNotFoundOption): void

    /**
     * 小程序有未处理的 Promise 拒绝时触发。也可以使用 [wx.onUnhandledRejection](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onUnhandledRejection.html) 绑定监听。注意事项请参考 [wx.onUnhandledRejection](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onUnhandledRejection.html)。
     * **参数**：与 [wx.onUnhandledRejection](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onUnhandledRejection.html) 一致
     */
    onUnhandledRejection: WechatMiniprogram.OnUnhandledRejectionCallback
    /**
     * 系统切换主题时触发。也可以使用 wx.onThemeChange 绑定监听。
     *
     * 最低基础库： 2.11.0
     */
    onThemeChange: WechatMiniprogram.OnThemeChangeCallback
}

declare interface BaseEvent {
  type:           string;
  timeStamp:      number;
  target:         Target;
  currentTarget:  Target;
}

declare interface CustomEvent extends BaseEvent {
  detail:         Detail;
}

declare interface InputEvent extends BaseEvent {
  detail:         any;
}

declare interface TouchEvent extends BaseEvent {
  touches:        Touch[] | CanvasTouch[];
  changedTouches: Touch[] | CanvasTouch[];
}

interface Touch {
  identifier: number;
  pageX:      number;
  pageY:      number;
  clientX:    number;
  clientY:    number;
}

interface CanvasTouch {
  identifier: number;
  x: number;
  y: number;
}

interface Target {
  id:      string| number;
  tagName: string;
  dataset: {[key: string]: string|number};
}

interface Detail {
  [key: string]: any,
  x: number;
  y: number;
}