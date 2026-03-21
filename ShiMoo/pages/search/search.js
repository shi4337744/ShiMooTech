const app = getApp();

Page({
  data: {
    keyword: '',
    historyList: [],
    results: [],
    isSearching: false
  },

  onLoad: function() {
    const history = wx.getStorageSync('searchHistory') || [];
    this.setData({ historyList: history });
  },

  onInput: function(e) {
    const val = e.detail.value;
    this.setData({ keyword: val });
    if (!val.trim()) { this.setData({ isSearching: false, results: [] }); }
  },

  clearInput: function() { this.setData({ keyword: '', isSearching: false, results: [] }); },
  goBack: function() { wx.navigateBack(); },

  tapHistory: function(e) {
    const kw = e.currentTarget.dataset.keyword;
    this.setData({ keyword: kw });
    this.executeSearch(kw);
  },

  onSearch: function(e) {
    const kw = e.detail.value.trim();
    if (!kw) return;
    this.saveHistory(kw);
    this.executeSearch(kw);
  },

  saveHistory: function(kw) {
    let history = this.data.historyList;
    history = history.filter(item => item !== kw); 
    history.unshift(kw); 
    if (history.length > 10) history.pop();
    wx.setStorageSync('searchHistory', history);
    this.setData({ historyList: history });
  },

  clearHistory: function() {
    wx.showModal({
      title: '提示', content: '确认清空全部搜索历史？', confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('searchHistory');
          this.setData({ historyList: [] });
        }
      }
    });
  },

  executeSearch: function(kw) {
    wx.showLoading({ title: '搜索中...' });
    this.setData({ isSearching: true });
    
    let list = app.globalData.globalDiscoveryList || [];
    const deletedIds = app.globalData.deletedPostIds || [];
    list = list.filter(item => !deletedIds.includes(item.id));
    
    const lowerKw = kw.toLowerCase();
    const filtered = list.filter(item => {
      return (item.content && item.content.toLowerCase().includes(lowerKw)) ||
             (item.tag && item.tag.toLowerCase().includes(lowerKw)) ||
             (item.location && item.location.toLowerCase().includes(lowerKw)) ||
             (item.userName && item.userName.toLowerCase().includes(lowerKw));
    });
    
    setTimeout(() => { wx.hideLoading(); this.setData({ results: filtered }); }, 400);
  },

  goToDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    const type = e.currentTarget.dataset.type;
    const currentItem = this.data.results.find(item => item.id === id);
    if (currentItem) app.globalData.currentPostDetail = currentItem;
    wx.navigateTo({ url: `/pages/postDetail/postDetail?id=${id}&type=${type}` });
  },

  // 🚀 原汁原味的搜索页点赞功能
  handleLike: function(e) {
    const id = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    const currentItem = this.data.results[index];

    if (!currentItem || currentItem.id !== id) return;

    const newIsLiked = !currentItem.isLiked;
    const countField = currentItem.type === 'market' ? 'likes' : 'likeCount';
    const currentLikeCount = currentItem[countField] || currentItem.likeCount || 0; 
    const newLikeCount = newIsLiked ? currentLikeCount + 1 : currentLikeCount - 1;

    this.setData({
      [`results[${index}].isLiked`]: newIsLiked,
      [`results[${index}].${countField}`]: newLikeCount,
      [`results[${index}].likeCount`]: newLikeCount
    });

    if (app.globalData.globalDiscoveryList) {
      let globalP = app.globalData.globalDiscoveryList.find(g => g.id === id);
      if (globalP) { globalP.isLiked = newIsLiked; globalP.likeCount = newLikeCount; globalP.likes = newLikeCount;}
    }
    wx.vibrateShort({ type: 'light' });
  },

  // 🚀 原汁原味的搜索页接单功能
  takeOrder: function(e) {
    const index = e.currentTarget.dataset.index;
    const task = this.data.results[index];

    wx.showModal({
      title: '接单确认', content: '确定要接下这个跑腿任务吗？', confirmColor: '#3b82f6',
      success: (res) => {
        if (res.confirm) {
          if (!app.globalData.acceptedOrders) app.globalData.acceptedOrders = [];
          app.globalData.acceptedOrders.unshift({ ...task, orderStatus: 'processing' });
          if (!app.globalData.deletedPostIds) app.globalData.deletedPostIds = [];
          app.globalData.deletedPostIds.push(task.id);
          if (app.globalData.publishedOrders) {
            let pOrder = app.globalData.publishedOrders.find(o => o.id === task.id);
            if (pOrder) pOrder.orderStatus = 'processing';
          }
          let currentResults = this.data.results;
          currentResults.splice(index, 1);
          this.setData({ results: currentResults });
          wx.showToast({ title: '接单成功！', icon: 'success' });
        }
      }
    });
  }
});