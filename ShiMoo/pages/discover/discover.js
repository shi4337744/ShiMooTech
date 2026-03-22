const app = getApp();

Page({
  data: {
    filterType: 'all',
    discoveryList: []
  },

  onShow: function() {
    // 保持自定义TabBar的发现页高亮
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    
    let globalList = app.globalData.globalDiscoveryList || [];
    const deletedIds = app.globalData.deletedPostIds || [];
    
    // 过滤掉已删除以及状态为处理中的订单，保持发现页干净
    let currentList = globalList.filter(item => 
      !deletedIds.includes(item.id) && 
      item.orderStatus !== 'processing' && 
      item.orderStatus !== 'completed'
    );
    
    this.setData({ discoveryList: currentList });
  },

  changeFilter: function(e) {
    this.setData({ filterType: e.currentTarget.dataset.type });
    wx.vibrateShort({ type: 'light' });
  },

  // ================= 🚀 发现页接单 (已连通真实后端) =================
  takeOrder: function(e) {
    const index = e.currentTarget.dataset.index;
    const task = this.data.discoveryList[index];
    
    if (!task.documentId) return wx.showToast({ title: '无法接单，缺少真实ID', icon: 'none' });
    const targetId = task.documentId;

    wx.showModal({
      title: '接单确认',
      content: '确定要接下这个跑腿任务吗？',
      confirmColor: '#3b82f6',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '正在抢单...', mask: true });

          wx.request({
            url: `http://localhost:1337/api/posts/${targetId}`,
            method: 'PUT',
            data: { data: { orderStatus: 'processing', accepterName: '校园雷锋(测试)' } },
            success: (updateRes) => {
              wx.hideLoading();
              if (updateRes.statusCode === 200) {
                wx.showToast({ title: '接单成功！', icon: 'success' });

                if (!app.globalData.acceptedOrders) app.globalData.acceptedOrders = [];
                app.globalData.acceptedOrders.unshift({ ...task, orderStatus: 'processing' });

                if (!app.globalData.deletedPostIds) app.globalData.deletedPostIds = [];
                app.globalData.deletedPostIds.push(task.id);

                let currentList = this.data.discoveryList;
                currentList.splice(index, 1);
                this.setData({ discoveryList: currentList });
              } else {
                wx.showToast({ title: '手慢了，接单失败', icon: 'none' });
              }
            },
            fail: () => {
              wx.hideLoading();
              wx.showToast({ title: '网络连接失败', icon: 'error' });
            }
          });
        }
      }
    });
  },

  handleLike: function(e) {
    const id = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    const list = this.data.discoveryList;
    const currentItem = list[index];

    if (!currentItem || currentItem.id !== id) return;

    const newIsLiked = !currentItem.isLiked;
    const countField = currentItem.type === 'market' ? 'likes' : 'likeCount';
    const currentLikeCount = currentItem[countField] || 0; 
    const newLikeCount = newIsLiked ? currentLikeCount + 1 : currentLikeCount - 1;

    this.setData({
      [`discoveryList[${index}].isLiked`]: newIsLiked,
      [`discoveryList[${index}].${countField}`]: newLikeCount,
      [`discoveryList[${index}].isAnimating`]: true
    });

    if (app.globalData.globalDiscoveryList) {
      let globalP = app.globalData.globalDiscoveryList.find(g => g.id === id);
      if (globalP) { globalP.isLiked = newIsLiked; globalP[countField] = newLikeCount; }
    }
    setTimeout(() => { this.setData({ [`discoveryList[${index}].isAnimating`]: false }); }, 300);
    wx.vibrateShort({ type: 'light' });
  },

  goToDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    const type = e.currentTarget.dataset.type;
    let currentItem = this.data.discoveryList.find(item => item.id === id);
    if (currentItem) app.globalData.currentPostDetail = currentItem;
    wx.navigateTo({ url: `/pages/postDetail/postDetail?id=${id}&type=${type}` });
  },

  preventTap: function() { return; },

  editPost: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/publish/publish?id=${id}&type=wall&mode=edit` });
  },

  // ================= 🚀 发现页：真实物理删除 =================
  deletePost: function(e) {
    const id = e.currentTarget.dataset.id;
    
    let task = this.data.discoveryList.find(item => item.id === id);
    if (!task || !task.documentId) return wx.showToast({ title: '找不到真实ID', icon: 'none' });
    const targetId = task.documentId;

    wx.showModal({
      title: '永久删除确认', 
      content: '删除后无法恢复，确定要删掉这条动态吗？', 
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '正在抹除...', mask: true });

          wx.request({
            url: `http://localhost:1337/api/posts/${targetId}`,
            method: 'DELETE',
            success: (deleteRes) => {
              wx.hideLoading();
              if (deleteRes.statusCode === 200 || deleteRes.statusCode === 204) {
                wx.showToast({ title: '已永久删除', icon: 'success' });

                this.setData({ 
                  discoveryList: this.data.discoveryList.filter(item => item.id !== id) 
                });

                if (!app.globalData.deletedPostIds) app.globalData.deletedPostIds = [];
                app.globalData.deletedPostIds.push(id);
              } else {
                wx.showToast({ title: '删除失败，请重试', icon: 'none' });
              }
            },
            fail: () => {
              wx.hideLoading();
              wx.showToast({ title: '网络连接失败', icon: 'error' });
            }
          });
        }
      }
    });
  }
});