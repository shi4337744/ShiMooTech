const app = getApp();

Page({
  data: {
    isEdit: false, 
    editId: null,
    textContent: '', locationContent: '', tagContent: '', 
    channels: ['校园墙', '跑腿代拿', '闲置市场'], 
    channelIcons: ['💬', '🏃', '🎁'], 
    channelIndex: 0, postImageUrl: '', 
    price: '', originalPrice: '', condition: '', phone: '', deadline: '', 
    marketTypes: ['二手出售', '闲置租赁'], marketTypeIndex: 0,
    errandTags: [
      { name: '🔥 急单', selected: false },
      { name: '📦 代取件', selected: false },
      { name: '🍔 代买饭', selected: false },
      { name: '📚 占座', selected: false },
      { name: '🏃 其他', selected: false }
    ]
  },

  onLoad: function(options) {
    if (options.id && options.mode === 'edit') {
      const editId = options.id;
      const type = options.type;
      let postData = null;
      
      if (app.globalData.globalDiscoveryList) {
        postData = app.globalData.globalDiscoveryList.find(item => item.id === editId);
      }

      if (postData) {
        let channelIndex = 0;
        if (type === 'errand') channelIndex = 1;
        if (type === 'market') channelIndex = 2;

        this.setData({
          isEdit: true,
          editId: editId,
          channelIndex: channelIndex,
          textContent: postData.content || '',
          postImageUrl: postData.imageUrl || '',
          locationContent: postData.location || '',
          tagContent: postData.tag || '',
          price: postData.price || '',
          originalPrice: postData.originalPrice || '',
          deadline: postData.deadline || '',
          phone: postData.phone || '',
          condition: postData.condition || ''
        });
        wx.setNavigationBarTitle({ title: '编辑我的帖子' });
      }
    }
  },

  onInput: function(e) { this.setData({ textContent: e.detail.value }); },
  onLocationInput: function(e) { this.setData({ locationContent: e.detail.value }); },
  onTagInput: function(e) { this.setData({ tagContent: e.detail.value }); },
  onPriceInput: function(e) { this.setData({ price: e.detail.value }); },
  onOriginalPriceInput: function(e) { this.setData({ originalPrice: e.detail.value }); },
  onConditionInput: function(e) { this.setData({ condition: e.detail.value }); },
  onPhoneInput: function(e) { this.setData({ phone: e.detail.value }); },
  onChannelChange: function(e) { this.setData({ channelIndex: e.detail.value }); },
  onTimeChange: function(e) { this.setData({ deadline: e.detail.value }); },
  onMarketTypeChange: function(e) { this.setData({ marketTypeIndex: e.detail.value }); },

  chooseImage: function() { 
    wx.chooseMedia({ count: 1, mediaType: ['image'], success: (res) => { this.setData({ postImageUrl: res.tempFiles[0].tempFilePath }); } }); 
  },
  deleteImage: function() { this.setData({ postImageUrl: '' }); },

  toggleErrandTag: function(e) {
    if (this.data.isEdit) return; // 编辑模式下简化处理，不改标签
    const index = e.currentTarget.dataset.index;
    let tags = this.data.errandTags;
    let selectedCount = tags.filter(t => t.selected).length;

    if (tags[index].selected) { tags[index].selected = false; } 
    else { if (selectedCount >= 3) return wx.showToast({ title: '最多选3个', icon: 'none' }); tags[index].selected = true; }
    this.setData({ errandTags: tags }); wx.vibrateShort({ type: 'light' }); 
  },

  submitPost: function() {
    const d = this.data;
    if (!d.textContent.trim()) return wx.showToast({ title: '内容不能为空', icon: 'none' });
    const numRegex = /^\d+(\.\d+)?$/; 
    const phoneRegex = /^1[3-9]\d{9}$/;

    // 🚀 这里是你完美的原始逻辑，一点没动！
    let type = ['wall', 'errand', 'market'][d.channelIndex];
    let price = ''; let deadline = ''; let phone = ''; let originalPrice = ''; let condition = ''; let tradeType = ''; let urgent = false; let taskType = '';

    if (type === 'errand') {
      if (d.price && !numRegex.test(d.price)) return wx.showToast({ title: '金额须为数字', icon: 'none' });
      if (d.phone && !phoneRegex.test(d.phone)) return wx.showToast({ title: '请输入正确手机号', icon: 'none' });
      price = d.price || '5.00'; deadline = d.deadline || '尽快'; phone = d.phone || '未留电话';
      
      const tagNames = d.errandTags.filter(t => t.selected).map(t => t.name);
      urgent = tagNames.some(t => t.includes('急单'));
      const pureTags = tagNames.filter(t => !t.includes('急单')).map(t => t.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').trim());
      taskType = pureTags.length > 0 ? pureTags.join('/') : (urgent ? '' : '跑腿任务');
    }

    if (type === 'market') {
      if (d.price && !numRegex.test(d.price)) return wx.showToast({ title: '售价须为数字', icon: 'none' });
      if (d.originalPrice && !numRegex.test(d.originalPrice)) return wx.showToast({ title: '原价须为数字', icon: 'none' });
      price = d.price || '面议'; originalPrice = d.originalPrice || '不详'; condition = d.condition || '二手'; tradeType = d.marketTypes[d.marketTypeIndex];
    }

    // 🚀 构建给 Strapi 的数据包
    const strapiData = {
      userName: "校园测试达人", 
      content: d.textContent,
      type: type,
      location: d.locationContent || "校内",
      imageUrl: d.postImageUrl || "",
      tag: d.tagContent || "",
      price: price === '面议' ? 0 : Number(price),
      originalPrice: originalPrice === '不详' ? 0 : Number(originalPrice),
      condition: condition,
      phone: phone,
      deadline: deadline,
      tradeType: tradeType,
      taskType: taskType,
      urgent: urgent // <--- 那个神奇的布尔值在这！
    };

    wx.showLoading({ title: '正在连接服务器...' });

    // 1. 如果是编辑模式：发送 PUT 请求修改
    if (d.isEdit) {
      const realStrapiId = String(d.editId).replace('real_', '');
      wx.request({
        url: `http://localhost:1337/api/posts/${realStrapiId}`,
        method: 'PUT',
        data: { data: strapiData },
        success: (res) => {
          wx.hideLoading();
          if (res.statusCode === 200) {
            wx.showToast({ title: '修改已保存', icon: 'success' });
            setTimeout(() => { wx.navigateBack(); }, 1000);
          } else {
            wx.showToast({ title: '服务器开小差了', icon: 'none' });
          }
        },
        fail: () => { wx.hideLoading(); wx.showToast({ title: '网络错误', icon: 'error' }); }
      });

    // 2. 如果是新发布模式：发送 POST 请求创建
    } else {
      wx.request({
        url: 'http://localhost:1337/api/posts',
        method: 'POST',
        data: { data: strapiData },
        success: (res) => {
          wx.hideLoading();
          if (res.statusCode === 200 || res.statusCode === 201) {
            
            // 为了保证你其他页面的 "我的发布" 还能正常显示假数据，保留写入本地池的逻辑
            const serverId = res.data.data.id;
            const newPost = { 
              id: 'real_' + serverId, 
              userName: strapiData.userName, time: "刚刚", 
              content: strapiData.content, location: strapiData.location, imageUrl: strapiData.imageUrl, 
              type: type, likeCount: 0, isLiked: false, commentCount: 0, tag: strapiData.tag,
              price: strapiData.price, deadline: strapiData.deadline, phone: strapiData.phone, 
              urgent: strapiData.urgent, taskType: strapiData.taskType,
              originalPrice: strapiData.originalPrice, condition: strapiData.condition, tradeType: strapiData.tradeType
            };
            app.globalData.newPost = newPost;
            if (!app.globalData.globalDiscoveryList) app.globalData.globalDiscoveryList = [];
            app.globalData.globalDiscoveryList = [newPost, ...app.globalData.globalDiscoveryList];
            if (type === 'errand' || type === 'market') {
              newPost.orderStatus = 'pending';
              if (!app.globalData.publishedOrders) app.globalData.publishedOrders = [];
              app.globalData.publishedOrders.unshift(newPost);
            }

            wx.showToast({ title: '发布成功！', icon: 'success' });
            setTimeout(() => { wx.navigateBack(); }, 1000); // 自动退回首页
          } else {
            wx.showToast({ title: '发布被拒绝，请检查权限', icon: 'none' });
          }
        },
        fail: () => { wx.hideLoading(); wx.showToast({ title: '无法连接到服务器', icon: 'error' }); }
      });
    }
  }
})