Page({
  data: {
    shopName: '',
    startingPrice: 15, // 起送价
    menuList: [
      { id: 'f1', name: '招牌黄焖鸡米饭', description: '微辣/中辣/特辣可选，含米饭', price: 16, img: 'https://via.placeholder.com/150/fca5a5/fff?text=Food', sales: 450 },
      { id: 'f2', name: '香菇滑鸡饭', description: '不辣，鲜香滑嫩，营养健康', price: 18, img: 'https://via.placeholder.com/150/60a5fa/fff?text=Food', sales: 200 },
      { id: 'f3', name: '金牌排骨饭', description: '秘制排骨，汤汁浓郁超下饭', price: 22, img: 'https://via.placeholder.com/150/34d399/fff?text=Food', sales: 150 },
      { id: 'f4', name: '卤蛋', description: '入味卤蛋，加餐必备', price: 2, img: 'https://via.placeholder.com/150/fbbf24/fff?text=Food', sales: 800 },
      { id: 'f5', name: '冰镇可乐', description: '330ml 快乐水', price: 3, img: 'https://via.placeholder.com/150/a78bfa/fff?text=Food', sales: 600 }
    ],
    cart: {}, // 购物车数据格式: { 'f1': 2, 'f2': 1 }
    cartList: [], // 转换为数组用于弹窗渲染
    totalPrice: 0,
    totalCount: 0,
    showCartDetail: false,
    isBouncing: false // 购物车跳动动画标志
  },

  onLoad: function (options) {
    // 接收首页传来的店名，默认兜底“美味店铺”
    const name = options.name || '美味店铺';
    this.setData({ shopName: name });
    wx.setNavigationBarTitle({ title: name });
  },

  // 增加数量
  addCount: function(e) {
    const id = e.currentTarget.dataset.id;
    let cart = this.data.cart;
    cart[id] = (cart[id] || 0) + 1;
    this.setData({ cart: cart });
    this.updateCart();
    this.triggerBounce(); // 触发购物车跳动动画
    wx.vibrateShort({ type: 'medium' });
  },

  // 减少数量
  minusCount: function(e) {
    const id = e.currentTarget.dataset.id;
    let cart = this.data.cart;
    if (cart[id] > 0) {
      cart[id] -= 1;
      if (cart[id] === 0) delete cart[id]; // 数量为0则从字典中删除
    }
    this.setData({ cart: cart });
    this.updateCart();
    
    // 如果购物车空了，自动收起弹窗
    if (Object.keys(cart).length === 0) {
      this.setData({ showCartDetail: false });
    }
    wx.vibrateShort({ type: 'light' });
  },

  // 更新购物车计算 (联动总价、总数量、明细列表)
  updateCart: function() {
    let cart = this.data.cart;
    let menuList = this.data.menuList;
    let cartList = [];
    let totalPrice = 0;
    let totalCount = 0;

    for (let id in cart) {
      let item = menuList.find(m => m.id === id);
      if (item && cart[id] > 0) {
        cartList.push({ ...item, count: cart[id] });
        totalPrice += item.price * cart[id];
        totalCount += cart[id];
      }
    }
    this.setData({ cartList, totalPrice, totalCount });
  },

  // 点击左侧购物车，切换明细弹窗
  toggleCart: function() {
    if (this.data.totalCount > 0) {
      this.setData({ showCartDetail: !this.data.showCartDetail });
    } else {
      wx.showToast({ title: '购物车空空如也', icon: 'none' });
    }
  },

  // 点击黑色遮罩隐藏弹窗
  hideCart: function() {
    this.setData({ showCartDetail: false });
  },

  // 清空购物车
  clearCart: function() {
    wx.showModal({
      title: '提示', 
      content: '确定清空购物车吗？',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          this.setData({ cart: {}, showCartDetail: false });
          this.updateCart();
        }
      }
    });
  },

  // 购物车跳动小动画
  triggerBounce: function() {
    this.setData({ isBouncing: true });
    setTimeout(() => {
      this.setData({ isBouncing: false });
    }, 300);
  },

  // 结算
  checkout: function() {
    if (this.data.totalCount === 0) return wx.showToast({ title: '请先选择商品', icon: 'none' });
    if (this.data.totalPrice < this.data.startingPrice) return wx.showToast({ title: `差￥${this.data.startingPrice - this.data.totalPrice}起送`, icon: 'none' });
    
    wx.showModal({
      title: '支付确认',
      content: `共 ${this.data.totalCount} 件商品，总计 ￥${this.data.totalPrice}，确认买单？`,
      confirmColor: '#10b981',
      success: (res) => {
        if(res.confirm) {
          wx.showToast({ title: '下单成功！', icon: 'success' });
          // 模拟下单成功后返回首页并清空
          setTimeout(() => { wx.navigateBack(); }, 1000);
        }
      }
    });
  }
});