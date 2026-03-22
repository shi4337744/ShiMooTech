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
    
    // 3. 过滤掉已经被接单的任务（如果后端拉取时包含了）
    list = list.filter(item => item.orderStatus !== 'processing' && item.orderStatus !== 'completed');
    
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

  // ================= 🚀 跑腿大厅：真实后端接单逻辑 =================
  takeOrder: function(e) {
    const id = e.currentTarget.dataset.id;
    const task = this.data.displayList.find(item => item.id === id);
    
    // 提取真实的数据库 ID
    const realStrapiId = String(task.id).replace('real_', '');

    wx.showModal({
      title: '接单确认',
      content: '确定要接下这个跑腿任务吗？',
      confirmColor: '#3b82f6',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '正在抢单...', mask: true });

          // 发送真实 PUT 请求修改数据库状态
          wx.request({
            url: `http://localhost:1337/api/posts/${realStrapiId}`,
            method: 'PUT',
            data: {
              data: {
                orderStatus: 'processing',
                accepterName: '校园雷锋(测试)' 
              }
            },
            success: (updateRes) => {
              wx.hideLoading();
              if (updateRes.statusCode === 200) {
                wx.showToast({ title: '接单成功！', icon: 'success' });

                // 兼容本地状态（为了不破坏你现有的“我的订单”页面展示）
                if (!app.globalData.acceptedOrders) app.globalData.acceptedOrders = [];
                app.globalData.acceptedOrders.unshift({ ...task, orderStatus: 'processing' });

                if (!app.globalData.deletedPostIds) app.globalData.deletedPostIds = [];
                app.globalData.deletedPostIds.push(task.id);

                if (app.globalData.publishedOrders) {
                  let pOrder = app.globalData.publishedOrders.find(o => o.id === task.id);
                  if (pOrder) pOrder.orderStatus = 'processing';
                }
                
                // 刷新大厅列表，单子瞬间消失
                this.loadData(); 
              } else {
                wx.showToast({ title: '手慢了，接单失败', icon: 'none' });
              }
            },
            fail: () => {
              wx.hideLoading();
              wx.showToast({ title: '网络连接失败', icon: 'error' });
            }
          });
        }
      }
    });
  }
});