const app = getApp();

Page({
  data: {
    // 完美匹配你的 wxml 变量名！
    currentTab: 'all', 
    myList: [] 
  },

  onShow: function() {
    this.fetchMyPublishes();
  },

  // 匹配 wxml 的字符串 tab
  switchTab: function(e) {
    this.setData({ currentTab: e.currentTarget.dataset.tab });
    wx.vibrateShort({ type: 'light' });
  },

  // ================= 🚀 拉取真实发布 =================
  fetchMyPublishes: function() {
    wx.request({
      url: 'http://localhost:1337/api/posts',
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.data) {
          const rawData = res.data.data;
          const deletedIds = app.globalData.deletedPostIds || [];
          
          // 只保留我发出的，且没被删掉的
          let myPublishes = rawData.filter(item => 
            (item.userName === '校园测试达人' || item.userName === '我发布的') && 
            !deletedIds.includes('real_' + item.id)
          );

          const formattedData = myPublishes.map(item => ({
            id: 'real_' + item.id,
            documentId: item.documentId, 
            userName: item.userName || "我发布的",
            time: "刚刚",
            content: item.content || "",
            type: item.type,
            price: item.price ? item.price : "0",
            imageUrl: item.imageUrl || "",
            orderStatus: item.orderStatus || 'pending'
          }));

          // 你的 wxml 里面写了 wx:if 控制显示，所以这里直接塞全量数据就行！
          this.setData({ myList: formattedData });
        }
      },
      fail: (err) => console.error("拉取发布失败：", err)
    });
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
          wx.showLoading({ title: '正在抹除...' });
          wx.request({
            url: `http://localhost:1337/api/posts/${task.documentId}`,
            method: 'DELETE',
            success: (deleteRes) => {
              wx.hideLoading();
              if (deleteRes.statusCode === 200 || deleteRes.statusCode === 204) {
                wx.showToast({ title: '已永久删除', icon: 'success' });
                
                if (!app.globalData.deletedPostIds) app.globalData.deletedPostIds = [];
                app.globalData.deletedPostIds.push(id);
                
                this.fetchMyPublishes(); // 刷新页面
              } else {
                wx.showToast({ title: '删除失败', icon: 'none' });
              }
            }
          });
        }
      }
    });
  },

  appealOrder: function(e) {
    wx.showModal({ title: '订单申诉/售后', editable: true, placeholderText: '请详细描述问题...', confirmColor: '#10b981', success: (res) => { if (res.confirm) { if (!res.content.trim()) return wx.showToast({ title: '理由不能为空', icon: 'none' }); wx.showToast({ title: '已提交', icon: 'success' }); } } });
  }
});