const app = getApp();

Page({
  data: {
    orders: []
  },

  onShow: function() {
    // 从全局拉取最新订单
    this.setData({
      orders: app.globalData.globalOrderList || []
    });
  },

  // 模拟取消订单
  cancelOrder: function(e) {
    wx.showModal({
      title: '提示',
      content: '确认取消该订单吗？',
      success: (res) => {
        if (res.confirm) {
          const id = e.currentTarget.dataset.id;
          let list = this.data.orders.filter(v => v.id !== id);
          app.globalData.globalOrderList = list;
          this.setData({ orders: list });
          wx.showToast({ title: '已取消', icon: 'none' });
        }
      }
    });
  }
})