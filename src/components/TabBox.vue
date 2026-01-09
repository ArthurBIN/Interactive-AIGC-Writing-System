<template>
  <div class="TabBox" v-if="showTab">
    <div v-for="item in currentLeftTabs" :key="item.path"
         class="TabItem"
         :class="{ active: $route.path === item.path }"
         @click="navTo(item.path)">
      <div class="TabIcon"><i :class="['iconfont', item.icon]"></i></div>
      <div class="TabIconText">{{ item.name }}</div>
    </div>

    <div class="CenterItem" @click="toggleMode">
      <div class="CenterCircle" :class="{ 'rotate-active': num === 2 }">
        <i class="iconfont icon-04zhuanhuan"></i>
      </div>
    </div>

    <div v-for="item in currentRightTabs" :key="item.path"
         class="TabItem"
         :class="{ active: $route.path === item.path }"
         @click="navTo(item.path)">
      <div class="TabIcon"><i :class="['iconfont', item.icon]"></i></div>
      <div class="TabIconText">{{ item.name }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TabBox",
  data() {
    return {
      tabs1: [
        {name: '主题', icon: 'icon-zhuti', path: '/'},
        {name: '记录', icon: 'icon-jilu', path: '/edititem'},
        {name: '作文集', icon: 'icon-list', path: '/storyitem'},
        {name: '我的', icon: 'icon-wode', path: '/user'}
      ],
      tabs2: [
        {name: '上传', icon: 'icon-shangchuan', path: '/upload'},
        {name: '记录', icon: 'icon-jilu1', path: '/compositions'}
      ],
      // 默认模式
      num: 1
    };
  },
  watch: {
    '$route.path': {
      handler(path) {
        const mode2Paths = ['/upload', '/compositions'];
        this.num = mode2Paths.includes(path) ? 2 : 1;
      },
      immediate: true
    }
  },
  computed: {
    showTab() {
      const list = ['/', '/edititem', '/storyitem', '/user', '/upload', '/compositions'];
      return list.includes(this.$route.path);
    },
    currentLeftTabs() {
      return this.num === 1 ? this.tabs1.slice(0, 2) : this.tabs2.slice(0, 1);
    },
    currentRightTabs() {
      return this.num === 1 ? this.tabs1.slice(2, 4) : this.tabs2.slice(1, 2);
    }
  },
  methods: {
    navTo(path) {
      if (this.$route.path !== path) {
        this.$router.push(path);
      }
    },
    toggleMode() {
      if (this.num === 1) {
        this.$router.push('/upload');
      } else {
        this.$router.push('/');
      }
    }
  }
}
</script>

<style scoped>
.TabBox {
  width: 100%;
  height: 65px;
  display: flex;
  position: fixed;
  bottom: 0;
  left: 0;
  background-color: #fff;
  border-top: 1px solid #f0f0f0;
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
}

.TabItem {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #c0c0c0;
}

.TabItem.active {
  color: #333;
  font-weight: bold;
}

.CenterItem {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 6px;
  position: relative;
}

.CenterCircle {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #333 0%, #555 100%);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: -20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 4px solid #fff;
  transition: all 0.3s ease;
}

.rotate-active {
  transform: rotate(180deg);
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
}

.TabIcon i {
  font-size: 24px;
}

.TabIconText {
  font-size: 12px;
  margin-top: 2px;
}
</style>