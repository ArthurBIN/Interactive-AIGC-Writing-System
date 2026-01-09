<template>

  <div id="app">

    <div class="headerBox" v-if=isMatchRoute>
      {{ isMode2 ? '作文智评助手' : '作文灵感助手' }}
    </div>

    <div class="AllBox" :class="{ 'HomeBox': isMatchRoute }">
      <router-view/>
    </div>

    <!--    底部栏-->
    <TabBox v-if=isMatchRoute></TabBox>

  </div>

</template>

<script>
import './style/icon.css'

export default {
  name: "app",
  computed: {
    isMatchRoute() {
      const matchPaths = ['/', '/edititem', '/storyitem', '/user', '/upload', '/compositions'];
      return matchPaths.includes(this.$route.path);
    },
    isMode2() {
      const matchPaths = ['/upload', '/compositions'];
      return matchPaths.includes(this.$route.path);
    }
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
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  background-color: #fff;
}

.AllBox {
  flex: 1;
  overflow: auto;
}

.HomeBox {
  padding-top: 50px;
  padding-bottom: 65px;
}
</style>