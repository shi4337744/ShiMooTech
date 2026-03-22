import type { StrapiApp } from '@strapi/strapi/admin';

export default {
  config: {
    locales: [
      // 其他语言都注释着不用管
      'zh-Hans', // 🚀 把这里的注释删掉，解封简体中文！
    ],
  },
  bootstrap(app: StrapiApp) {
    console.log(app);
  },
};