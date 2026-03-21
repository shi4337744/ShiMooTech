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

    // 核心校验与数据构建（完全保留你的逻辑）
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

    // 🚀 构建给 Strapi 服务器的数据结构（把前端格式转换成数据库格式）
    const strapiData = {
      userName: "当前用户", // 以后可以接微信登录昵称
      content: d.textContent,
      type: type,
      location: d.locationContent || "校内",
      imageUrl: d.postImageUrl || "",
      tag: d.tagContent || "",
      price: price === '面议' ? 0 : Number(price), // 强转为数字存入数据库
      originalPrice: originalPrice === '不详' ? 0 : Number(originalPrice),
      condition: condition,
      phone: phone,
      deadline: deadline,
      tradeType: tradeType,
      taskType: taskType
    };

    wx.showLoading({ title: '保存中...', mask: true });

    // 1. ================== 如果是编辑模式 ==================
    if (d.isEdit) {
      // 在之前的 index.js 中，真实数据的 ID 前面加了 'real_'，这里需要去掉它才能发给服务器
      const realStrapiId = String(d.editId).replace('real_', '');

      wx.request({
        url: `http://localhost:1337/api/posts/${realStrapiId}`,
        method: 'PUT', // 更新数据用 PUT
        data: { data: strapiData },
        success: (res) => {
          wx.hideLoading();
          if (res.statusCode === 200) {
            // 同步更新本地全局变量（保留你的原始流畅体验）
            if (app.globalData.globalDiscoveryList) {
              let target = app.globalData.globalDiscoveryList.find(item => item.id === d.editId);
              if (target) {
                Object.assign(target, {
                  content: d.textContent, imageUrl: d.postImageUrl, location: d.locationContent,
                  tag: type === 'wall' ? d.tagContent : target.tag,
                  price: price, deadline: deadline, phone: phone,
                  originalPrice: originalPrice, condition: condition, tradeType: tradeType
                });
              }
            }
            wx.showToast({ title: '修改成功', icon: 'success' });
            setTimeout(() => { wx.navigateBack(); }, 1000);
          } else {
            wx.showToast({ title: '服务器错误', icon: 'none' });
          }
        },
        fail: () => { wx.hideLoading(); wx.showToast({ title: '网络连接失败', icon: 'error' }); }
      });

    // 2. ================== 如果是新发布模式 ==================
    } else {
      wx.request({
        url: 'http://localhost:1337/api/posts',
        method: 'POST', // 新增数据用 POST
        data: { data: strapiData },
        success: (res) => {
          wx.hideLoading();
          if (res.statusCode === 200 || res.statusCode === 201) {
            // 获取服务器刚刚生成的新 ID
            const serverId = res.data.data.id;
            
            // 构建本地需要的新帖子对象（依然保留你写入全局变量的逻辑）
            const newPost = { 
              id: 'real_' + serverId, // 用服务器的 ID！
              userName: "我发布的", time: "刚刚", 
              content: d.textContent, location: d.locationContent || "校内", imageUrl: d.postImageUrl, 
              type: type, likeCount: 0, isLiked: false, commentCount: 0, tag: d.tagContent,
              price: price, deadline: deadline, phone: phone, urgent: urgent, taskType: taskType,
              originalPrice: originalPrice, condition: condition, tradeType: tradeType
            };

            app.globalData.newPost = newPost;
            if (!app.globalData.globalDiscoveryList) app.globalData.globalDiscoveryList = [];
            app.globalData.globalDiscoveryList = [newPost, ...app.globalData.globalDiscoveryList];

            if (type === 'errand' || type === 'market') {
              newPost.orderStatus = 'pending';
              if (!app.globalData.publishedOrders) app.globalData.publishedOrders = [];
              app.globalData.publishedOrders.unshift(newPost);
            }

            wx.showToast({ title: '发布成功', icon: 'success' });
            setTimeout(() => { wx.navigateBack(); }, 1000);
          } else {
            wx.showToast({ title: '发布失败(403)', icon: 'none' });
          }
        },
        fail: () => { wx.hideLoading(); wx.showToast({ title: '网络连接失败', icon: 'error' }); }
      });
    }
  }
})