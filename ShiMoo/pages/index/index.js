const app = getApp();

Page({
  data: {
    currentTab: 'wall', // 保持你原来的字符串控制逻辑，修复无法切换的问题
    posts: [
      { id: 'w1', userName: "校园小助手", time: "10分钟前", content: "欢迎来到新版校园墙！大家可以在这里分享生活、寻找丢失物品或发起话题。记得带上标签哦 #哈工大日常#", location: "主楼广场", tag: "官方说明", imageUrl: "", likeCount: 23, isLiked: false, commentCount: 5 }
    ],
    errandPosts: [
      { id: 'e1', userName: "大二学弟", time: "25分钟前", content: "求代取申通快递，重约5kg，有点大需要小推车或者电瓶车，送到11号楼楼下。", location: "11号楼", price: "8.00", deadline: "19:00", urgent: true, taskType: "代取件", phone: "13800138000" },
      { id: 'e2', userName: "考研党", time: "1小时前", content: "帮忙去图书馆占个座，二楼靠窗有插座的位子，必有重谢！", location: "图书馆主馆", price: "15.00", deadline: "明天 07:30", urgent: false, taskType: "占座", phone: "13912345678" }
    ],
    marketPosts: [
      { id: 'm1', userName: "大四老学长", time: "1小时前", content: "出九成新吉他，附赠调音器和琴包，手感很好，欢迎试琴。", price: "299", originalPrice: "899", tradeType: "二手出售", condition: "9成新", likes: 12, isLiked: false, commentCount: 3, imageUrl: "https://via.placeholder.com/300x350/fca5a5/fff?text=Guitar" },
      { id: 'm2', userName: "设计系学姐", time: "3小时前", content: "出一套马克笔，几乎没怎么用过，颜色全，带收纳盒。", price: "45", originalPrice: "120", tradeType: "低价转让", condition: "几乎全新", likes: 34, isLiked: true, commentCount: 15, imageUrl: "https://via.placeholder.com/300x300/60a5fa/fff?text=Markers" },
      { id: 'm3', userName: "数码控", time: "5小时前", content: "出一台闲置的显示器，27寸2K，完美屏无坏点。", price: "450", originalPrice: "1299", tradeType: "数码闲置", condition: "功能完好", likes: 8, isLiked: false, commentCount: 0, imageUrl: "https://via.placeholder.com/300x400/34d399/fff?text=Monitor" }
    ],
    foodList: [
      { name: "冒菜西施", score: "4.8", sales: "月售500", price: "15", tag: "麻辣烫", img: "https://via.placeholder.com/100" },
      { name: "一食堂二楼黄焖鸡", score: "4.6", sales: "月售320", price: "12", tag: "快餐", img: "https://via.placeholder.com/100" }
    ]
  },

  onShow: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) { this.getTabBar().setData({ selected: 0 }); }
    
    // ============ 🚀 新增：每次显示页面去拉取真实数据 ============
    this.fetchRealData();
    // ==========================================================

    const newPost = app.globalData.newPost;
    if (newPost) {
      if (newPost.type === 'wall') this.setData({ posts: [newPost, ...this.data.posts] });
      else if (newPost.type === 'errand') this.setData({ errandPosts: [newPost, ...this.data.errandPosts] });
      else if (newPost.type === 'market') this.setData({ marketPosts: [newPost, ...this.data.marketPosts] });
      this.setData({ currentTab: newPost.type });
      app.globalData.newPost = null;
    }

    let currentPosts = this.data.posts;
    let currentMarket = this.data.marketPosts;
    
    if (app.globalData.globalDiscoveryList) {
      currentPosts.forEach(p => {
        let globalP = app.globalData.globalDiscoveryList.find(g => g.id === p.id);
        if (globalP) { p.content = globalP.content; p.imageUrl = globalP.imageUrl; p.tag = globalP.tag; }
      });
      currentMarket.forEach(m => {
        let globalM = app.globalData.globalDiscoveryList.find(g => g.id === m.id);
        if (globalM) { m.price = globalM.price; m.condition = globalM.condition; m.tradeType = globalM.tradeType; }
      });
    }

    const deletedIds = app.globalData.deletedPostIds || [];
    this.setData({
      posts: currentPosts.filter(item => !deletedIds.includes(item.id)),
      errandPosts: this.data.errandPosts.filter(item => !deletedIds.includes(item.id)),
      marketPosts: currentMarket.filter(item => !deletedIds.includes(item.id))
    });
  },

  // ================= 🚀 新增的核心网络请求逻辑 =================
  fetchRealData: function() {
    wx.request({
      url: 'http://localhost:1337/api/posts', 
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.data) {
          const rawData = res.data.data;
          
          // 1. 将后端的真实数据，包装成你的页面认识的格式，补齐 UI 需要的默认字段
          const formattedRealData = rawData.map(item => {
            return {
              id: 'real_' + item.id, // 加个前缀，防止和假数据的 ID 冲突
              userName: item.userName || "神秘用户",
              time: "刚刚", 
              content: item.content || "",
              type: item.type,
              price: item.price ? item.price : "0",
              // 下面这些是给 UI 占位的默认值，防止页面报错
              likeCount: 0, likes: 0, isLiked: false, commentCount: 0,
              location: "校园内", imageUrl: "", tag: "最新", urgent: false, 
              taskType: "其他", originalPrice: "", condition: "全新", tradeType: "个人闲置"
            };
          });

          // 2. 按类型分类
          const realWall = formattedRealData.filter(p => p.type === 'wall');
          const realErrand = formattedRealData.filter(p => p.type === 'errand');
          const realMarket = formattedRealData.filter(p => p.type === 'market');

          // 3. 把旧的假数据提取出来（过滤掉之前拉取的 real_ 数据，防止重复叠加）
          const oldFakeWall = this.data.posts.filter(p => !String(p.id).startsWith('real_'));
          const oldFakeErrand = this.data.errandPosts.filter(p => !String(p.id).startsWith('real_'));
          const oldFakeMarket = this.data.marketPosts.filter(p => !String(p.id).startsWith('real_'));

          // 4. 将【真实数据】放在最上面，【假数据】垫底！完美融合！
          this.setData({
            posts: [...realWall, ...oldFakeWall],
            errandPosts: [...realErrand, ...oldFakeErrand],
            marketPosts: [...realMarket, ...oldFakeMarket]
          });
        }
      },
      fail: (err) => {
        console.error("连接真实后端失败：", err);
      }
    });
  },
  // ===========================================================

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

    wx.showModal({
      title: '接单确认',
      content: '确定要接下这个跑腿任务吗？',
      confirmColor: '#3b82f6',
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

          let currentTasks = this.data.errandPosts;
          currentTasks.splice(index, 1);
          this.setData({ errandPosts: currentTasks });

          wx.showToast({ title: '接单成功！', icon: 'success' });
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
    wx.showModal({
      title: '删除确认', content: '确定要删除这条动态吗？', confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          if (!app.globalData.deletedPostIds) app.globalData.deletedPostIds = [];
          app.globalData.deletedPostIds.push(id);
          this.setData({ posts: this.data.posts.filter(item => item.id !== id) });
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  }
});