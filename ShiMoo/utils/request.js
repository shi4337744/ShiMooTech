// utils/request.js
// 🚀 全局网络请求终极封装！自动处理 Loading、错误拦截、BaseUrl 拼接

const request = (url, method = 'GET', data = {}, showLoading = true, loadingText = '加载中...') => {
  if (showLoading) {
    wx.showLoading({ title: loadingText, mask: true });
  }
  
  return new Promise((resolve, reject) => {
    const app = getApp();
    const baseUrl = app.globalData.apiBaseUrl; // 从全局配置拿 IP
    
    wx.request({
      url: `${baseUrl}${url}`,
      method: method,
      data: data,
      success: (res) => {
        if (showLoading) wx.hideLoading();
        // 成功状态码 (200, 201, 204 等)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          wx.showToast({ title: `请求失败(${res.statusCode})`, icon: 'none' });
          reject(res);
        }
      },
      fail: (err) => {
        if (showLoading) wx.hideLoading();
        wx.showToast({ title: '网络连接失败', icon: 'error' });
        reject(err);
      }
    });
  });
};

// 暴露出极其极简的 API 方法
module.exports = {
  get: (url, data = {}, showLoading = false) => request(url, 'GET', data, showLoading),
  post: (url, data = {}, loadingText = '提交中...') => request(url, 'POST', data, true, loadingText),
  put: (url, data = {}, loadingText = '处理中...') => request(url, 'PUT', data, true, loadingText),
  del: (url, data = {}, loadingText = '删除中...') => request(url, 'DELETE', data, true, loadingText)
};