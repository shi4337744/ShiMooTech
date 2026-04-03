// app.js
const api = require('./utils/request.js');

App({
  onLaunch: function () {
    // 🚀 核心修复：小程序一启动，立刻在后台大门拦截并进行静默登录！
    this.doGlobalSilentLogin();
  },

  doGlobalSilentLogin: function() {
    wx.login({
      success: (loginRes) => {
        if (loginRes.code) {
          api.post('/api/wechat/login', { code: loginRes.code }, false).then(res => {
            if (res && res.data) {
              const serverUser = res.data;
              // 🚀 登录成功后，立刻把你的真实身份印在全局档案库里！
              this.globalData.userInfo = {
                documentId: serverUser.documentId, 
                uid: serverUser.uid, 
                nickName: serverUser.nickName,
                bio: serverUser.bio,
                phone: serverUser.phone || '',
                avatarUrl: serverUser.avatarUrl
              };
              console.log("🚀 [全局启动截获] 微信静默登录成功！真实身份已就位，UID:", serverUser.uid);
            }
          }).catch(err => console.error("全局静默登录失败", err));
        }
      }
    });
  },

  globalData: {
    userInfo: null, // 启动时是 null，但一秒内就会被上面的登录逻辑填满真实数据
    apiBaseUrl: 'http://localhost:1337', // ⚠️ 确保这里是你真实的本地后端地址
    newPost: null,
    deletedPostIds: [],
    favoriteList: [],
    globalDiscoveryList: [],
    publishedOrders: [],
    historyOrders: [],
    currentPostDetail: null
  }
});