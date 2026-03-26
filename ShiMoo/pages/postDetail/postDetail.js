const app = getApp();
const api = require('../../utils/request.js');

Page({
  data: {
    post: {},
    type: '', // 🚀 救命关键：告诉界面现在到底该渲染哪个板块的样式！
    isFavorited: false,
    commentText: '',
    comments: [
      { id: 1, userName: "热心校友", avatarUrl: "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0", content: "前排围观！占个座。", time: "1小时前" }
    ]
  },

  onLoad: function(options) {
    if (app.globalData.currentPostDetail) {
      let currentPost = app.globalData.currentPostDetail;
      
      // 🚀 防御性补丁：防止 WXML 认生，多给几个常见的名字字段，解决名字显示为"发布"的错乱
      currentPost.name = currentPost.userName;
      currentPost.author = currentPost.userName;
      currentPost.avatar = currentPost.avatarUrl;

      // 🚀 核心显影：把 options.type 存入 data 暴露给界面！
      this.setData({ 
        post: currentPost,
        type: options.type || currentPost.type 
      });
      
      this.checkFavoriteStatus();
    }
  },

  checkFavoriteStatus: function() {
    const favList = wx.getStorageSync('myFavorites') || [];
    const isFav = favList.some(item => item.documentId === this.data.post.documentId);
    this.setData({ isFavorited: isFav });
  },

  handleLike: function() {
    let currentPost = this.data.post;
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

    this.setData({ post: currentPost });
    wx.vibrateShort({ type: 'light' });

    if (currentPost.documentId) {
      api.put(`/api/posts/${currentPost.documentId}`, {
        data: { likeCount: newCount, likes: newCount, likedUsers: likedUsers }
      }, false);
    }
  },

  handleFavorite: function() {
    let currentPost = this.data.post;
    if (!currentPost) return;

    const newIsFav = !this.data.isFavorited;
    this.setData({ isFavorited: newIsFav });

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
    wx.vibrateShort({ type: 'light' });
  },

  onCommentInput: function(e) {
    this.setData({ commentText: e.detail.value });
  },

  submitComment: function() {
    if (!this.data.commentText.trim()) return wx.showToast({ title: '评论不能全是空格', icon: 'none' });

    let currentPost = this.data.post;
    let myInfo = app.globalData.userInfo || { nickName: '微信新用户', avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0' };

    const newComment = {
      id: Date.now(),
      userName: myInfo.nickName,
      avatarUrl: myInfo.avatarUrl,
      content: this.data.commentText,
      time: "刚刚"
    };

    const newCommentCount = (currentPost.commentCount || 0) + 1;
    currentPost.commentCount = newCommentCount;

    this.setData({
      post: currentPost,
      comments: [newComment, ...this.data.comments],
      commentText: ''
    });

    if (currentPost.documentId) {
      api.put(`/api/posts/${currentPost.documentId}`, {
        data: { commentCount: newCommentCount }
      }, false).then(() => {
        wx.showToast({ title: '发表成功', icon: 'success' });
      });
    }
  },

  previewImage: function() {
    if (this.data.post.imageUrl) {
      wx.previewImage({ urls: [this.data.post.imageUrl] });
    }
  }
});