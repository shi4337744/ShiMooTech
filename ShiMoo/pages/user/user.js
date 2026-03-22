const app = getApp();

Page({
  data: {
    favCount: 0,
    publishCount: 0,
    userInfo: {} // 🚀 新增 userInfo 对象
  },

  onShow: function () {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }

    // 🚀 初始化或同步全局的个人资料数据
    if (!app.globalData.userInfo) {
      app.globalData.userInfo = {
        avatarUrl: 'https://via.placeholder.com/150/2563eb/ffffff?text=U',
        nickName: '哈工大吴彦祖',
        bio: '软件工程 · 2021级',
        phone: '13800138000'
      };
    }
    this.setData({ userInfo: app.globalData.userInfo });

    // 计算统计数据 (保持之前的逻辑)
    const deletedIds = app.globalData.deletedPostIds || [];
    let favList = app.globalData.favoriteList || [];
    let validFavs = favList.filter(item => !deletedIds.includes(item.id));
    let myWallPosts = (app.globalData.globalDiscoveryList || []).filter(item => item.type === 'wall' && (item.userName === '我发布的' || item.userName === '自己(测试)'));
    let myOngoingOrders = app.globalData.publishedOrders || [];
    let myHistoryOrders = (app.globalData.historyOrders || []).filter(item => item.userName === '我发布的');
    let allMyPosts = [...myWallPosts, ...myOngoingOrders, ...myHistoryOrders].filter(item => !deletedIds.includes(item.id));

    this.setData({ favCount: validFavs.length, publishCount: allMyPosts.length });
  },

  goToMyOrders: function() { wx.switchTab({ url: '/pages/order/order' }); },
  goToMyPublish: function() { wx.navigateTo({ url: '/pages/myPublish/myPublish' }); },
  goToMyFavorite: function() { wx.navigateTo({ url: '/pages/myFavorite/myFavorite' }); },
  
  // 🚀 新增：跳转个人资料与设置页
  goToProfile: function() { wx.navigateTo({ url: '/pages/profile/profile' }); },
  goToSettings: function() { wx.navigateTo({ url: '/pages/settings/settings' }); },

  showToast: function() { wx.showToast({ title: '页面开发中...', icon: 'none', duration: 1500 }); }
})