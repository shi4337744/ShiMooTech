const app = getApp();

Page({
  data: {
    currentTab: 'wall', // 默认显示的频道
    // 1. 校园墙数据
    posts: [
      { userName: "校园小助手", time: "10分钟前", content: "欢迎来到新版校园墙！大家可以在这里分享生活、寻找丢失物品或发起话题。记得带上标签哦 #哈工大日常#", location: "主楼广场", tag: "官方说明", imageUrl: "" }
    ],
    // 2. 跑腿代拿数据
    errandPosts: [
      { userName: "大二学弟", time: "25分钟前", content: "求代取申通快递，就在北门，重约5kg，送到11号楼。", location: "11号楼", price: "8.00", deadline: "19:00", imageUrl: "" }
    ],
    // 3. 闲置市场数据
    marketPosts: [
      { userName: "大四老学长", time: "1小时前", content: "出九成新吉他，附赠调音器和琴包，手感很好，欢迎试琴。", location: "寝室区", price: "299", tradeType: "二手出售", imageUrl: "" }
    ],
    // 4. 校园外卖数据
    foodList: [
      { name: "冒菜西施", score: "4.8", sales: "月售500", price: "15", tag: "麻辣烫", img: "https://via.placeholder.com/100" },
      { name: "一食堂二楼黄焖鸡", score: "4.6", sales: "月售320", price: "12", tag: "快餐", img: "https://via.placeholder.com/100" },
      { name: "后街奶茶店", score: "4.9", sales: "月售800", price: "10", tag: "饮品", img: "https://via.placeholder.com/100" }
    ]
  },

  onShow: function() {
    // 检查是否有发布页传回的新动态
    const newPost = app.globalData.newPost;
    if (newPost) {
      const type = newPost.type;
      if (type === 'wall') {
        this.setData({ posts: [newPost, ...this.data.posts] });
      } else if (type === 'errand') {
        this.setData({ errandPosts: [newPost, ...this.data.errandPosts] });
      } else if (type === 'market') {
        this.setData({ marketPosts: [newPost, ...this.data.marketPosts] });
      }
      // 发布成功后自动切到对应的 Tab
      this.setData({ currentTab: type });
      // 用完即焚，防止重复添加
      app.globalData.newPost = null;
      wx.showToast({ title: '发布成功', icon: 'success' });
    }
  },

  // 顶部 Tab 切换
  switchTab: function(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
    wx.vibrateShort({ type: 'light' });
  },

  // 跳转到发布页
  goToPublish: function() {
    wx.navigateTo({ url: '/pages/publish/publish' });
  },

  // 跳转到外卖店面详情
  goToFoodDetail: function(e) {
    const name = e.currentTarget.dataset.name;
    wx.navigateTo({
      url: `/pages/foodDetail/foodDetail?name=${name}`
    });
  }
})