const app = getApp();
const api = require('../../utils/request.js'); // 🚀 引入瑞士军刀

Page({
  data: {
    favCount: 0,
    publishCount: 0,
    userInfo: {} 
  },

  onShow: function () {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    this.initUserProfile();
  },

  // 🚀 核心：真正的微信静默登录逻辑！
  initUserProfile: function() {
    // 如果内存里已经有你的信息了，就不用每次都去打扰微信服务器了
    if (app.globalData.userInfo && app.globalData.userInfo.documentId) {
      this.setData({ userInfo: app.globalData.userInfo });
      this.calculateStats();
      return;
    }

    wx.showLoading({ title: '安全登录中...', mask: true });

    // 1. 调用微信官方接口，获取极其核心的临时通行证：code
    wx.login({
      success: (loginRes) => {
        if (loginRes.code) {
          // 2. 把 code 发给咱们刚写的 Strapi 后端接口
          api.post('/api/wechat/login', { code: loginRes.code }, false).then(res => {
            wx.hideLoading();
            if (res && res.data) {
              const serverUser = res.data;
              const userData = {
                documentId: serverUser.documentId, 
                uid: serverUser.uid, // 🚀 这个现在是绝对真实的微信 OpenID！
                nickName: serverUser.nickName,
                bio: serverUser.bio,
                phone: serverUser.phone || '',
                avatarUrl: serverUser.avatarUrl
              };
              
              // 存入全局变量
              app.globalData.userInfo = userData;
              this.setData({ userInfo: userData });
              this.calculateStats();
              wx.showToast({ title: '微信登录成功', icon: 'success' });
            }
          }).catch(err => {
            wx.hideLoading();
            console.error("微信登录失败，请检查后端报错：", err);
            wx.showToast({ title: '登录失败，稍后重试', icon: 'none' });
          });
        } else {
          wx.hideLoading();
          wx.showToast({ title: '获取 code 失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error("微信环境异常：", err);
        wx.showToast({ title: '微信服务异常', icon: 'none' });
      }
    });
  },

  calculateStats: function() {
    const deletedIds = app.globalData.deletedPostIds || [];
    let favList = app.globalData.favoriteList || [];
    let validFavs = favList.filter(item => !deletedIds.includes(item.id));
    let myWallPosts = (app.globalData.globalDiscoveryList || []).filter(item => item.type === 'wall' && (item.userName === this.data.userInfo.nickName || item.userName === '我发布的'));
    let myOngoingOrders = app.globalData.publishedOrders || [];
    let myHistoryOrders = (app.globalData.historyOrders || []).filter(item => item.userName === this.data.userInfo.nickName);
    let allMyPosts = [...myWallPosts, ...myOngoingOrders, ...myHistoryOrders].filter(item => !deletedIds.includes(item.id));

    this.setData({ favCount: validFavs.length, publishCount: allMyPosts.length });
  },

  goToMyOrders: function() { wx.switchTab({ url: '/pages/order/order' }); },
  goToMyPublish: function() { wx.navigateTo({ url: '/pages/myPublish/myPublish' }); },
  goToMyFavorite: function() { wx.navigateTo({ url: '/pages/myFavorite/myFavorite' }); },
  goToProfile: function() { wx.navigateTo({ url: '/pages/profile/profile' }); },
  goToSettings: function() { wx.navigateTo({ url: '/pages/settings/settings' }); },
  showToast: function() { wx.showToast({ title: '页面开发中...', icon: 'none', duration: 1500 }); }
});