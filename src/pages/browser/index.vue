<template>
    <web-view :src="url"/>
</template>
<script lang="ts">
import { WxJson, WxPage } from "typings/wx/lib.vue";

interface IPageData {
    title: string;
    url: string;
}

@WxJson({
    navigationBarTitleText: "",
    navigationBarBackgroundColor: "#05a6b1",
    navigationBarTextStyle: "white"
})
export default class Index extends WxPage<IPageData> {
    public data: IPageData = {
        title: '',
        url: '',
    };

    onLoad(option: any) {
        this.setData({
            url: option.url
        });
    }
}
</script>
