const app = getApp();

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
    wx.request({
      url: 'http://localhost:1337/api/posts',
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.data) {
          const rawData = res.data.data;
          const deletedIds = app.globalData.deletedPostIds || [];
          
          const formattedData = rawData.map(item => ({
            id: 'real_' + item.id,
            documentId: item.documentId, 
            userName: item.userName || "神秘用户",
            time: "刚刚",
            content: item.content || "",
            type: item.type,
            price: item.price ? item.price : "0",
            location: item.location || "未填写",
            deadline: item.deadline || "尽快",
            imageUrl: item.imageUrl || "",
            phone: item.phone || "",
            orderStatus: item.orderStatus || 'pending',
            accepterName: item.accepterName || ''
          })).filter(item => !deletedIds.includes(item.id));

          const pubOrders = formattedData.filter(item => 
            (item.userName === '校园测试达人' || item.userName === '我发布的') && 
            (item.type === 'errand' || item.type === 'market')
          );

          const accOrders = formattedData.filter(item => 
            item.accepterName === '校园雷锋(测试)'
          );

          this.setData({ 
            publishedOrders: pubOrders,
            acceptedOrders: accOrders
          });
        } else {
          console.error("拉取失败，服务器返回：", res);
        }
      },
      fail: (err) => console.error("网络连接失败：", err)
    });
  },

  // ================= 🚀 1. 确认送达 =================
  deliverOrder: function(e) {
    const id = e.currentTarget.dataset.id;
    const task = this.data.acceptedOrders.find(item => item.id === id);
    if (!task || !task.documentId) return wx.showToast({ title: '找不到真实ID', icon: 'none' });
    
    wx.showModal({
      title: '确认送达', content: '确认已经将物品送到指定地点了吗？', confirmColor: '#3b82f6',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '提交中...', mask: true });
          wx.request({
            url: `http://localhost:1337/api/posts/${task.documentId}`,
            method: 'PUT',
            data: { data: { orderStatus: 'delivered' } },
            success: (updateRes) => {
              wx.hideLoading();
              if (updateRes.statusCode === 200) {
                wx.showToast({ title: '已确认送达', icon: 'success' });
                this.fetchRealOrders(); 
              } else {
                // 🚀 核心修复：如果后端拒绝，直接把错误码拍在屏幕上！
                wx.showToast({ title: '修改失败(错误码:' + updateRes.statusCode + ')', icon: 'none', duration: 3000 });
                console.error("更新失败信息：", updateRes.data);
              }
            },
            fail: (err) => {
              wx.hideLoading();
              wx.showToast({ title: '网络超时', icon: 'error' });
            }
          });
        }
      }
    });
  },

  // ================= 🚀 2. 确认收货 =================
  confirmReceipt: function(e) {
    const id = e.currentTarget.dataset.id;
    const task = this.data.publishedOrders.find(item => item.id === id);
    if (!task || !task.documentId) return wx.showToast({ title: '找不到真实ID', icon: 'none' });

    wx.showModal({
      title: '确认收货', content: '确认物品无误并结束订单吗？', confirmColor: '#10b981',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '完成中...', mask: true });
          wx.request({
            url: `http://localhost:1337/api/posts/${task.documentId}`,
            method: 'PUT',
            data: { data: { orderStatus: 'completed' } },
            success: (updateRes) => {
              wx.hideLoading();
              if (updateRes.statusCode === 200) {
                wx.showToast({ title: '订单已完成！', icon: 'success' });
                this.fetchRealOrders(); 
              } else {
                wx.showToast({ title: '操作失败(' + updateRes.statusCode + ')', icon: 'none' });
              }
            },
            fail: () => {
              wx.hideLoading();
              wx.showToast({ title: '网络异常', icon: 'error' });
            }
          });
        }
      }
    });
  },

  // ================= 🚀 3. 取消发布 =================
  cancelPublished: function(e) {
    const id = e.currentTarget.dataset.id;
    const task = this.data.publishedOrders.find(item => item.id === id);
    if (!task || !task.documentId) return wx.showToast({ title: '找不到真实ID', icon: 'none' });

    wx.showModal({
      title: '取消发布', content: '确定要撤销这个订单吗？', confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '撤销中...', mask: true });
          wx.request({
            url: `http://localhost:1337/api/posts/${task.documentId}`,
            method: 'DELETE',
            success: (deleteRes) => {
              wx.hideLoading();
              if (deleteRes.statusCode === 200 || deleteRes.statusCode === 204) {
                wx.showToast({ title: '已撤销订单', icon: 'success' });
                const app = getApp();
                if (!app.globalData.deletedPostIds) app.globalData.deletedPostIds = [];
                app.globalData.deletedPostIds.push(id);
                this.fetchRealOrders(); 
              } else {
                wx.showToast({ title: '撤销失败(' + deleteRes.statusCode + ')', icon: 'none' });
              }
            },
            fail: () => {
              wx.hideLoading();
              wx.showToast({ title: '网络异常', icon: 'error' });
            }
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