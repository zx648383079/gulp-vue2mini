<template>
    <div class="fixed-icon" @click="tapAdd">
        +
    </div>
</template>
<script lang="ts">
import { WxComponent, WxJson, WxMethod } from "../../../../typings/wx/lib.vue";
import { IMyApp } from "../../../app.vue";

interface IComponentData {
    
}

const app = getApp<IMyApp>();

@WxJson({
    component: true
})
export class IconButton extends WxComponent<IComponentData>  {

    public options = {
        addGlobalClass: true
    }

    public data = {
        
    };

    @WxMethod()
    tapAdd() {
        this.triggerEvent('click');
    }

}
</script>
<style lang="scss" scoped>
.fixed-icon {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: aquamarine;
    color: #fff;
    line-height: 40px;
    text-align: center;
    .fa {
        font-size: 30px;
    }
}

</style>
