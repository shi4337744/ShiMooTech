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
  },

  fetchRealData: function() {
    api.get('/api/posts').then(res => {
      if (res && res.data) {
        const rawData = res.data;
        
        // 取出你的最新资料
        const myInfo = app.globalData.userInfo || {};
        const myUid = myInfo.uid || '';
        const myName = myInfo.nickName || '';
        const myAvatar = myInfo.avatarUrl || '';

        const formattedRealData = rawData.map(item => {
          // 🚀 核心魔术：如果这个帖子查出来是你发的，强制换上你最新的名字和头像！
          let displayUserName = item.userName || "神秘用户";
          let displayAvatar = item.authorAvatar || "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0";
          
          if (myUid && item.authorUid === myUid) {
            displayUserName = myName; // 强制同步最新名字
            displayAvatar = myAvatar; // 强制同步最新头像
          }

          return {
            id: 'real_' + item.id, documentId: item.documentId, 
            userName: displayUserName, // 应用魔术结果
            authorAvatar: displayAvatar, // 应用魔术结果
            time: "刚刚", content: item.content || "", type: item.type, price: item.price ? item.price : "0",
            location: item.location || "未填写", deadline: item.deadline || "尽快", imageUrl: item.imageUrl || "", 
            tag: item.tag || "", urgent: item.urgent || false, taskType: item.taskType || "", 
            originalPrice: item.originalPrice || "", condition: item.condition || "全新", tradeType: item.tradeType || "个人闲置",
            phone: item.phone || "", orderStatus: item.orderStatus || 'pending', 
            likeCount: item.likeCount || 0, likes: item.likes || 0, commentCount: item.commentCount || 0,
            likedUsers: item.likedUsers || [],
            isLiked: item.likedUsers ? item.likedUsers.includes(myUid) : false,
            commentsList: item.commentsList || [] // 把评论也取出来
          }
        });

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

    const myUid = app.globalData.userInfo ? app.globalData.userInfo.uid : '';
    if (!myUid) return wx.showToast({ title: '请先登录', icon: 'none' });

    const newIsLiked = !currentItem.isLiked;
    const countField = listName === 'marketPosts' ? 'likes' : 'likeCount';
    const currentLikeCount = currentItem[countField] || 0; 
    const newLikeCount = newIsLiked ? currentLikeCount + 1 : currentLikeCount - 1;

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
      updateData['likedUsers'] = likedUsers; 
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
  
  goToDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    let currentItem = this.data.posts.find(item => String(item.id) === String(id)) || 
                      this.data.errandPosts.find(item => String(item.id) === String(id)) || 
                      this.data.marketPosts.find(item => String(item.id) === String(id));
    
    if (currentItem) {
      app.globalData.currentPostDetail = currentItem;
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
          api.put(`/api/posts/${task.documentId}`, { data: { orderStatus: 'processing', accepterName: myName } }, '正在抢单...').then(() => {
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
          api.del(`/api/posts/${task.documentId}`, {}, '正在抹除...').then(() => {
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