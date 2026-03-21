const app = getApp();

Page({
  data: {
    cacheSize: '0.00KB'
  },

  onShow: function() {
    this.calculateCache();
  },

  goToProfile: function() {
    wx.navigateTo({ url: '/pages/profile/profile' });
  },

  // 计算本地缓存大小 (模拟计算)
  calculateCache: function() {
    try {
      const res = wx.getStorageInfoSync();
      const sizeKB = res.currentSize;
      if (sizeKB > 1024) {
        this.setData({ cacheSize: (sizeKB / 1024).toFixed(2) + 'MB' });
      } else {
        this.setData({ cacheSize: sizeKB.toFixed(2) + 'KB' });
      }
    } catch (e) {
      this.setData({ cacheSize: '1.24MB' }); // 兜底假数据
    }
  },

  // 🚀 一键清理缓存（极度解压）
  clearCache: function() {
    wx.showModal({
      title: '清理缓存',
      content: '这将清除搜索历史等本地数据，确定清理吗？',
      confirmColor: '#2563eb',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '清理中...' });
          setTimeout(() => {
            wx.clearStorageSync(); // 物理清空本地存储
            this.calculateCache(); // 重新计算归零
            wx.hideLoading();
            wx.showToast({ title: '清理完成', icon: 'success' });
          }, 600);
        }
      }
    });
  },

  showAbout: function() {
    wx.showModal({
      title: '关于 校园服务通',
      content: '这是一款致力于打造智慧校园生活闭环的综合服务平台，包含动态广场、跑腿代拿、闲置交易等核心功能，由海南星穆时空科技有限公司开发部署并负责运维。',
      showCancel: false,
      confirmText: '太酷了',
      confirmColor: '#2563eb'
    });
  },

  // 退出登录
  logout: function() {
    wx.showActionSheet({
      itemList: ['退出当前账号'],
      itemColor: '#ef4444',
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.showLoading({ title: '正在退出...' });
          setTimeout(() => {
            wx.hideLoading();
            wx.reLaunch({ url: '/pages/index/index' }); // 退出后强制重启到首页
          }, 800);
        }
      }
    });
  }
})