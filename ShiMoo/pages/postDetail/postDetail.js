const app = getApp();
const api = require('../../utils/request.js');

Page({
  data: {
    postInfo: {}, 
    inputValue: '', 
    isLikeAnimating: false,
    isFavAnimating: false,
    comments: [] // 🚀 清空假数据，全靠数据库拉取真实数据！
  },

  onLoad: function(options) {
    if (app.globalData.currentPostDetail) {
      let currentPost = app.globalData.currentPostDetail;
      this.setData({ 
        postInfo: currentPost,
        // 🚀 核心修复：加载时，直接把数据库里的评论列表取出来！
        comments: currentPost.commentsList || [] 
      });
      this.checkFavoriteStatus();
    }
  },

  checkFavoriteStatus: function() {
    const favList = wx.getStorageSync('myFavorites') || [];
    const isFav = favList.some(item => item.documentId === this.data.postInfo.documentId);
    this.setData({ 'postInfo.isFavorited': isFav });
  },

  toggleLike: function() { 
    let currentPost = this.data.postInfo;
    if (!currentPost) return;

    const myUid = app.globalData.userInfo ? app.globalData.userInfo.uid : '';
    if (!myUid) return wx.showToast({ title: '请先登录', icon: 'none' });

    const newIsLiked = !currentPost.isLiked;
    const currentCount = currentPost.likeCount || currentPost.likes || 0;
    const newCount = newIsLiked ? currentCount + 1 : currentCount - 1;

    let likedUsers = currentPost.likedUsers || [];
    if (newIsLiked) {
      if (!likedUsers.includes(myUid)) likedUsers.push(myUid);
    } else {
      likedUsers = likedUsers.filter(uid => uid !== myUid);
    }

    currentPost.isLiked = newIsLiked;
    currentPost.likeCount = newCount;
    currentPost.likes = newCount;
    currentPost.likedUsers = likedUsers;

    this.setData({ postInfo: currentPost, isLikeAnimating: true });
    setTimeout(() => { this.setData({ isLikeAnimating: false }); }, 300);
    wx.vibrateShort({ type: 'light' });

    if (currentPost.documentId) {
      api.put(`/api/posts/${currentPost.documentId}`, {
        data: { likeCount: newCount, likes: newCount, likedUsers: likedUsers }
      }, false);
    }
  },

  toggleFavorite: function() { 
    let currentPost = this.data.postInfo;
    if (!currentPost) return;

    const newIsFav = !currentPost.isFavorited;
    currentPost.isFavorited = newIsFav;
    this.setData({ postInfo: currentPost, isFavAnimating: true });

    let favList = wx.getStorageSync('myFavorites') || [];
    if (newIsFav) {
      favList.unshift(currentPost);
      wx.showToast({ title: '已收藏', icon: 'success' });
    } else {
      favList = favList.filter(item => item.documentId !== currentPost.documentId);
      wx.showToast({ title: '已取消', icon: 'none' });
    }
    
    wx.setStorageSync('myFavorites', favList); 
    app.globalData.favoriteList = favList; 
    setTimeout(() => { this.setData({ isFavAnimating: false }); }, 300);
    wx.vibrateShort({ type: 'light' });
  },

  onInput: function(e) { this.setData({ inputValue: e.detail.value }); },

  submitComment: function() {
    if (!this.data.inputValue.trim()) return wx.showToast({ title: '评论不能全是空格', icon: 'none' });

    let currentPost = this.data.postInfo;
    let myInfo = app.globalData.userInfo || { nickName: '微信新用户', avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0' };

    const newComment = {
      id: Date.now(),
      name: myInfo.nickName,
      avatarUrl: myInfo.avatarUrl,
      likes: 0,
      content: this.data.inputValue,
      time: "刚刚"
    };

    const newCommentCount = (currentPost.commentCount || 0) + 1;
    currentPost.commentCount = newCommentCount;
    
    // 🚀 核心修复：生成新的评论列表
    const newCommentsList = [newComment, ...this.data.comments];
    currentPost.commentsList = newCommentsList;

    this.setData({
      postInfo: currentPost,
      comments: newCommentsList,
      inputValue: '' 
    });

    if (currentPost.documentId) {
      // 🚀 核心修复：把评论列表完整打包发送给 Strapi！
      api.put(`/api/posts/${currentPost.documentId}`, {
        data: { commentCount: newCommentCount, commentsList: newCommentsList }
      }, false).then(() => {
        wx.showToast({ title: '发表成功', icon: 'success' });
      });
    }
  },

  buyItem: function() { wx.showToast({ title: '下单功能开发中...', icon: 'none' }); }
});