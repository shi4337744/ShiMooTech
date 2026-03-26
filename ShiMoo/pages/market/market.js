const app = getApp();

Page({
  data: {
    filterType: 'all',
    fullList: [],
    displayList: []
  },

  onShow: function() {
    this.loadData();
  },

  loadData: function() {
    let list = (app.globalData.globalDiscoveryList || []).filter(item => item.type === 'market');
    const deletedIds = app.globalData.deletedPostIds || [];
    list = list.filter(item => !deletedIds.includes(item.id));
    
    this.setData({ fullList: list });
    this.applyFilter(this.data.filterType);
  },

  changeFilter: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ filterType: type });
    this.applyFilter(type);
    wx.vibrateShort({ type: 'light' });
  },

  applyFilter: function(type) {
    let list = this.data.fullList;
    if (type !== 'all') {
      list = list.filter(item => item.tradeType === type);
    }
    this.setData({ displayList: list });
  },

  goToDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    const currentItem = this.data.displayList.find(item => item.id === id);
    if (currentItem) app.globalData.currentPostDetail = currentItem;
    wx.navigateTo({ url: `/pages/postDetail/postDetail?id=${id}&type=market` });
  },

  // 独立大厅里的点赞逻辑
  handleLike: function(e) {
    const id = e.currentTarget.dataset.id;
    let list = this.data.displayList;
    const index = list.findIndex(item => item.id === id);
    
    if (index === -1) return;
    const currentItem = list[index];
    const newIsLiked = !currentItem.isLiked;
    const currentLikeCount = currentItem.likes || currentItem.likeCount || 0; 
    const newLikeCount = newIsLiked ? currentLikeCount + 1 : currentLikeCount - 1;

    this.setData({
      [`displayList[${index}].isLiked`]: newIsLiked,
      [`displayList[${index}].likes`]: newLikeCount,
      [`displayList[${index}].likeCount`]: newLikeCount,
      [`displayList[${index}].isAnimating`]: true
    });

    if (app.globalData.globalDiscoveryList) {
      let globalP = app.globalData.globalDiscoveryList.find(g => g.id === id);
      if (globalP) { globalP.isLiked = newIsLiked; globalP.likeCount = newLikeCount; globalP.likes = newLikeCount; }
    }
    
    setTimeout(() => { this.setData({ [`displayList[${index}].isAnimating`]: false }); }, 300);
    wx.vibrateShort({ type: 'light' });
  }
});