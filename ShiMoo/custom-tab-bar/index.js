Component({
  data: {
    selected: 0,
    color: "#94a3b8",
    selectedColor: "#2563eb",
    list: [
      {
        pagePath: "/pages/index/index",
        text: "首页",
        iconPath: "https://api.iconify.design/heroicons/home.svg?color=%2394a3b8",
        selectedIconPath: "https://api.iconify.design/heroicons/home-solid.svg?color=%232563eb"
      },
      {
        pagePath: "/pages/discover/discover",
        text: "发现",
        iconPath: "https://api.iconify.design/heroicons/sparkles.svg?color=%2394a3b8",
        selectedIconPath: "https://api.iconify.design/heroicons/sparkles-solid.svg?color=%232563eb"
      },
      {
        pagePath: "/pages/order/order",
        text: "订单",
        iconPath: "https://api.iconify.design/heroicons/clipboard-document-list.svg?color=%2394a3b8",
        selectedIconPath: "https://api.iconify.design/heroicons/clipboard-document-list-solid.svg?color=%232563eb"
      },
      {
        pagePath: "/pages/user/user",
        text: "我的",
        iconPath: "https://api.iconify.design/heroicons/user.svg?color=%2394a3b8",
        selectedIconPath: "https://api.iconify.design/heroicons/user-solid.svg?color=%232563eb"
      }
    ]
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      wx.switchTab({ url });
      this.setData({ selected: data.index });
    }
  }
})