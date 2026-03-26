const app = getApp();
const api = require('../../utils/request.js');

Page({
  data: {
    filterType: 'all',
    discoveryList: []
  },

  onShow: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    this.fetchDiscoveryData();
  },

  fetchDiscoveryData: function() {
    api.get('/api/posts').then(res => {
      if (res && res.data) {
        const rawData = res.data;
        const deletedIds = app.globalData.deletedPostIds || [];
        // 🚀 获取真实 UID
        const myUid = app.globalData.userInfo ? app.globalData.userInfo.uid : '';

        let formattedData = rawData.map(item => ({
          id: 'real_' + item.id, documentId: item.documentId, userName: item.userName || "神秘用户", time: "刚刚",
          content: item.content || "", type: item.type, price: item.price ? item.price : "0",
          location: item.location || "未填写", deadline: item.deadline || "尽快", imageUrl: item.imageUrl || "",
          tag: item.tag || "", urgent: item.urgent || false, taskType: item.taskType || "",
          originalPrice: item.originalPrice || "", condition: item.condition || "全新", tradeType: item.tradeType || "个人闲置",
          phone: item.phone || "", orderStatus: item.orderStatus || 'pending', 
          likeCount: item.likeCount || 0, likes: item.likes || 0, commentCount: item.commentCount || 0,
          likedUsers: item.likedUsers || [],
          isLiked: item.likedUsers ? item.likedUsers.includes(myUid) : false // 🚀 真·验证
        }));

        let currentList = formattedData.filter(item => 
          !deletedIds.includes(item.id) && 
          !(item.type === 'errand' && (item.orderStatus === 'processing' || item.orderStatus === 'delivered' || item.orderStatus === 'completed'))
        );

        this.setData({ discoveryList: currentList.reverse() });
      }
    }).catch(err => console.error("发现页拉取失败", err));
  },

  changeFilter: function(e) {
    this.setData({ filterType: e.currentTarget.dataset.type });
    wx.vibrateShort({ type: 'light' });
  },

  takeOrder: function(e) {
    const index = e.currentTarget.dataset.index;
    const task = this.data.discoveryList[index];
    if (!task || !task.documentId) return wx.showToast({ title: '无法接单，缺少真实ID', icon: 'none' });

    wx.showModal({
      title: '接单确认', content: '确定要接下这个跑腿任务吗？', confirmColor: '#3b82f6',
      success: (res) => {
        if (res.confirm) {
          const myName = app.globalData.userInfo ? app.globalData.userInfo.nickName : '微信新用户';
          api.put(`/api/posts/${task.documentId}`, { data: { orderStatus: 'processing', accepterName: myName } }, '正在抢单...')
            .then(() => {
              wx.showToast({ title: '接单成功！', icon: 'success' });
              this.fetchDiscoveryData();
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

    const myUid = app.globalData.userInfo ? app.globalData.userInfo.uid : '';
    if (!myUid) return wx.showToast({ title: '请先登录', icon: 'none' });

    const newIsLiked = !currentItem.isLiked;
    const countField = currentItem.type === 'market' ? 'likes' : 'likeCount';
    const currentLikeCount = currentItem[countField] || 0; 
    const newLikeCount = newIsLiked ? currentLikeCount + 1 : currentLikeCount - 1;

    let likedUsers = currentItem.likedUsers || [];
    if (newIsLiked) {
      if (!likedUsers.includes(myUid)) likedUsers.push(myUid);
    } else {
      likedUsers = likedUsers.filter(uid => uid !== myUid);
    }

    this.setData({
      [`discoveryList[${index}].isLiked`]: newIsLiked,
      [`discoveryList[${index}].${countField}`]: newLikeCount,
      [`discoveryList[${index}].likedUsers`]: likedUsers,
      [`discoveryList[${index}].isAnimating`]: true
    });

    if (currentItem.documentId) {
      const updateData = {};
      updateData[countField] = newLikeCount;
      if (countField === 'likes') updateData['likeCount'] = newLikeCount;
      updateData['likedUsers'] = likedUsers;
      api.put(`/api/posts/${currentItem.documentId}`, { data: updateData }, false);
    }

    setTimeout(() => { this.setData({ [`discoveryList[${index}].isAnimating`]: false }); }, 300);
    wx.vibrateShort({ type: 'light' });
  },

  goToDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    let currentItem = this.data.discoveryList.find(item => String(item.id) === String(id));
    if (currentItem) {
      app.globalData.currentPostDetail = currentItem;
      wx.navigateTo({ url: `/pages/postDetail/postDetail?id=${id}&type=${currentItem.type}` });
    } else {
      wx.showToast({ title: '解析失败', icon: 'none' });
    }
  },

  preventTap: function() { return; },

  editPost: function(e) { wx.navigateTo({ url: `/pages/publish/publish?id=${e.currentTarget.dataset.id}&type=wall&mode=edit` }); },

  deletePost: function(e) {
    const id = e.currentTarget.dataset.id;
    let task = this.data.discoveryList.find(item => item.id === id);
    if (!task || !task.documentId) return wx.showToast({ title: '找不到真实ID', icon: 'none' });

    wx.showModal({
      title: '永久删除确认', content: '删除后无法恢复，确定要删掉这条动态吗？', confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          api.del(`/api/posts/${task.documentId}`, {}, '正在抹除...')
            .then(() => {
              wx.showToast({ title: '已永久删除', icon: 'success' });
              if (!app.globalData.deletedPostIds) app.globalData.deletedPostIds = [];
              app.globalData.deletedPostIds.push(id);
              this.fetchDiscoveryData();
            });
        }
      }
    });
  }
});