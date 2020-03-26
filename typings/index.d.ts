/// <reference path="./wx/index.d.ts" />

interface IAppOption {
    globalData: {
      userInfo?: WechatMiniprogram.UserInfo,
    }
    userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}
