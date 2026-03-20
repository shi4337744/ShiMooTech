const app = getApp();

Page({
  data: {
    shopName: '特色美食档口',
    menu: [
      { id: 1, name: "经典招牌冒菜", price: 18, sales: 120, img: "https://via.placeholder.com/80/ef4444/ffffff?text=FOOD" },
      { id: 2, name: "蒜香骨汤面", price: 15, sales: 85, img: "https://via.placeholder.com/80/f59e0b/ffffff?text=NOODLE" },
      { id: 3, name: "红油抄手", price: 12, sales: 200, img: "https://via.placeholder.com/80/ef4444/ffffff?text=MEAT" },
      { id: 4, name: "冰镇酸梅汤", price: 5, sales: 300, img: "https://via.placeholder.com/80/3b82f6/ffffff?text=DRINK" }
    ],
    cartList: [],
    totalPrice: 0,
    totalCount: 0,
    showCartPopup: false
  },

  onLoad: function(options) {
    if (options.name) {
      this.setData({ shopName: options.name });
      wx.setNavigationBarTitle({ title: options.name });
    }
  },

  addToCart: function(e) {
    const item = e.currentTarget.dataset.item;
    let { cartList } = this.data;
    const index = cartList.findIndex(v => v.id === item.id);
    if (index === -1) cartList.push({ ...item, count: 1 });
    else cartList[index].count++;
    this.calculateTotal(cartList);
    wx.vibrateShort({ type: 'light' });
  },

  minusCart: function(e) {
    const id = e.currentTarget.dataset.id;
    let { cartList } = this.data;
    const index = cartList.findIndex(v => v.id === id);
    if (index !== -1) {
      if (cartList[index].count > 1) cartList[index].count--;
      else cartList.splice(index, 1);
    }
    if (cartList.length === 0) this.setData({ showCartPopup: false });
    this.calculateTotal(cartList);
  },

  calculateTotal: function(list) {
    let totalP = 0, totalC = 0;
    list.forEach(v => { totalP += v.price * v.count; totalC += v.count; });
    this.setData({ cartList: list, totalPrice: totalP, totalCount: totalC });
  },

  toggleCart: function() { if (this.data.cartList.length > 0) this.setData({ showCartPopup: !this.data.showCartPopup }); },

  // 核心：模拟支付并生成订单
  goToPay: function() {
    if (this.data.totalPrice <= 0) return;
    wx.showModal({
      title: '确认支付',
      content: `需支付 ￥${this.data.totalPrice}`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中' });
          
          // 1. 生成订单对象
          const newOrder = {
            id: 'ORD' + Date.now().toString().slice(-8),
            shopName: this.data.shopName,
            items: this.data.cartList.map(v => ({ name: v.name, count: v.count })),
            totalPrice: this.data.totalPrice,
            status: '待配送',
            time: new Date().toLocaleString()
          };

          // 2. 存入全局订单池
          app.globalData.globalOrderList = [newOrder, ...app.globalData.globalOrderList];

          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({ title: '下单成功', icon: 'success' });
            // 3. 清空购物车并返回
            this.setData({ cartList: [], totalPrice: 0, totalCount: 0, showCartPopup: false });
            setTimeout(() => { wx.switchTab({ url: '/pages/order/order' }); }, 1000);
          }, 1000);
        }
      }
    });
  }
})