const app = getApp();

Page({
  data: {
    currentTab: 'published',
    publishedOrders: [],
    acceptedOrders: []
  },

  onShow: function() {
    // 🚀 点亮第三项（订单为 2）
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    this.loadOrders();
  },

  loadOrders: function() {
    this.setData({
      publishedOrders: app.globalData.publishedOrders || [],
      acceptedOrders: app.globalData.acceptedOrders || []
    });
  },

  switchTab: function(e) { this.setData({ currentTab: e.currentTarget.dataset.tab }); wx.vibrateShort({ type: 'light' }); },
  previewImage: function(e) { wx.previewImage({ urls: [e.currentTarget.dataset.url], current: e.currentTarget.dataset.url }); },
  callPhone: function(e) {
    const phone = e.currentTarget.dataset.phone;
    if (phone && phone !== '未留电话') wx.makePhoneCall({ phoneNumber: phone, fail: () => {} });
    else wx.showToast({ title: '对方未留电话', icon: 'none' });
  },

  cancelPublished: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '取消确认', content: '确定要取消发布该内容吗？',
      success: (res) => {
        if (res.confirm) {
          let pOrders = this.data.publishedOrders.filter(o => o.id !== id);
          app.globalData.publishedOrders = pOrders;
          if (!app.globalData.deletedPostIds) app.globalData.deletedPostIds = [];
          app.globalData.deletedPostIds.push(id);
          this.setData({ publishedOrders: pOrders });
          wx.showToast({ title: '已取消', icon: 'success' });
        }
      }
    });
  },

  deliverOrder: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '送达确认', content: '请确保物品已交到对方手中！', confirmColor: '#3b82f6',
      success: (res) => {
        if (res.confirm) {
          let aOrders = this.data.acceptedOrders;
          let aOrder = aOrders.find(o => o.id === id);
          if (aOrder) aOrder.orderStatus = 'delivered';
          app.globalData.acceptedOrders = aOrders;

          let pOrders = this.data.publishedOrders;
          let pOrder = pOrders.find(o => o.id === id);
          if (pOrder) pOrder.orderStatus = 'delivered';
          app.globalData.publishedOrders = pOrders;

          this.setData({ acceptedOrders: aOrders, publishedOrders: pOrders });
          wx.showToast({ title: '已通知发布者', icon: 'success' });
        }
      }
    });
  },

  confirmReceipt: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '收货确认', content: '确认收货后订单将结束并归档，是否确认？', confirmColor: '#10b981',
      success: (res) => {
        if (res.confirm) {
          let pOrders = this.data.publishedOrders;
          let aOrders = this.data.acceptedOrders;
          
          let completedOrder = pOrders.find(o => o.id === id);
          if (completedOrder) {
            completedOrder.orderStatus = 'completed';
            if (!app.globalData.historyOrders) app.globalData.historyOrders = [];
            app.globalData.historyOrders.push(completedOrder);
          }

          pOrders = pOrders.filter(o => o.id !== id);
          aOrders = aOrders.filter(o => o.id !== id);
          app.globalData.publishedOrders = pOrders;
          app.globalData.acceptedOrders = aOrders;
          this.setData({ publishedOrders: pOrders, acceptedOrders: aOrders });
          wx.showToast({ title: '交易圆满完成', icon: 'success' });
        }
      }
    });
  }
})