const app = getApp();

Page({
  data: {
    textContent: '',
    locationContent: '',
    tagContent: '',
    channels: ['校园墙', '跑腿代拿', '闲置市场', '外卖评价'],
    channelIndex: 0,
    postImageUrl: '',
    price: '',
    deadline: '',
    marketTypes: ['二手出售', '闲置租赁'],
    marketTypeIndex: 0
  },

  // 基础输入绑定
  onInput: function(e) { this.setData({ textContent: e.detail.value }); },
  onLocationInput: function(e) { this.setData({ locationContent: e.detail.value }); },
  onTagInput: function(e) { this.setData({ tagContent: e.detail.value }); },
  onPriceInput: function(e) { this.setData({ price: e.detail.value }); },
  onChannelChange: function(e) { this.setData({ channelIndex: e.detail.value }); },

  chooseImage: function() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => { this.setData({ postImageUrl: res.tempFiles[0].tempFilePath }); }
    });
  },

  submitPost: function() {
    const d = this.data;
    if (!d.textContent.trim()) return wx.showToast({ title: '内容不能为空', icon: 'none' });

    // 1. 构建基础对象
    let post = {
      id: Date.now(),
      userName: "同学 " + Math.floor(Math.random()*100),
      time: "刚刚",
      content: d.textContent,
      location: d.locationContent || "校内",
      imageUrl: d.postImageUrl,
      type: ['wall', 'errand', 'market', 'food'][d.channelIndex]
    };

    // 2. 根据频道补充特有字段
    if (post.type === 'wall') post.tag = d.tagContent || "新鲜事";
    if (post.type === 'errand') { post.price = d.price || '5.00'; post.deadline = '尽快'; }
    if (post.type === 'market') { post.price = d.price || '议价'; post.tradeType = d.marketTypes[d.marketTypeIndex]; }
    if (post.type === 'food') { post.tag = "美食点评"; }

    // 3. 核心联动逻辑
    // A. 存入首页中转站
    app.globalData.newPost = post;
    
    // B. 同步到发现页聚合池 (如果 globalDiscoveryList 不存在则初始化)
    if (!app.globalData.globalDiscoveryList) app.globalData.globalDiscoveryList = [];
    app.globalData.globalDiscoveryList = [post, ...app.globalData.globalDiscoveryList];

    wx.showLoading({ title: '发布中' });
    setTimeout(() => {
      wx.hideLoading();
      wx.navigateBack();
    }, 600);
  }
})