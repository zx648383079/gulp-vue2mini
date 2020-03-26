<template>
    <div>
        

        <IconButton @click="tapAdd"/>
    </div>
</template>
<script lang="ts">
import {
    IMyApp
} from '../../app.vue';
import { WxPage, WxJson } from '../../../typings/wx/lib.vue';

const app = getApp<IMyApp>();

interface IPageData {
    
}
@WxJson({
    usingComponents: {
        IconButton: "/pages/index/Child/IconButton"
    },
    navigationBarTitleText: "首页",
    navigationBarBackgroundColor: "#f4f4f4",
    navigationBarTextStyle: "black"
})
export class Index extends WxPage<IPageData> {
    public data: IPageData = {
        
    };

    onLoad() {
    }

    public tapAdd() {
        wx.showToast({
            title: '您点击了添加'
        })
    }
}
</script>
<style lang="scss" scoped>
</style>
