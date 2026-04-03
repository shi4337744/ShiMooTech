const app = getApp();
const api = require('../../utils/request.js'); 

Page({
  data: {
    currentTab: 'published',
    publishedOrders: [],
    acceptedOrders: []
  },

  onShow: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    this.fetchRealOrders();
  },

  switchTab: function(e) {
    this.setData({ currentTab: e.currentTarget.dataset.tab });
    wx.vibrateShort({ type: 'light' });
  },

  fetchRealOrders: function() {
    api.get('/api/posts').then(res => {
      if (res && res.data) {
        const rawData = res.data;
        const deletedIds = app.globalData.deletedPostIds || [];
        // 🚀 核心：获取你的真实身份昵称
        const myName = app.globalData.userInfo ? app.globalData.userInfo.nickName : '';

        const formattedData = rawData.map(item => ({
          id: 'real_' + item.id, documentId: item.documentId, userName: item.userName || "神秘用户",
          time: "刚刚", content: item.content || "", type: item.type, price: item.price ? item.price : "0",
          location: item.location || "未填写", deadline: item.deadline || "尽快", imageUrl: item.imageUrl || "",
          phone: item.phone || "", orderStatus: item.orderStatus || 'pending', accepterName: item.accepterName || ''
        })).filter(item => !deletedIds.includes(item.id));

        // 🚀 用真名筛选“我发布的”
        const pubOrders = formattedData.filter(item =>
          item.userName === myName &&
          (item.type === 'errand' || item.type === 'market') &&
          item.orderStatus !== 'completed'
        );

        // 🚀 用真名筛选“我接单的”
        const accOrders = formattedData.filter(item =>
          item.accepterName === myName &&
          item.orderStatus !== 'completed'
        );

        this.setData({
          publishedOrders: pubOrders.reverse(),
          acceptedOrders: accOrders.reverse()
        });
      }
    }).catch(err => console.error("拉取订单失败", err));
  },

  deliverOrder: function(e) {
    const id = e.currentTarget.dataset.id;
    const task = this.data.acceptedOrders.find(item => item.id === id);
    if (!task || !task.documentId) return wx.showToast({ title: '找不到真实ID', icon: 'none' });

    wx.showModal({
      title: '确认送达', content: '确认已经将物品送到指定地点了吗？', confirmColor: '#3b82f6',
      success: (res) => {
        if (res.confirm) {
          api.put(`/api/posts/${task.documentId}`, { data: { orderStatus: 'delivered' } }, '提交中...').then(() => {
            wx.showToast({ title: '已确认送达', icon: 'success' });
            this.fetchRealOrders();
          });
        }
      }
    });
  },

  confirmReceipt: function(e) {
    const id = e.currentTarget.dataset.id;
    const task = this.data.publishedOrders.find(item => item.id === id);
    if (!task || !task.documentId) return wx.showToast({ title: '找不到真实ID', icon: 'none' });

    wx.showModal({
      title: '确认收货', content: '确认物品无误并结束订单吗？', confirmColor: '#10b981',
      success: (res) => {
        if (res.confirm) {
          api.put(`/api/posts/${task.documentId}`, { data: { orderStatus: 'completed' } }, '完成中...').then(() => {
            wx.showToast({ title: '订单已完成！', icon: 'success' });
            this.fetchRealOrders();
          });
        }
      }
    });
  },

  cancelPublished: function(e) {
    const id = e.currentTarget.dataset.id;
    const task = this.data.publishedOrders.find(item => item.id === id);
    if (!task || !task.documentId) return wx.showToast({ title: '找不到真实ID', icon: 'none' });

    wx.showModal({
      title: '取消发布', content: '确定要撤销这个订单吗？', confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          api.del(`/api/posts/${task.documentId}`, {}, '撤销中...').then(() => {
            wx.showToast({ title: '已撤销订单', icon: 'success' });
            const app = getApp();
            if (!app.globalData.deletedPostIds) app.globalData.deletedPostIds = [];
            app.globalData.deletedPostIds.push(id);
            this.fetchRealOrders();
          });
        }
      }
    });
  },

  previewImage: function(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({ urls: [url] });
  },

  callPhone: function(e) {
    const phone = e.currentTarget.dataset.phone;
    if (phone && phone !== '未留电话') {
      wx.makePhoneCall({ phoneNumber: phone });
    }
  }
});