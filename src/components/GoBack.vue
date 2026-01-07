<template>
  <div class="GoBack iconfont icon-fanhui" @click="goBack()"></div>
</template>

<script>
import router from "@/router";

export default {
  name: "GoBack",
  methods: {
    goBack() {
      router.back()
    },
  }
}
</script>

<style scoped>
.GoBack {
  font-size: 15px;
  width: 30px;
  height: 30px;
  text-align: center;
  line-height: 30px;
  background-color: #fff;
  border-radius: 20px;
  color: #476449;
}
</style>