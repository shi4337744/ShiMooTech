App({
  globalData: {
    // 🚀 全局统一接口地址指挥中心！
    // 手机真机调试时，只需把 localhost 换成你电脑的 IPv4 地址即可，例如 'http://192.168.1.10:1337'
    apiBaseUrl: 'http://localhost:1337', 

    newPost: null, // 首页中转
    globalDiscoveryList: [], // 发现页池
    globalOrderList: [ // 订单池（初始给一个模拟数据）
      {
        id: 'ORD12345',
        shopName: '一食堂黄焖鸡',
        items: [{name: '招牌黄焖鸡', count: 1}, {name: '米饭', count: 1}],
        totalPrice: 16,
        status: '已完成',
        time: '2023-10-27 12:30'
      }
    ]
  }
})