const app = getApp();

Page({
  data: {
    filterType: 'all',
    fullList: [],
    displayList: []
  },

  onShow: function() {
    this.loadData();
  },

  loadData: function() {
    // 1. 获取全局数据中的跑腿任务
    let list = (app.globalData.globalDiscoveryList || []).filter(item => item.type === 'errand');
    
    // 2. 剔除黑名单（已被接单或被删除的）
    const deletedIds = app.globalData.deletedPostIds || [];
    list = list.filter(item => !deletedIds.includes(item.id));
    
    this.setData({ fullList: list });
    this.applyFilter(this.data.filterType);
  },

  changeFilter: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ filterType: type });
    this.applyFilter(type);
    wx.vibrateShort({ type: 'light' });
  },

  // 执行筛选逻辑
  applyFilter: function(type) {
    let list = this.data.fullList;
    if (type === 'urgent') {
      list = list.filter(item => item.urgent === true);
    } else if (type !== 'all') {
      // 模糊匹配标签内容
      list = list.filter(item => item.taskType && item.taskType.includes(type));
    }
    this.setData({ displayList: list });
  },

  goToDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    const currentItem = this.data.displayList.find(item => item.id === id);
    if (currentItem) app.globalData.currentPostDetail = currentItem;
    wx.navigateTo({ url: `/pages/postDetail/postDetail?id=${id}&type=errand` });
  },

  // 接单逻辑（与首页保持完全同步）
  takeOrder: function(e) {
    const id = e.currentTarget.dataset.id;
    const task = this.data.displayList.find(item => item.id === id);

    wx.showModal({
      title: '接单确认',
      content: '确定要接下这个跑腿任务吗？',
      confirmColor: '#3b82f6',
      success: (res) => {
        if (res.confirm) {
          if (!app.globalData.acceptedOrders) app.globalData.acceptedOrders = [];
          app.globalData.acceptedOrders.unshift({ ...task, orderStatus: 'processing' });

          if (!app.globalData.deletedPostIds) app.globalData.deletedPostIds = [];
          app.globalData.deletedPostIds.push(task.id);

          if (app.globalData.publishedOrders) {
            let pOrder = app.globalData.publishedOrders.find(o => o.id === task.id);
            if (pOrder) pOrder.orderStatus = 'processing';
          }
          
          this.loadData(); // 刷新大厅
          wx.showToast({ title: '接单成功！', icon: 'success' });
        }
      }
    });
  }
});