const app = getApp();

Page({
  data: { currentTab: 'all', myList: [] },
  onShow: function() { this.loadMyPosts(); },
  loadMyPosts: function() {
    let myWallPosts = (app.globalData.globalDiscoveryList || []).filter(item => item.type === 'wall' && (item.userName === '我发布的' || item.userName === '自己(测试)'));
    let myOngoingOrders = app.globalData.publishedOrders || [];
    let myHistoryOrders = (app.globalData.historyOrders || []).filter(item => item.userName === '我发布的' || item.userName === '自己(测试)');
    let combinedList = [...myWallPosts, ...myOngoingOrders, ...myHistoryOrders];
    combinedList.sort((a, b) => b.id.toString().localeCompare(a.id.toString()));
    this.setData({ myList: combinedList });
  },
  switchTab: function(e) { this.setData({ currentTab: e.currentTarget.dataset.tab }); wx.vibrateShort({ type: 'light' }); },

  // 🚀 【关键优化】：改为跳转到发布页进行高级编辑
  editPost: function(e) {
    const id = e.currentTarget.dataset.id;
    const post = this.data.myList.find(item => item.id === id);
    // 跳转到发布页，参数包含 id, 类型, 并标记为编辑模式
    wx.navigateTo({
      url: `/pages/publish/publish?id=${id}&type=${post.type}&mode=edit`
    });
  },

  deletePost: function(e) { /* (省略代码，保持和你现在的 myPublish.js 里的 deletePost 方法一样) */
    const id = e.currentTarget.dataset.id;
    wx.showModal({ title: '删除确认', content: '确定要删除这条动态吗？', confirmColor: '#ef4444', success: (res) => { if (res.confirm) { if (!app.globalData.deletedPostIds) app.globalData.deletedPostIds = []; app.globalData.deletedPostIds.push(id); if (app.globalData.publishedOrders) { app.globalData.publishedOrders = app.globalData.publishedOrders.filter(o => o.id !== id); } if (app.globalData.historyOrders) { app.globalData.historyOrders = app.globalData.historyOrders.filter(o => o.id !== id); } this.loadMyPosts(); wx.showToast({ title: '已永久删除', icon: 'success' }); } } });
  },
  appealOrder: function(e) { /* (省略售后申诉方法) */
    wx.showModal({ title: '订单申诉/售后', editable: true, placeholderText: '请详细描述您遇到的问题...', confirmColor: '#10b981', success: (res) => { if (res.confirm) { if (!res.content.trim()) return wx.showToast({ title: '申诉理由不能为空', icon: 'none' }); wx.showToast({ title: '已提交人工审核', icon: 'success' }); } } });
  }
})