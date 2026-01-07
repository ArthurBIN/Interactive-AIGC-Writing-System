<template>

  <div id="app">

    <div class="headerBox"
        v-if="$route.path === '/' ||
        $route.path === '/edititem' ||
        $route.path === '/storyitem' ||
        $route.path === '/user'"
    >写作之语</div>

    <div class="AllBox">
      <router-view/>
    </div>

    <!--    底部栏-->
    <TabBox
        v-if="$route.path === '/' ||
        $route.path === '/edititem' ||
        $route.path === '/storyitem' ||
        $route.path === '/user'"
    ></TabBox>

  </div>

</template>

<script>
import Cookies from "js-cookie";
import myaxios from "@/config/myaxios";
import {Dialog} from "vant";

export default {
  name: "app",
  data() {
    return {
      token: "",
      user_id: "",
    }
  },
  watch: {
    $route() {
      this.getIdToken()
    }
  },

  methods: {
    getIdToken() {
      const id = Cookies.get('user_id');
      this.user_id = id ? id : '';
      const token = Cookies.get('token');
      this.token = token ? token : '';

      if (this.token && this.user_id) {
        // 测试Token有没有过期
        this.testToken()
      }
    },
    // 测试token有没有过期
    testToken() {
      if (this.token) {
        myaxios.get("/hello?token=" + this.token).then(res => {
          if (res.data.message !== "Hello, world!") {
            Dialog.alert({
              message: '登录失效，请重新登录！',
            })
                .then(() => {
                  this.outLogin()
                }).catch(() => {
              this.outLogin()
            })
          }
        }).catch(() => {
          Dialog.alert({
            message: '登录失效，请重新登录！',
          })
              .then(() => {
                this.outLogin()
              }).catch(() => {
            this.outLogin()
          })
        })
      }
    },
    // 退出登录
    outLogin() {
      Cookies.remove('token')
      Cookies.remove('user_id')
      this.user_id = ""
      this.token = ""
      if (this.$route.path !== '/login') {
        this.$router.push("/login");
      }
    },
  }
};

</script>

<style lang="scss">
#app {
  font-family: "黑体", "SimHei", "Helvetica Neue", Arial, sans-serif;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.headerBox {
  width: 100%;
  height: 50px;
  line-height: 50px;
  text-align: center;
  font-weight: 700;
  font-size: 20px;
  border-bottom: 1px solid #e5e5e5;
}
.AllBox {
  flex: 1;
  overflow: auto;
}

@font-face {
  font-family: "iconfont"; /* Project id 4579859 */
  src: url('//at.alicdn.com/t/c/font_4579859_4004m1c4rwp.woff2?t=1766918914241') format('woff2'),
  url('//at.alicdn.com/t/c/font_4579859_4004m1c4rwp.woff?t=1766918914241') format('woff'),
  url('//at.alicdn.com/t/c/font_4579859_4004m1c4rwp.ttf?t=1766918914241') format('truetype');
}

.iconfont {
  font-family: "iconfont" !important;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.icon-zhuti:before {
  content: "\e682";
}

.icon-list:before {
  content: "\e600";
}

.icon-jilu:before {
  content: "\e75b";
}

.icon-shanchu:before {
  content: "\e612";
}

.icon-aislogo:before {
  content: "\e648";
}

.icon-xiangshang:before {
  content: "\e66b";
}

.icon-xiangyoujiantou:before {
  content: "\e60a";
}

.icon-wode:before {
  content: "\e625";
}

.icon-baocun:before {
  content: "\e63b";
}

.icon-xiala:before {
  content: "\e634";
}

.icon-fanhui:before {
  content: "\e61e";
}

.icon-a-037_zhuye32:before {
  content: "\e6c3";
}


</style>