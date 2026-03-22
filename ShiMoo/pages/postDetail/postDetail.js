const app = getApp();

Page({
  data: {
    postInfo: {},
    // 初始的一条假评论，让页面不至于太光秃秃
    comments: [
      { id: 'c1', name: "路人甲同学", content: "蹲一个，看着还不错！", time: "30分钟前", likes: 2 }
    ],
    inputValue: '',
    isLikeAnimating: false,
    isFavAnimating: false
  },

  onLoad: function (options) {
    const id = options.id || 'm1';
    const type = options.type || 'market';
    wx.setNavigationBarTitle({ title: type === 'market' ? '商品详情' : '动态详情' });

    if (app.globalData.currentPostDetail) {
      this.setData({ postInfo: app.globalData.currentPostDetail });
      app.globalData.currentPostDetail = null;
    } else {
      // 兜底数据防白屏
      this.setData({ postInfo: { id: id, type: type, userName: "热心同学", time: "刚刚", content: "今天天气真好！", likeCount:0, isLiked:false, isFavorited:false, commentCount: 1 }});
    }
  },

  // 点赞逻辑 (保持不变)
  toggleLike: function() {
    const newIsLiked = !this.data.postInfo.isLiked;
    this.setData({ 'postInfo.isLiked': newIsLiked, isLikeAnimating: true });
    
    if (app.globalData.globalDiscoveryList) {
      let target = app.globalData.globalDiscoveryList.find(item => item.id === this.data.postInfo.id);
      if (target) {
        target.isLiked = newIsLiked;
        target.likeCount = newIsLiked ? (target.likeCount||0) + 1 : (target.likeCount||0) - 1;
      }
    }
    setTimeout(() => { this.setData({ isLikeAnimating: false }); }, 300);
    wx.vibrateShort({ type: 'light' });
  },

  // 收藏逻辑 (保持不变)
  toggleFavorite: function() {
    const newIsFavorited = !this.data.postInfo.isFavorited;
    this.setData({ 'postInfo.isFavorited': newIsFavorited, isFavAnimating: true });

    if (!app.globalData.favoriteList) app.globalData.favoriteList = [];
    
    if (newIsFavorited) {
      if (!app.globalData.favoriteList.find(item => item.id === this.data.postInfo.id)) {
        app.globalData.favoriteList.unshift(this.data.postInfo);
      }
    } else {
      app.globalData.favoriteList = app.globalData.favoriteList.filter(item => item.id !== this.data.postInfo.id);
    }

    if (app.globalData.globalDiscoveryList) {
      let target = app.globalData.globalDiscoveryList.find(item => item.id === this.data.postInfo.id);
      if (target) target.isFavorited = newIsFavorited;
    }

    setTimeout(() => { this.setData({ isFavAnimating: false }); }, 300);
    wx.showToast({ title: newIsFavorited ? '已收藏' : '已取消收藏', icon: 'none' });
    wx.vibrateShort({ type: 'light' });
  },

  // 监听键盘输入
  onInput: function(e) { 
    this.setData({ inputValue: e.detail.value }); 
  },

  // 🚀 核心：提交评论的完整闭环
  submitComment: function() {
    const content = this.data.inputValue.trim();
    if (!content) {
      return wx.showToast({ title: '评论不能为空哦', icon: 'none' });
    }

    // 1. 获取你在“个人资料”里设置的真实昵称 (如果没设置，兜底叫“我”)
    const myName = app.globalData.userInfo ? app.globalData.userInfo.nickName : "我";

    // 2. 构建新评论的气泡对象
    const newComment = {
      id: 'c' + Date.now(), // 用时间戳保证ID唯一
      name: myName,
      content: content,
      time: "刚刚",
      likes: 0
    };

    // 3. 追加到当前页面的评论列表最上方，并让评论数 +1
    const newComments = [newComment, ...this.data.comments];
    const newCommentCount = (this.data.postInfo.commentCount || 0) + 1;

    this.setData({
      comments: newComments,
      inputValue: '', // 清空输入框
      'postInfo.commentCount': newCommentCount
    });

    // 4. 🚀 跨页面数据同步：让首页和广场的数据也实时 +1！
    if (app.globalData.globalDiscoveryList) {
      let target = app.globalData.globalDiscoveryList.find(item => item.id === this.data.postInfo.id);
      if (target) {
        target.commentCount = newCommentCount;
      }
    }

    wx.showToast({ title: '发送成功', icon: 'success' });
    wx.vibrateShort({ type: 'light' });
  },

  // 🚀 顺手把闲置商品的“买下”按钮也做了！
  buyItem: function() {
    wx.showModal({
      title: '联系卖家',
      content: '确认想要这件宝贝吗？点击“去联系”将自动复制卖家的微信号/手机号。',
      confirmText: '去联系',
      confirmColor: '#10b981',
      success: (res) => {
        if (res.confirm) {
          // 调用微信原生剪贴板能力
          wx.setClipboardData({
            data: this.data.postInfo.phone || 'wechat_123456',
            success: () => {
              wx.showToast({ title: '联系方式已复制', icon: 'success' });
            }
          });
        }
      }
    });
  }
})