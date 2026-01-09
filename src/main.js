import Vue from 'vue'
import App from './App.vue'
import router from './router'

import Vant from 'vant';
import 'vant/lib/index.css';
import GoBack from "@/components/GoBack.vue";
import TabBox from "@/components/TabBox.vue";

Vue.component("GoBack", GoBack)
Vue.component("TabBox", TabBox)

Vue.use(Vant);

Vue.config.productionTip = false

new Vue({
    router,
    render: h => h(App)
}).$mount('#app')
