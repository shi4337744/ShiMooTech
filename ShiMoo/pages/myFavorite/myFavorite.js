const app = getApp();

Page({
  data: {
    favList: []
  },

  onShow: function() {
    this.loadFavorites();
  },

  loadFavorites: function() {
    const deletedIds = app.globalData.deletedPostIds || [];
    let list = app.globalData.favoriteList || [];
    
    // 核心：过滤掉被接单/买走/删除的内容
    list = list.filter(item => !deletedIds.includes(item.id));
    
    this.setData({ favList: list });
  },

  goToDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    const type = e.currentTarget.dataset.type;
    const currentItem = this.data.favList.find(item => item.id === id);
    if (currentItem) app.globalData.currentPostDetail = currentItem;
    wx.navigateTo({ url: `/pages/postDetail/postDetail?id=${id}&type=${type}` });
  },

  cancelFavorite: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '取消收藏',
      content: '确定要将此内容从收藏夹移除吗？',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          // 物理移除
          app.globalData.favoriteList = app.globalData.favoriteList.filter(item => item.id !== id);
          
          // 同步抹除广场的收藏状态
          if (app.globalData.globalDiscoveryList) {
            let globalP = app.globalData.globalDiscoveryList.find(g => g.id === id);
            if (globalP) globalP.isFavorited = false;
          }
          
          this.loadFavorites();
          wx.showToast({ title: '已移除收藏', icon: 'success' });
        }
      }
    });
  }
})