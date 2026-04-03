const app = getApp();
const api = require('../../utils/request.js'); // 🚀 引入瑞士军刀

Page({
  data: {
    userInfo: {}
  },

  onLoad: function () {
    this.setData({ 
      userInfo: JSON.parse(JSON.stringify(app.globalData.userInfo)) 
    });
  },

  changeAvatar: function() {
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        wx.showLoading({ title: '上传头像中...', mask: true });

        wx.uploadFile({
          url: `${app.globalData.apiBaseUrl}/api/upload`, 
          filePath: tempFilePath,
          name: 'files',
          success: (uploadRes) => {
            wx.hideLoading();
            console.log("🚀 上传接口返回完整数据：", uploadRes); 

            // 🚀 核心修复：兼容 200 (OK) 和 201 (Created) 两种成功状态码！
            if (uploadRes.statusCode === 200 || uploadRes.statusCode === 201) {
              const data = JSON.parse(uploadRes.data);
              const realUrl = app.globalData.apiBaseUrl + data[0].url;
              this.setData({ 'userInfo.avatarUrl': realUrl });
              wx.showToast({ title: '头像上传成功', icon: 'success' });
            } else {
              console.error("❌ 上传失败，服务器返回：", uploadRes.data); 
              wx.showToast({ title: `上传失败(${uploadRes.statusCode})`, icon: 'none' });
            }
          },
          fail: (err) => { 
            wx.hideLoading(); 
            console.error("❌ 上传彻底断开：", err);
            wx.showToast({ title: '网络异常', icon: 'none' }); 
          }
        });
      }
    });
  },

  onNameInput: function(e) { this.setData({ 'userInfo.nickName': e.detail.value }); },
  onBioInput: function(e) { this.setData({ 'userInfo.bio': e.detail.value }); },
  onPhoneInput: function(e) { this.setData({ 'userInfo.phone': e.detail.value }); },

  saveProfile: function() {
    const { nickName, bio, phone, avatarUrl, documentId } = this.data.userInfo;
    if (!nickName.trim()) return wx.showToast({ title: '昵称不能为空', icon: 'none' });
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) return wx.showToast({ title: '手机号格式有误', icon: 'none' });
    if (!documentId) return wx.showToast({ title: '找不到用户ID', icon: 'none' });

    const updateData = { nickName, bio, phone, avatarUrl };

    api.put(`/api/user-profiles/${documentId}`, { data: updateData }, '保存中...').then(() => {
      app.globalData.userInfo = this.data.userInfo;
      wx.showToast({ title: '修改成功', icon: 'success' });
      setTimeout(() => { wx.navigateBack(); }, 800);
    });
  }
});