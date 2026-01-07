<template>
  <div class="All">
    <!-- 未登录状态 -->
    <div class="LoginSection" v-if="!userId">
      <div class="LoginIcon">
        <i class="iconfont icon-user"></i>
      </div>
      <div class="LoginText">登录后查看个人信息</div>
      <van-button class="LoginButton" @click="goLogin()">登录</van-button>
    </div>

    <!-- 已登录状态 -->
    <div class="UserContainer" v-if="userId">
      <!-- 用户信息卡片 -->
      <div class="UserCard">
        <!-- 头像和基本信息 -->
        <div class="UserProfile">
          <div class="AvatarBox">
            <img v-if="sex === '男'" src="../images/older.jpg" alt="头像">
            <img v-else-if="sex === '女'" src="../images/olderF.jpg" alt="头像">
            <img v-else src="../images/tx.png" alt="头像">
          </div>

          <div class="UserBasicInfo">
            <div class="UserName">
              <span v-if="age > 50 && sex && userInfo.nick_name">
                {{ userInfo.nick_name[0] }}{{ sex === '男' ? '爷爷' : '奶奶' }}
              </span>
              <span v-else-if="userInfo.nick_name">{{ userInfo.nick_name }}</span>
              <span v-else-if="age > 50 && sex">{{ sex === '男' ? '爷爷' : '奶奶' }}</span>
              <span v-else>用户</span>
            </div>
            <div class="UserAge" v-if="age">{{ age }}岁</div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="ActionButtons">
        <div class="ActionButton" @click="outLogin">
          <i class="iconfont icon-user"></i>
          <span>退出登录</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {Dialog, Toast} from "vant";
import Cookies from "js-cookie";
import myaxios from "@/config/myaxios";
import router from "@/router";

export default {
  name: "UserPage",
  data() {
    return {
      userId: "",
      token: "",
      userInfo: {},
      age: null,
      sex: "",
    }
  },

  mounted() {
    this.userId = Cookies.get('user_id') || '';
    this.token = Cookies.get('token') || '';

    if (this.token) {
      this.getUserInfo();
    }
  },

  methods: {
    // 获取用户信息
    async getUserInfo() {
      try {
        const params = `token=${this.token}&user_id=${this.userId}`;
        const res = await myaxios.get(`/user/detail?${params}`);

        if (res.data.code === 0) {
          this.userInfo = res.data.data;
          this.calculateAge();
          this.setSex();
        }
      } catch (error) {
        Toast.fail("获取用户信息失败！");
      }
    },

    // 计算年龄
    calculateAge() {
      if (!this.userInfo.user_birthdate) return;

      const birthdate = new Date(this.userInfo.user_birthdate);
      const today = new Date();
      let age = today.getFullYear() - birthdate.getFullYear();
      const monthDiff = today.getMonth() - birthdate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
        age--;
      }

      this.age = age;
    },

    // 设置性别
    setSex() {
      if (this.userInfo.gender === 'F') {
        this.sex = '女';
      } else if (this.userInfo.gender === 'M') {
        this.sex = '男';
      }
    },

    // 跳转到登录
    goLogin() {
      if (this.$route.path !== '/login') {
        this.$router.push("/login");
      }
    },
    outLogin() {
      Dialog.confirm({
        message: '确定退出登录吗?',
      }).then(() => {
        Cookies.remove('token')
        Cookies.remove('user_id')
        router.replace("/login")
      }).catch(() => {

      })
    },
  }
}
</script>

<style scoped>
.All {
  width: 100%;
  padding: 20px 16px;
  box-sizing: border-box;
}

/* 未登录状态 */
.LoginSection {
  width: 100%;
  max-width: 400px;
  margin: 80px auto 0;
  text-align: center;
}

.LoginIcon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: #999;
}

.LoginText {
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
}

.LoginButton {
  width: 160px;
  height: 44px;
  background-color: #333;
  border: none;
  border-radius: 22px;
  color: #fff;
  font-size: 16px;
}

/* 用户容器 */
.UserContainer {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

/* 用户信息卡片 */
.UserCard {
  width: 100%;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 20px;
  box-sizing: border-box;
  margin-bottom: 16px;
}

.UserProfile {
  display: flex;
  align-items: center;
  position: relative;
}

.AvatarBox {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid #f5f5f5;
}

.AvatarBox img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.UserBasicInfo {
  flex: 1;
  margin-left: 16px;
}

.UserName {
  font-size: 20px;
  font-weight: 600;
  color: #111;
  margin-bottom: 4px;
}

.UserAge {
  font-size: 14px;
  color: #666;
}

/* 操作按钮 */
.ActionButtons {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ActionButton {
  width: 100%;
  height: 52px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 16px;
  color: #333;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.ActionButton i {
  font-size: 20px;
}

/* 滚动条优化 */
.All::-webkit-scrollbar {
  width: 0;
  display: none;
}
</style>