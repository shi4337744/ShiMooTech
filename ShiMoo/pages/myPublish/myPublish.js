const app = getApp();
const api = require('../../utils/request.js'); // 🚀 引入瑞士军刀

Page({
  data: {
    currentTab: 'all', 
    myList: [] 
  },

  onShow: function() {
    this.fetchMyPublishes();
  },

  switchTab: function(e) {
    this.setData({ currentTab: e.currentTarget.dataset.tab });
    wx.vibrateShort({ type: 'light' });
  },

  fetchMyPublishes: function() {
    api.get('/api/posts').then(res => {
      if (res && res.data) {
        const rawData = res.data;
        const deletedIds = app.globalData.deletedPostIds || [];
        
        // 🚀 核心：获取你的真实身份昵称
        const myName = app.globalData.userInfo ? app.globalData.userInfo.nickName : '';

        let myPublishes = rawData.filter(item => 
          item.userName === myName && // 🚀 只看真名是你自己的帖子
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
    wx.navigateTo({
      url: `/pages/publish/publish?id=${id}&type=${post.type}&mode=edit`
    });
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

  appealOrder: function(e) {
    wx.showModal({ title: '订单申诉/售后', editable: true, placeholderText: '请详细描述问题...', confirmColor: '#10b981', success: (res) => { if (res.confirm) { if (!res.content.trim()) return wx.showToast({ title: '理由不能为空', icon: 'none' }); wx.showToast({ title: '已提交', icon: 'success' }); } } });
  }
});