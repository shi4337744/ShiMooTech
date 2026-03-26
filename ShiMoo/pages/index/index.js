const app = getApp();
const api = require('../../utils/request.js');

Page({
  data: {
    currentTab: 'wall', 
    posts: [], errandPosts: [], marketPosts: [],
    foodList: [
      { name: "冒菜西施", score: "4.8", sales: "月售500", price: "15", tag: "麻辣烫", img: "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0" },
      { name: "一食堂二楼黄焖鸡", score: "4.6", sales: "月售320", price: "12", tag: "快餐", img: "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0" }
    ]
  },

  onShow: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) { this.getTabBar().setData({ selected: 0 }); }
    this.fetchRealData(); 

    const newPost = app.globalData.newPost;
    if (newPost) {
      if (newPost.type === 'wall') this.setData({ posts: [newPost, ...this.data.posts] });
      else if (newPost.type === 'errand') this.setData({ errandPosts: [newPost, ...this.data.errandPosts] });
      else if (newPost.type === 'market') this.setData({ marketPosts: [newPost, ...this.data.marketPosts] });
      this.setData({ currentTab: newPost.type });
      app.globalData.newPost = null;
    }

    const deletedIds = app.globalData.deletedPostIds || [];
    this.setData({
      posts: this.data.posts.filter(item => !deletedIds.includes(item.id)),
      errandPosts: this.data.errandPosts.filter(item => !deletedIds.includes(item.id)),
      marketPosts: this.data.marketPosts.filter(item => !deletedIds.includes(item.id))
    });
  },

  fetchRealData: function() {
    api.get('/api/posts').then(res => {
      if (res && res.data) {
        const rawData = res.data;
        // 🚀 核心：获取你真实的微信 UID（身份证号）
        const myUid = app.globalData.userInfo ? app.globalData.userInfo.uid : '';

        const formattedRealData = rawData.map(item => ({
          id: 'real_' + item.id, documentId: item.documentId, userName: item.userName || "神秘用户",
          time: "刚刚", content: item.content || "", type: item.type, price: item.price ? item.price : "0",
          location: item.location || "未填写", deadline: item.deadline || "尽快", imageUrl: item.imageUrl || "", 
          tag: item.tag || "", urgent: item.urgent || false, taskType: item.taskType || "", 
          originalPrice: item.originalPrice || "", condition: item.condition || "全新", tradeType: item.tradeType || "个人闲置",
          phone: item.phone || "", orderStatus: item.orderStatus || 'pending', 
          likeCount: item.likeCount || 0, likes: item.likes || 0, commentCount: item.commentCount || 0,
          // 🚀 后端真实校验：查查花名册里有没有你！
          likedUsers: item.likedUsers || [],
          isLiked: item.likedUsers ? item.likedUsers.includes(myUid) : false
        }));

        const deletedIds = app.globalData.deletedPostIds || [];
        const realWall = formattedRealData.filter(p => p.type === 'wall' && !deletedIds.includes(p.id));
        const realErrand = formattedRealData.filter(p => p.type === 'errand' && p.orderStatus !== 'processing' && p.orderStatus !== 'completed' && p.orderStatus !== 'delivered' && !deletedIds.includes(p.id));
        const realMarket = formattedRealData.filter(p => p.type === 'market' && !deletedIds.includes(p.id));

        this.setData({
          posts: realWall.reverse(),
          errandPosts: realErrand.reverse(),
          marketPosts: realMarket.reverse()
        });
      }
    }).catch(err => console.error("拉取失败", err));
  },

  switchTab: function(e) { this.setData({ currentTab: e.currentTarget.dataset.tab }); wx.vibrateShort({ type: 'light' }); },

  handleLike: function(e) {
    const id = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    const listName = e.currentTarget.dataset.list || 'posts';
    const list = this.data[listName];
    const currentItem = list[index];

    if (!currentItem || currentItem.id !== id) return;

    // 🚀 安全拦截：必须登录才能点赞
    const myUid = app.globalData.userInfo ? app.globalData.userInfo.uid : '';
    if (!myUid) return wx.showToast({ title: '请先登录', icon: 'none' });

    const newIsLiked = !currentItem.isLiked;
    const countField = listName === 'marketPosts' ? 'likes' : 'likeCount';
    const currentLikeCount = currentItem[countField] || 0; 
    const newLikeCount = newIsLiked ? currentLikeCount + 1 : currentLikeCount - 1;

    // 🚀 更新花名册：把你的 UID 写入或移除
    let likedUsers = currentItem.likedUsers || [];
    if (newIsLiked) {
      if (!likedUsers.includes(myUid)) likedUsers.push(myUid);
    } else {
      likedUsers = likedUsers.filter(uid => uid !== myUid);
    }

    this.setData({
      [`${listName}[${index}].isLiked`]: newIsLiked,
      [`${listName}[${index}].${countField}`]: newLikeCount,
      [`${listName}[${index}].likedUsers`]: likedUsers,
      [`${listName}[${index}].isAnimating`]: true
    });

    if (currentItem.documentId) {
      const updateData = {};
      updateData[countField] = newLikeCount;
      if (countField === 'likes') updateData['likeCount'] = newLikeCount;
      updateData['likedUsers'] = likedUsers; // 🚀 提交给服务器永久保存
      api.put(`/api/posts/${currentItem.documentId}`, { data: updateData }, false);
    }

    setTimeout(() => { this.setData({ [`${listName}[${index}].isAnimating`]: false }); }, 300);
    wx.vibrateShort({ type: 'light' });
  },

  goToPublish: function() { wx.navigateTo({ url: '/pages/publish/publish' }); },
  goToSearch: function() { wx.navigateTo({ url: '/pages/search/search' }); },
  goToTask: function() { wx.navigateTo({ url: '/pages/task/task' }); },
  goToMarket: function() { wx.navigateTo({ url: '/pages/market/market' }); },
  goToDiscover: function() { wx.switchTab({ url: '/pages/discover/discover' }); },
  
  // 🚀 核心防白屏修复：暴力扫描，绝对匹配
  goToDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    // 强制转换为字符串，无视 WXML 传过来的错乱类型，三大板块暴力搜！
    let currentItem = this.data.posts.find(item => String(item.id) === String(id)) || 
                      this.data.errandPosts.find(item => String(item.id) === String(id)) || 
                      this.data.marketPosts.find(item => String(item.id) === String(id));
    
    if (currentItem) {
      app.globalData.currentPostDetail = currentItem;
      // 用搜出来的真实 type，防止前端传错
      wx.navigateTo({ url: `/pages/postDetail/postDetail?id=${id}&type=${currentItem.type}` });
    } else {
      wx.showToast({ title: '帖子解析失败', icon: 'none' });
    }
  },
  
  goToFoodDetail: function(e) { wx.navigateTo({ url: `/pages/foodDetail/foodDetail?name=${e.currentTarget.dataset.name}` }); },

  takeOrder: function(e) {
    const index = e.currentTarget.dataset.index;
    const task = this.data.errandPosts[index];
    if (!task.documentId) return wx.showToast({ title: '无法接单，缺少真实ID', icon: 'none' });

    wx.showModal({
      title: '接单确认', content: '确定要接下这个跑腿任务吗？', confirmColor: '#3b82f6',
      success: (res) => {
        if (res.confirm) {
          const myName = app.globalData.userInfo ? app.globalData.userInfo.nickName : '微信新用户';
          api.put(`/api/posts/${task.documentId}`, { data: { orderStatus: 'processing', accepterName: myName } }, '正在抢单...')
            .then(() => {
              wx.showToast({ title: '接单成功！', icon: 'success' });
              this.fetchRealData();
            });
        }
      }
    });
  },

  editPost: function(e) { wx.navigateTo({ url: `/pages/publish/publish?id=${e.currentTarget.dataset.id}&type=wall&mode=edit` }); },

  deletePost: function(e) {
    const id = e.currentTarget.dataset.id;
    let task = this.data.posts.find(item => item.id === id) || this.data.errandPosts.find(item => item.id === id) || this.data.marketPosts.find(item => item.id === id);
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
              this.fetchRealData();
            });
        }
      }
    });
  }
});