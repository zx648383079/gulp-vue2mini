<template>
    <view class="scroller scroller-class" style="height:{{contentHeight}}px">
        <view class="refresh-block" style="height:{{refreshHeight}}px;background-color:{{refreshBackground}};transition:{{transition}}"> 
                <image  class="{{loading?'roate':(pull?'':'pull')}}" src="{{loading?refreshingImg:beginRefreshImg}}"></image>
                <text  class="refreshing_text" >{{refreshing_text}}</text> 
        </view>
        <scroll-view class="scroll_container" scroll-y="true" style="position:relative;width:100%;left:0;height:{{contentHeight}}px;top:{{loadMoreHeight == 0? refreshHeight:-loadMoreHeight}}px;bottom:{{loadMoreHeight}}px;" bindscroll="scroll" bindscrolltolower="lower" bindscrolltoupper="upper" bindtouchstart="start" bindtouchend="end">
            <view style="width:100%;height:100%" bindtouchmove="move">
                <slot></slot>
                <view class="load-end" wx:if="{{loadEnd}}">{{loadEndText}}</view>
            </view> 
        </scroll-view>
        <view class="loadMore-block" style="height:{{loadMoreHeight}}px;background-color:{{loadBackground}};transition:{{transition}}"> 
                <image  class="{{loading?'roate':(pull?'pull':'')}}" src="{{loading?loadingImg:beginLoading}}"></image>
                <text  class="loading-text" >{{loading_text}}</text> 
        </view> 
    </view>
</template>
<script lang="ts">
import { WxJson, WxComponent, WxMethod } from "../../../typings/wx/lib.vue";
import * as scroller from '../../components/PullToRefresh/refreshLoadRegister';


/***
 * 使用  bind:refresh="refresh" bind:more="more"
 */
@WxJson({
    component: true
})
export default class PullToRefresh extends WxComponent<scroller.IComponentData>  {

    public options = {
        multipleSlots: true
    };

    public externalClasses = ['scroller-class'];

    public properties = {
        options: {
            type: Object,
            value: {
                showToast: false,
                contentHeight: 200,

                beginRefreshText: '下拉刷新',
                freedRefreshText: '释放立即刷新',
                refreshingText: '正在刷新',
                refreshSuccessText: '刷新成功',
                refreshErrorText: '刷新失败',
                beginRefreshImg: '/images/icon/icon_arrow.png',
                refreshingImg: '/images/icon/icon_loading.png',
                refreshBackground: '#fff',

                beginLoadText: '上拉加载',
                freedLoadText: '释放立即加载',
                loadingText: '正在加载',
                loadSuccessText: '加载成功',
                loadErrorText: '加载失败',
                beginLoading: '/images/icon/icon_arrow.png',
                loadingImg: '/images/icon/icon_loading.png',
                loadBackground: '#fff',
                loadEndText: '没有更多数据',
                distance: 54,
                pullFactor: 0.6,
            }
        },
    }

    public data: scroller.IComponentData = {
        currentSize: 0,
        loadEnd: true,
        loadEndText: ''
    };

    public ready() {
        scroller.register(this, this.data.options);
        this.setData({
            loadEndText: this.data.options.loadEndText
        });
        // console.log(this.data.loadEndText)
    }
    
    @WxMethod()
    public done(n: number) {
        scroller.loadFinish(this, n);
        if (this.data.options.showToast === true) {
            wx.hideLoading();
        }
    }

    @WxMethod()
    public doLoadEnd() {
        this.setData({
            loadEnd: true
        });
        this.done(1)
        scroller.setOptions(this, {
            loadEnd: this.data.loadEnd,
            loadEndText: this.data.loadEndText
        });
    }
    //模拟刷新数据
    @WxMethod()
    public refresh() {
        this.setData({
            currentSize: 0
        });
        if (this.data.options.showToast === true) {
            wx.showLoading({
            title: 'loading...',
            });
        }
        if (this.data.loadEnd === true) {
            this.setData({
            loadEnd: false
            });
        }
        console.log('下拉刷新')
        this.triggerEvent("refresh", scroller)
    }
    //模拟加载更多数据
    @WxMethod()
    public loadMore() {
        if (this.data.loadEnd !== true) {
            this.updateRefreshIcon()
            if (this.data.options.showToast === true) {
                wx.showLoading({
                    title: 'loading...',
                });
            }
            const currentSize = this.data.currentSize + 1
            this.setData({
                currentSize: currentSize
            });
            console.log('上拉加载')
            this.triggerEvent("more", scroller)
        }
    }

    /** 
     * 旋转上拉加载图标 
     */
    @WxMethod()
    public updateRefreshIcon() {
        let deg = 0;
        const _this = this;
        // console.log('旋转开始了.....')
        const animation = wx.createAnimation({
            duration: 1000
        });

        const timer = setInterval(function () {
                if (!_this.data.refreshing) {
                    clearInterval(timer);
                }
                animation.rotateZ(deg).step({}); //在Z轴旋转一个deg角度  
                deg += 360;
                _this.setData({
                    refreshAnimation: animation.export()
                })
        }, 1000);
    }

}

</script>
<style lang="scss" scoped>
/*上拉加载更多布局*/
.loadMore-block{
  z-index: 1;
  position: absolute;
  background-color:rgba(0, 0, 0, 0.08) ;  
  width:100%;
  text-align: center;
  box-sizing: border-box;
  overflow: hidden;
  left: 0;
  right: 0;
  bottom: 0;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  /* transition: .3s; */
}
.loadMore-block image {
  /* position: absolute; */
  /* left: 20%; */
  /* right: 0;
  top: 15rpx;   */
  text-align: center;
  width: 40rpx;  
  height: 40rpx;
}
.loadMore-block .loading-text{
  /* position: absolute; */
  /* width: 100%; */
  /* left: 0; */
  /* right: 0; */
  /* top: 15rpx;   */
  text-align: center;
  height: 40rpx;
  line-height: 40rpx;
  padding-left: 10px;
}  

/*下拉刷新布局*/
.refresh-block {
  position: absolute;
  top: 0;
  /* background-color:rgba(0, 0, 0, 0.08) ;   */
  width:100%;
  /* height: 0px; */
  text-align: center;
  overflow: hidden;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-block image {
  /* position: absolute;
  left: 25%;
  right: 0; */
  /* bottom: 15rpx;   */
  text-align: center;
  width: 40rpx;  
  height: 40rpx;
}
.refresh-block .refreshing_text{
  /* position: absolute;
  width: 100%;
  left: 0;
  right: 0;
  bottom: 15rpx;   */
  text-align: center;
  height: 40rpx;
  line-height: 40rpx;
  padding-left: 10px;
}  

@-webkit-keyframes rotate{ 0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}
@keyframes rotate{0%{transform:rotate(0deg);}100%{ transform:rotate(360deg);}}
.refresh-block .roate,.loadMore-block .roate{
   -moz-animation:rotate 1s infinite linear;
  -webkit-animation:rotate 1s infinite linear;
  animation:rotate 1s infinite linear;
}
.refresh-block .pull,.loadMore-block .pull{
  transform: rotate(180deg) scale(1) translate(0%,0%);
  transition: All 0.5s ease;
}
.load-end{
  padding: 15px;
  font-size: 30rpx;
  text-align: center;
}

.scroller{
  position: relative;
  overflow: hidden;
}
</style>
