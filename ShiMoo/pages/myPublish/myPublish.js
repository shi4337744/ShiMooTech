const app = getApp();
const api = require('../../utils/request.js');

Page({
  data: {
    currentTab: 'all', 
    myList: [] 
  },

  onShow: function() { this.fetchMyPublishes(); },

  switchTab: function(e) {
    this.setData({ currentTab: e.currentTarget.dataset.tab });
    wx.vibrateShort({ type: 'light' });
  },

  fetchMyPublishes: function() {
    api.get('/api/posts').then(res => {
      if (res && res.data) {
        const rawData = res.data;
        const deletedIds = app.globalData.deletedPostIds || [];
        
        // 🚀 拿出你的身份证和当前的名字
        const myUid = app.globalData.userInfo ? app.globalData.userInfo.uid : '';
        const myName = app.globalData.userInfo ? app.globalData.userInfo.nickName : '';

        let myPublishes = rawData.filter(item => 
          // 🚀 核心修复：认领条件升级！只要 UID 匹配，就是你的！（同时兼容没绑 UID 的老帖子）
          (item.authorUid === myUid || item.userName === myName) && 
          !deletedIds.includes('real_' + item.id)
        );

        const formattedData = myPublishes.map(item => ({
          id: 'real_' + item.id,
          documentId: item.documentId, 
          userName: item.userName,
          time: "刚刚",
          content: item.content || "",
          type: item.type,
          price: item.price ? item.price : "0",
          imageUrl: item.imageUrl || "",
          orderStatus: item.orderStatus || 'pending'
        }));

        this.setData({ myList: formattedData.reverse() });
      }
    }).catch(err => console.error("拉取发布失败：", err));
  },

  editPost: function(e) {
    const id = e.currentTarget.dataset.id;
    const post = this.data.myList.find(item => item.id === id);
    wx.navigateTo({ url: `/pages/publish/publish?id=${id}&type=${post.type}&mode=edit` });
  },

  deletePost: function(e) {
    const id = e.currentTarget.dataset.id;
    const task = this.data.myList.find(item => item.id === id);
    if (!task || !task.documentId) return wx.showToast({ title: '找不到真实ID', icon: 'none' });

    wx.showModal({
      title: '删除确认', content: '确定要永久删除这条记录吗？', confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          api.del(`/api/posts/${task.documentId}`, {}, '正在抹除...').then(() => {
            wx.showToast({ title: '已永久删除', icon: 'success' });
            if (!app.globalData.deletedPostIds) app.globalData.deletedPostIds = [];
            app.globalData.deletedPostIds.push(id);
            this.fetchMyPublishes(); 
          });
        }
      }
    });
  },

  appealOrder: function(e) { wx.showToast({ title: '售后功能开发中', icon: 'none' }); }
});