import Vue from 'vue'
import App from './App.vue'
import router from './router'
import 'swiper/css/swiper.min.css'

import Vant from 'vant';
import 'vant/lib/index.css';
import GoBack from "@/components/GoBack.vue";
import MessageBox from "@/components/MessageBox.vue";
import PopBox from "@/components/PopBox.vue";
import StoryItemBox from "@/components/StoryItemBox.vue";
import TabBox from "@/components/TabBox.vue";

Vue.component("GoBack", GoBack)
Vue.component("MessageBox", MessageBox)
Vue.component("PopBox", PopBox)
Vue.component("StoryItemBox", StoryItemBox)
Vue.component("TabBox", TabBox)

Vue.use(Vant);

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
