// pages/common.js - 存放公共逻辑方法

// 🚀 通用点赞方法大修正
const handleLikeCommon = function(e, pageInstance, listName) {
  // 核心：dataset 捕获修正 (防止被子元素挤压导致 ID/Index 捕获失败)
  const id = e.currentTarget.dataset.id;
  const index = e.currentTarget.dataset.index;
  const list = pageInstance.data[listName];
  const currentItem = list[index];

  if (!currentItem || currentItem.id !== id) return; // 校验防止串单

  const newIsLiked = !currentItem.isLiked;
  const currentLikeCount = currentItem.likeCount || 0; 
  const newLikeCount = newIsLiked ? currentLikeCount + 1 : currentLikeCount - 1;

  // 更新视图
  pageInstance.setData({
    [`${listName}[${index}].isLiked`]: newIsLiked,
    [`${listName}[${index}].likeCount`]: newLikeCount,
    [`${listName}[${index}].isAnimating`]: true
  });

  // 🚀 同步修改全局缓存（如果需要）
  const app = getApp();
  if (app.globalData.globalDiscoveryList) {
    let globalP = app.globalData.globalDiscoveryList.find(g => g.id === id);
    if (globalP) {
      globalP.isLiked = newIsLiked;
      globalP.likeCount = newLikeCount;
    }
  }

  // 小动画后取消
  setTimeout(() => {
    pageInstance.setData({ [`${listName}[${index}].isAnimating`]: false });
  }, 300);
  
  wx.vibrateShort({ type: 'light' });
};

module.exports = {
  handleLikeCommon: handleLikeCommon
};