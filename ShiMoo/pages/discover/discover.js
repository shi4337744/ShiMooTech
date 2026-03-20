const app = getApp();

Page({
  data: {
    discoveryList: [],
    filterType: 'all',
    isRefreshing: false
  },

  onShow: function() {
    this.loadData();
  },

  // 核心数据加载函数
  loadData: function() {
    const list = app.globalData.globalDiscoveryList || [];
    this.setData({
      discoveryList: list
    });
  },

  // 监听用户下拉动作
  onPullDownRefresh: function() {
    // 1. 震动反馈
    wx.vibrateShort({ type: 'light' });
    
    // 2. 模拟请求延迟（让用户看到刷新动画）
    setTimeout(() => {
      this.loadData();
      
      // 3. 停止下拉动作
      wx.stopPullDownRefresh();
      
      // 4. 提示更新成功
      wx.showToast({
        title: '已更新内容',
        icon: 'none',
        duration: 1000
      });
    }, 800);
  },

  // 切换分类
  changeFilter: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ filterType: type });
    wx.vibrateShort({ type: 'light' });
  },

  // 触底加载更多（预留逻辑）
  onReachBottom: function() {
    console.log("触底了，可以在这里请求下一页数据");
  }
})