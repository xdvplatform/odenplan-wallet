import DurableWebsite from './views/dashboard/pages/dapp/DurableWebsite.vue';
import index from './views/dashboard/Index.vue';
import Router from 'vue-router';
import TokensComponent from './views/dashboard/pages/Tokens.vue';
import Vue from 'vue';
import WalletComponent from './views/dashboard/pages/Wallet.vue';
// @ts-ignore
// @ts-nocheck


Vue.use(Router);

export default new Router({
  mode: "hash",
  base: process.env.BASE_URL,
  routes: [
    {
      path: "/",
      // @ts-ignore
      component: index,

      children: [

        {
          path: "tokens",
          name: "tokens",
          // @ts-ignore
          component: TokensComponent
        },
        {
          path: "wallet",
          name: "wallet",
          // @ts-ignore
          component: WalletComponent
        },

      ]
    },
  

   
  ]
});
