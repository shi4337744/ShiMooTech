const app = getApp();

Page({
  data: {
    userInfo: {}
  },

  onLoad: function () {
    // 深拷贝一份数据用于编辑，避免没点保存就修改了主页数据
    this.setData({ 
      userInfo: JSON.parse(JSON.stringify(app.globalData.userInfo)) 
    });
  },

  // 更换头像
  changeAvatar: function() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({ 'userInfo.avatarUrl': tempFilePath });
      }
    });
  },

  onNameInput: function(e) { this.setData({ 'userInfo.nickName': e.detail.value }); },
  onBioInput: function(e) { this.setData({ 'userInfo.bio': e.detail.value }); },
  onPhoneInput: function(e) { this.setData({ 'userInfo.phone': e.detail.value }); },

  // 保存数据并同步到全局
  saveProfile: function() {
    const { nickName, phone } = this.data.userInfo;
    if (!nickName.trim()) return wx.showToast({ title: '昵称不能为空', icon: 'none' });
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) return wx.showToast({ title: '手机号格式有误', icon: 'none' });

    wx.showLoading({ title: '保存中...' });
    
    setTimeout(() => {
      app.globalData.userInfo = this.data.userInfo;
      wx.hideLoading();
      wx.showToast({ title: '修改成功', icon: 'success' });
      setTimeout(() => { wx.navigateBack(); }, 800);
    }, 500);
  }
})