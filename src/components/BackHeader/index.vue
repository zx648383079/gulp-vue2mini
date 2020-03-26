<template>
    <header class="top {{ this.fixed ?  '' : 'fixed' }}">
        <div class="back" @click="tapBack">
            <i class="fa fa-chevron-left"></i>
        </div>
        <span class="title">
            {{ title }}
        </span>
        <slot></slot>
    </header>
</template>
<script lang="ts">
import { WxJson, WxComponent, WxMethod } from "../../../typings/wx/lib.vue";


@WxJson({
    component: true,
})
export class BackHeader extends WxComponent<any>  {
    public properties = {
        title: String,
        fixed: {
            type: Boolean,
            value: true,
        }
    }

    @WxMethod()
    public tapBack() {
        wx.navigateBack({ delta: 1 });
    }
}

</script>
<style lang="scss" scoped>

</style>
