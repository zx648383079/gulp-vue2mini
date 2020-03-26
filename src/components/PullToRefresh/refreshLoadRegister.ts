
/**
 * 注册下拉刷新上拉加载更多
 * context 为调用页面
 * json为注册回调事件
 */
export interface IComponentData {
    [key: string]: any,
    currentSize?: number,
    loadEnd?: boolean,
    loadEndText?: string,
    options?: any,
    refreshing?: boolean,
    beginRefreshText?: string,
    beginLoadText?: string,
    contentHeight?: number,
    beginRefreshImg?: string,
    refreshingImg?: string,
    refreshBackground?: string,
    beginLoading?: string,
    loadingImg?: string,
    loadBackground?: string,
    transition?: number,

    loadingHeight?: number, //正在加载时高度
    refreshHeight?: number, //刷新布局高度  
    loadMoreHeight?: number, //加载更多布局高度
    scrolling?: boolean, //滚动中
    isUpper?: boolean,
    isLower?: boolean,
    windowHeight?: number, //获取屏幕高度  
    downY?: number, //触摸时Y轴坐标 
    end?: boolean, //touchEnd 
    distance?: number,
}

let o: IComponentData = {};
let transition = '0.2s'

export function setOptions(context: any, options: IComponentData) {
    o = Object.assign(options, o)
    context.setData({
        loadEnd: o.loadEnd,
        loadEndText: o.loadEndText,
    })
}

export function register(context: any, options: IComponentData) {
  o = options
  context.setData({
    pull: true, //true 下拉刷新状态或者上拉加载更多状态   false 释放
    loading: false, //是否在加载中  
    refreshing_text: o.beginRefreshText,
    loading_text: o.beginLoadText,

    contentHeight: o.contentHeight,

    beginRefreshImg: o.beginRefreshImg,
    refreshingImg: o.refreshingImg,
    refreshBackground: o.refreshBackground,

    beginLoading: o.beginLoading,
    loadingImg: o.loadingImg,
    loadBackground: o.loadBackground,
    loadEnd: false,
    transition: 0,

    loadingHeight: 48, //正在加载时高度
    refreshHeight: 0, //刷新布局高度  
    loadMoreHeight: 0, //加载更多布局高度
    scrolling: false, //滚动中
    isUpper: true,
    isLower: false,
    windowHeight: 603, //获取屏幕高度  
    downY: 0, //触摸时Y轴坐标 
    end: true //touchEnd 
  });
  //获取屏幕高度  
  wx.getSystemInfo({
    success: function (res) {
      context.setData({
        windowHeight: res.windowHeight
      })
      // console.log("屏幕高度: " + res.windowHeight);
      context.data.loadingHeight = o.distance >= res.windowHeight * 0.08 ? o.distance : res.windowHeight * 0.08;
    }
  });
  context.move = function (e: any) {
    move(context, e);
  }
  context.scroll = function (e: any) {
    scroll(context);
  }
  context.lower = function (e: any) {
    lower(context);
  }
  context.upper = function (e: any) {
    upper(context);
  }
  context.start = function (e: any) {
    start(context, e);
  }
  context.end = function (e: any) {
    end(context, e);
  }
}

function scroll(context: any) {
  // console.log("scroll...");
  if (context.data.end && context.data.isLower) { //如果快速拖动 然后释放 会在end后继续scroll 
    //可能出现scroll到顶点后依然走scroll方法
    return;
  }
  if (context.data.end && context.data.isUpper) {
    return;
  }
  context.data.scrolling = true;
  context.data.isUpper = false;
  context.data.isLower = false;

}
//上拉  滚动条 滚动到底部时触发
function lower(context: any) {
  // console.log("lower...")
  context.data.end = true;
  context.data.isLower = true;
  context.data.scrolling = false;

}
//下拉  滚动条 滚动顶底部时触发
function upper(context: any) {
  // console.log("upper....");
  context.data.end = true;
  context.data.isUpper = true;
  context.data.scrolling = false;
}

function start(context: any, e) {
  context.data.end = false;
  // console.log('start ');
  if (context.data.scrolling || context.data.loading) {
    return;
  }
  var startPoint = e.touches[0]
  var clientY = startPoint.clientY;
  context.setData({
    downY: clientY,
    refreshHeight: 0,
    loadMoreHeight: 0,
    transition: 0,
    pull: true,
    refreshing_text: o.beginRefreshText,
    loading_text: o.beginLoadText
  });
}

function end(context: any, e) {
  context.data.end = true;
  context.data.scrolling = false;
  if (context.data.refreshing) {
    return;
  }
  // console.log('end');
  //释放开始刷新
  var height = context.data.loadingHeight;
  if (context.data.refreshHeight > context.data.loadingHeight) {
    context.setData({
      refreshHeight: height,
      loading: true,
      pull: false,
      refreshing_text: o.refreshingText
    });
    context.refresh();
  } else if (context.data.loadMoreHeight > height) {
    context.setData({
      loadMoreHeight: height,
      loading: true,
      pull: false,
      loading_text: o.loadingText
    });

    context.loadMore();

  } else {
    context.setData({
      refreshHeight: 0,
      loadMoreHeight: 0,
      loading: false,
      pull: true
    })
  }

}

export function loadFinish(context: any, success: boolean) {
  if (!context) {
    // console.log('please add context');
    return;
  }
  if (success === true) {
    context.setData({
      refreshing_text: o.refreshSuccessText,
      loading_text: o.loadSuccessText,
    });
  } else if(success === false) {
    context.setData({
      refreshing_text: o.refreshErrorText,
      loading_text: o.loadErrorText,
    });
  }else{
    context.setData({
      loading_text: o.loadEndText
    });
  }
  // setTimeout(function () {
    //2s后刷新结束
    context.setData({
      refreshHeight: 0,
      loadMoreHeight: 0,
      loading: false
    });

  // }, 500);
}

function move(context: any, e: any) {
  // console.log("move:", "isUpper = "+context.data.isUpper + "  isLower = "+context.data.isLower+ " scrolling = "+context.data.scrolling);
  if (context.data.scrolling) {
    return;
  }
  if (context.data.loading) {
    return;
  }
  var movePoint = e.changedTouches[0];

  if (o.pullFactor >= 1) {
    o.pullFactor = 0.5
  }

  var moveY = (movePoint.clientY - context.data.downY) * o.pullFactor;
  // console.log("moveY = ", moveY);
  if (Math.abs(moveY) > context.data.loadingHeight * 3) {
    return;
  }

  //1.下拉刷新
  if (context.data.isUpper && moveY > 0) {
    //console.log("下拉...dy:", moveY);
    context.setData({
      refreshHeight: moveY
    })
    if (context.data.refreshHeight > context.data.loadingHeight) {
      context.setData({
        pull: false,
        transition: transition,
        refreshing_text: o.freedRefreshText
      })
    } else {
      context.setData({
        pull: true,
        refreshing_text: o.beginRefreshText
      })
    }
  } else if (context.data.isLower && moveY < 0 && context.data.loadEnd === false) { //2上拉加载更多
    //console.log("上拉...dy:", moveY);
    context.setData({
      loadMoreHeight: Math.abs(moveY)
    })
    if (context.data.loadMoreHeight > context.data.loadingHeight) {
      context.setData({
        pull: false,
        transition: transition,
        loading_text: o.freedLoadText
      })
    } else {
      context.setData({
        pull: true,
        refreshing_text: o.beginLoadText
      })
    }
  } else if (o.loadEnd === true) {
    context.setData({
      refreshHeight: 0,
      loadMoreHeight: 0,
      loading: false
    })
  } else {
    // console.log("moveY", moveY);   
  }
}