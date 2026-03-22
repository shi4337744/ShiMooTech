const app = getApp();

Page({
  data: {
    currentTab: 'wall', 
    posts: [
      { id: 'w1', userName: "校园小助手", time: "10分钟前", content: "欢迎来到新版校园墙！大家可以在这里分享生活、寻找丢失物品或发起话题。记得带上标签哦 #哈工大日常#", location: "主楼广场", tag: "官方说明", imageUrl: "", likeCount: 23, isLiked: false, commentCount: 5 }
    ],
    errandPosts: [
      { id: 'e1', userName: "大二学弟", time: "25分钟前", content: "求代取申通快递，重约5kg，有点大需要小推车或者电瓶车，送到11号楼楼下。", location: "11号楼", price: "8.00", deadline: "19:00", urgent: true, taskType: "代取件", phone: "13800138000" },
      { id: 'e2', userName: "考研党", time: "1小时前", content: "帮忙去图书馆占个座，二楼靠窗有插座的位子，必有重谢！", location: "图书馆主馆", price: "15.00", deadline: "明天 07:30", urgent: false, taskType: "占座", phone: "13912345678" }
    ],
    marketPosts: [
      { id: 'm1', userName: "大四老学长", time: "1小时前", content: "出九成新吉他，附赠调音器和琴包，手感很好，欢迎试琴。", price: "299", originalPrice: "899", tradeType: "二手出售", condition: "9成新", likes: 12, isLiked: false, commentCount: 3, imageUrl: "https://via.placeholder.com/300x350/fca5a5/fff?text=Guitar" }
    ],
    foodList: [
      { name: "冒菜西施", score: "4.8", sales: "月售500", price: "15", tag: "麻辣烫", img: "https://via.placeholder.com/100" },
      { name: "一食堂二楼黄焖鸡", score: "4.6", sales: "月售320", price: "12", tag: "快餐", img: "https://via.placeholder.com/100" }
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

    // 保底机制：清理本地旧数组里的已删数据
    const deletedIds = app.globalData.deletedPostIds || [];
    this.setData({
      posts: this.data.posts.filter(item => !deletedIds.includes(item.id)),
      errandPosts: this.data.errandPosts.filter(item => !deletedIds.includes(item.id)),
      marketPosts: this.data.marketPosts.filter(item => !deletedIds.includes(item.id))
    });
  },

  fetchRealData: function() {
    wx.request({
      url: 'http://localhost:1337/api/posts', 
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.data) {
          const rawData = res.data.data;
          
          const formattedRealData = rawData.map(item => {
            return {
              id: 'real_' + item.id, 
              documentId: item.documentId, 
              userName: item.userName || "神秘用户",
              time: "刚刚", 
              content: item.content || "",
              type: item.type,
              price: item.price ? item.price : "0",
              location: item.location || "未填写", 
              deadline: item.deadline || "尽快",
              imageUrl: item.imageUrl || "", 
              tag: item.tag || "", 
              urgent: item.urgent || false, 
              taskType: item.taskType || "", 
              originalPrice: item.originalPrice || "", 
              condition: item.condition || "全新", 
              tradeType: item.tradeType || "个人闲置",
              phone: item.phone || "",
              orderStatus: item.orderStatus || 'pending', 
              likeCount: 0, likes: 0, isLiked: false, commentCount: 0
            };
          });

          // 🚀 核心修复：拿到后端数据后，强行使用黑名单进行拦截！
          const deletedIds = app.globalData.deletedPostIds || [];

          const realWall = formattedRealData.filter(p => p.type === 'wall' && !deletedIds.includes(p.id));
          const realErrand = formattedRealData.filter(p => p.type === 'errand' && p.orderStatus !== 'processing' && p.orderStatus !== 'completed' && !deletedIds.includes(p.id));
          const realMarket = formattedRealData.filter(p => p.type === 'market' && !deletedIds.includes(p.id));

          const oldFakeWall = this.data.posts.filter(p => !String(p.id).startsWith('real_'));
          const oldFakeErrand = this.data.errandPosts.filter(p => !String(p.id).startsWith('real_'));
          const oldFakeMarket = this.data.marketPosts.filter(p => !String(p.id).startsWith('real_'));

          this.setData({
            posts: [...realWall, ...oldFakeWall],
            errandPosts: [...realErrand, ...oldFakeErrand],
            marketPosts: [...realMarket, ...oldFakeMarket]
          });
        }
      },
      fail: (err) => console.error("连接真实后端失败：", err)
    });
  },

  switchTab: function(e) { this.setData({ currentTab: e.currentTarget.dataset.tab }); wx.vibrateShort({ type: 'light' }); },

  handleLike: function(e) {
    const id = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    const listName = e.currentTarget.dataset.list || 'posts';
    const list = this.data[listName];
    const currentItem = list[index];

    if (!currentItem || currentItem.id !== id) return;

    const newIsLiked = !currentItem.isLiked;
    const countField = listName === 'marketPosts' ? 'likes' : 'likeCount';
    const currentLikeCount = currentItem[countField] || 0; 
    const newLikeCount = newIsLiked ? currentLikeCount + 1 : currentLikeCount - 1;

    this.setData({
      [`${listName}[${index}].isLiked`]: newIsLiked,
      [`${listName}[${index}].${countField}`]: newLikeCount,
      [`${listName}[${index}].isAnimating`]: true
    });

    if (app.globalData.globalDiscoveryList) {
      let globalP = app.globalData.globalDiscoveryList.find(g => g.id === id);
      if (globalP) { globalP.isLiked = newIsLiked; globalP.likeCount = newLikeCount; }
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
    const type = e.currentTarget.dataset.type;
    let currentItem = null;
    if (type === 'wall') currentItem = this.data.posts.find(item => item.id === id);
    else if (type === 'market') currentItem = this.data.marketPosts.find(item => item.id === id);
    if (currentItem) app.globalData.currentPostDetail = currentItem;
    wx.navigateTo({ url: `/pages/postDetail/postDetail?id=${id}&type=${type}` });
  },

  goToFoodDetail: function(e) { wx.navigateTo({ url: `/pages/foodDetail/foodDetail?name=${e.currentTarget.dataset.name}` }); },

  takeOrder: function(e) {
    const index = e.currentTarget.dataset.index;
    const task = this.data.errandPosts[index];
    
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

                let currentTasks = this.data.errandPosts;
                currentTasks.splice(index, 1);
                this.setData({ errandPosts: currentTasks });
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

  editPost: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/publish/publish?id=${id}&type=wall&mode=edit` });
  },

  deletePost: function(e) {
    const id = e.currentTarget.dataset.id;
    
    let task = this.data.posts.find(item => item.id === id) || 
               this.data.errandPosts.find(item => item.id === id) || 
               this.data.marketPosts.find(item => item.id === id);
               
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
                  posts: this.data.posts.filter(item => item.id !== id),
                  errandPosts: this.data.errandPosts.filter(item => item.id !== id),
                  marketPosts: this.data.marketPosts.filter(item => item.id !== id)
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