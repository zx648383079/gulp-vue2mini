<template>
    <movable-area class="swipe-container" style="width: {{width}}rpx; height: {{height}}rpx;">
        <movable-view class="swipe-row" direction="horizontal"  out-of-bounds="{{out}}" damping="20" x="{{left}}" style="width: {{width + leftWidth + rightWidth}}rpx; height: {{height}}rpx;" inertia  @touchstart='touchStart'
                bindchange='touchMove'
                @touchend='touchEnd'>
            <div class="actions-left">
                <slot name="left"></slot>
            </div>
            <div class="swipe-content {{name}}">
                <slot name="content"></slot>
            </div>
            <div class="actions-right">
                <slot name="right"></slot>
            </div>
        </movable-view>

    </movable-area>
</template>
<script lang="ts">
import { WxComponent, WxJson, WxMethod, TouchEvent, Touch, CustomEvent } from "../../../typings/wx/lib.vue";


interface IComponentData {
    viewWidth: number,
    left: number,
    leftWidth?: number,
    rightWidth?: number,
    name?: string,
    index?: number,
    out: boolean
}

const _windowWidth = wx.getSystemInfoSync().windowWidth // (px)

@WxJson({
    component: true
})
export class SwipeRow extends WxComponent<IComponentData> {

    public options = {
        addGlobalClass: true,
        multipleSlots: true // 在组件定义时的选项中启用多slot支持
    };

    public relations = {
        './box': {
            type: 'parent', // 关联的目标节点应为子节点
            linked(target: any) {
                // 每次有custom-li被插入时执行，target是该节点实例对象，触发在该节点attached生命周期之后
            },
            linkChanged(target: any) {

            },
            unlinked(target: any) {
                // 每次有custom-li被移除时执行，target是该节点实例对象，触发在该节点detached生命周期之后
            }
        }
    }

    public properties = {
        name: String,
        index: Number,
        //  组件显示区域的宽度 (rpx)
        width: {
            type: Number,
            value: 750 // 750rpx 即整屏宽
        },
        //  组件显示区域的高度 (rpx)
        height: {
            type: Number,
            value: 200,
        },
        //  组件滑动显示区域的宽度 (rpx)
        leftWidth: {
            type: Number,
            value: 0
        },
        rightWidth: {
            type: Number,
            value: 0
        }
    }

    public data: IComponentData = {
        viewWidth: _windowWidth, // (rpx)
        //  movable-view偏移量
        left: 0,
        //  movable-view是否可以出界
        out: false,
    };

    oldLeft: number = 0;
    startX = 0;
    isTouch = false;
    leftWidth = 0;
    rightWidth = 0;
    public moveCallback = (i: any) => {i};

    ready() {
        this.updateWidth();
    }
    @WxMethod()
    updateWidth() {
        const query = wx.createSelectorQuery().in(this);
        query.select('.actions-left').boundingClientRect((res) => {
            this.leftWidth = res.width;
            this.setData({
                left: -this.leftWidth
            });
        }).exec();
        query.select('.actions-right').boundingClientRect(res => {
            this.rightWidth = res.width;
        }).exec();
    }
    @WxMethod()
    getLeftWidth(): number {
        return this.leftWidth;
    }
    @WxMethod()
    getRightWidth(): number {
        return this.rightWidth;
    }
    @WxMethod()
    tapRemove(item: any) {
        this.triggerEvent('remove', item);
    }
    @WxMethod()
    touchStart(e: TouchEvent) {
        this.moveCallback && this.moveCallback(this);
        this.oldLeft = this.data.left;
        this.isTouch = false;
        this.startX = (e.changedTouches[0] as Touch).pageX;
    }

    @WxMethod()
    touchMove(e: CustomEvent) {
        this.isTouch = true;
        const diff = e.detail.x;
        if (diff >= 0) {
            this.setData({
                out: false
            });
            return;
        }
        const left = this.getLeftWidth();
        const right = this.getRightWidth();
        if (diff >= 0 || diff <= -left - right) {
            this.setData({
                out: false
            });
            return;
        }
        if (this.oldLeft > -left) {
            this.setData({
                out: diff > -left && diff < -left - right
            });
            return;
        }
        if (this.oldLeft < -left) {
            this.setData({
                out: diff > -left - right && diff < -left
            });
            return;
        }
        if (diff > -left) {
            this.setData({
                out: diff >= 0
            });
            return;
        }
        this.setData({
            out: diff > -left - right
        });
    }
    @WxMethod()
    touchEnd(e: TouchEvent) {
        const left = this.getLeftWidth();
        const right = this.getRightWidth();
        if (!this.isTouch) {
            this.setData({
                left: -left,
            })
            this.triggerEvent('tap');
            return;
        }
        const diff = (e.changedTouches[0] as Touch).pageX - this.startX;
        if (this.oldLeft > -left) {
            this.setData({
                left: - diff > left / 3 ? -left : 0
            });
            return;
        }
        if (this.oldLeft > -left) {
            this.setData({
                left: diff > right / 3 ? -left : (-left - right)
            });
            return;
        }
        if (diff === 0) {
            this.setData({
                left: -left
            });
            return;
        }
        if (diff > 0) {
            this.setData({
                left: diff > left / 3 ? 0 : -left
            });
            return;
        }
        this.setData({
            left: -diff > right / 3 ? (-left - right) : -left
        });
    }
    @WxMethod()
    public reset() {
        this.setData({
            left: -this.getLeftWidth()
        });
    }
}

</script>
<style lang="scss" scoped>
.swipe-row {
    display: flex;
    direction: row;
    overflow: hidden;
}
.swipe-container {
    overflow: hidden;
}

</style>
