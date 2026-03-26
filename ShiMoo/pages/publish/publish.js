const app = getApp();
const api = require('../../utils/request.js'); 

Page({
  data: {
    isEdit: false, editId: null, editDocumentId: null,
    textContent: '', locationContent: '', tagContent: '',
    channels: ['校园墙', '跑腿代拿', '闲置市场'], channelIcons: ['💬', '🏃', '🎁'], channelIndex: 0,
    postImageUrl: '', price: '', originalPrice: '', condition: '', phone: '', deadline: '',
    marketTypes: ['二手出售', '闲置租赁'], marketTypeIndex: 0,
    errandTags: [
      { name: '🔥 急单', selected: false }, { name: '📦 代取件', selected: false },
      { name: '🍔 代买饭', selected: false }, { name: '📚 占座', selected: false }, { name: '🏃 其他', selected: false }
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
          isEdit: true, editId: editId, editDocumentId: postData.documentId || null,
          channelIndex: channelIndex, textContent: postData.content || '', postImageUrl: postData.imageUrl || '',
          locationContent: postData.location || '', tagContent: postData.tag || '', price: postData.price || '',
          originalPrice: postData.originalPrice || '', deadline: postData.deadline || '',
          phone: postData.phone || '', condition: postData.condition || ''
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

  // 🚀 核心修复：发帖选图片时，直接上传到服务器并换取真实 URL！
  chooseImage: function() {
    wx.chooseMedia({
      count: 1, mediaType: ['image'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        wx.showLoading({ title: '图片上传中...', mask: true });

        wx.uploadFile({
          url: `${app.globalData.apiBaseUrl}/api/upload`,
          filePath: tempFilePath,
          name: 'files',
          success: (uploadRes) => {
            wx.hideLoading();
            if (uploadRes.statusCode === 200 || uploadRes.statusCode === 201) {
              const data = JSON.parse(uploadRes.data);
              const realUrl = app.globalData.apiBaseUrl + data[0].url;
              // 把真正能在全网访问的 URL 存进变量
              this.setData({ postImageUrl: realUrl }); 
              wx.showToast({ title: '图片就绪', icon: 'success' });
            } else {
              wx.showToast({ title: '图片上传失败', icon: 'none' });
            }
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: '网络异常', icon: 'error' });
          }
        });
      }
    });
  },

  deleteImage: function() { this.setData({ postImageUrl: '' }); },

  toggleErrandTag: function(e) {
    if (this.data.isEdit) return;
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

    const myName = app.globalData.userInfo ? app.globalData.userInfo.nickName : '校园小萌新';

    const strapiData = {
      userName: myName, 
      content: d.textContent, type: type, location: d.locationContent || "校内",
      imageUrl: d.postImageUrl || "", // 此时提交的，绝对是真实的服务器网络图片！
      tag: d.tagContent || "", price: price === '面议' ? 0 : Number(price),
      originalPrice: originalPrice === '不详' ? 0 : Number(originalPrice), condition: condition, phone: phone,
      deadline: deadline, tradeType: tradeType, taskType: taskType
    };

    if (d.isEdit) {
      const targetId = d.editDocumentId;
      if (!targetId) return wx.showToast({ title: '找不到真实ID', icon: 'none' });

      api.put(`/api/posts/${targetId}`, { data: strapiData }, '保存中...').then(() => {
        if (app.globalData.globalDiscoveryList) {
          let target = app.globalData.globalDiscoveryList.find(item => item.id === d.editId);
          if (target) {
            Object.assign(target, {
              content: d.textContent, imageUrl: d.postImageUrl, location: d.locationContent,
              tag: type === 'wall' ? d.tagContent : target.tag, price: price, deadline: deadline, phone: phone,
              originalPrice: originalPrice, condition: condition, tradeType: tradeType
            });
          }
        }
        wx.showToast({ title: '修改成功', icon: 'success' });
        setTimeout(() => { wx.navigateBack(); }, 1000);
      });
    } else {
      api.post('/api/posts', { data: strapiData }, '发布中...').then(res => {
        const serverId = res.data.id;
        const serverDocumentId = res.data.documentId;
        const newPost = {
          id: 'real_' + serverId, documentId: serverDocumentId, userName: myName, time: "刚刚",
          content: d.textContent, location: d.locationContent || "校内", imageUrl: d.postImageUrl,
          type: type, likeCount: 0, isLiked: false, commentCount: 0, tag: d.tagContent,
          price: price, deadline: deadline, phone: phone, urgent: urgent, taskType: taskType,
          originalPrice: originalPrice, condition: condition, tradeType: tradeType, orderStatus: 'pending'
        };

        app.globalData.newPost = newPost;
        if (!app.globalData.globalDiscoveryList) app.globalData.globalDiscoveryList = [];
        app.globalData.globalDiscoveryList = [newPost, ...app.globalData.globalDiscoveryList];

        if (type === 'errand' || type === 'market') {
          if (!app.globalData.publishedOrders) app.globalData.publishedOrders = [];
          app.globalData.publishedOrders.unshift(newPost);
        }

        wx.showToast({ title: '发布成功', icon: 'success' });
        setTimeout(() => { wx.navigateBack(); }, 1000);
      });
    }
  }
});