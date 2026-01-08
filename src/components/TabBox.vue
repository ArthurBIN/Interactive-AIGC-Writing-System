<template>
  <div class="TabBox"
       v-if="$route.path === '/' || $route.path === '/edititem' || $route.path === '/storyitem' || $route.path === '/user'">
    <div class="TabItem"
         :style="{ color: $route.path === '/' ? 'black' : '' }"
         @click="TabToIndex">
      <div class="TabIcon">
        <i class="iconfont icon-zhuti"></i>
      </div>
      <div class="TabIconText">主题</div>
    </div>

    <div class="TabItem"
         :style="{ color: $route.path === '/edititem' ? 'black' : '' }"
         @click="TabToEditItem">
      <div class="TabIcon">
        <i class="iconfont icon-jilu"></i>
      </div>
      <div class="TabIconText">记录</div>
    </div>
    <div class="TabItem"
         :style="{ color: $route.path === '/storyitem' ? 'black' : '' }"
         @click="TabToStoryItem">
      <div class="TabIcon">
        <i class="iconfont icon-list"></i>
      </div>
      <div class="TabIconText">作文集</div>
    </div>
    <div class="TabItem"
         :style="{ color: $route.path === '/user' ? 'black' : '' }"
         @click="TabToUser">
      <div class="TabIcon">
        <i class="iconfont icon-wode"></i>
      </div>
      <div class="TabIconText">我的</div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TabBox",
  methods: {
    TabToIndex() {
      if (this.$route.path !== '/') {
        this.$router.push("/")
      }
    },
    TabToEditItem() {
      if (this.$route.path !== '/edititem') {
        this.$router.push("/edititem")
      }
    },
    TabToStoryItem() {
      if (this.$route.path !== '/storyitem') {
        this.$router.push("/storyitem")
      }
    },
    TabToUser() {
      if (this.$route.path !== '/user') {
        this.$router.push("/user")
      }
    }
  }
}
</script>

<style scoped>
.TabBox {
  width: 100%;
  height: 75px;
  z-index: 10;
  display: flex;
  border-top: 1px solid #e5e5e5;
  position: fixed;
  bottom: 0;
  left: 0;
  background-color: #fff;
}

.TabItem {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #c0c0c0;
}

.TabIcon {
  font-size: 30px;
}

.TabIconText {
  font-size: 14px;
  margin-top: 3px;
}

* {
  margin: 0;
  padding: 0;
}

</style>