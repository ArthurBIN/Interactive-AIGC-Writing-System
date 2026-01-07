<template>
  <div class="All">
    <GoBack class="BackBtn"></GoBack>

    <h1>{{ titleItem === 1 ? '登录' : '注册' }}</h1>

    <div class="InputTitle">
      <div class="InputTitleItem"
           :class="titleItem === 1 ? 'InputTitleItemC' : ''"
           @click="titleItem = 1">
        登录
        <div class="Divide"></div>
        <div class="Line" v-if="titleItem === 1"></div>
      </div>
      <div class="InputTitleItem"
           :class="titleItem === 2 ? 'InputTitleItemC' : ''"
           @click="titleItem = 2">
        注册
        <div class="Line" v-if="titleItem === 2"></div>
      </div>
    </div>

    <div class="FormContainer">

      <div v-if="titleItem === 2" class="input_ItemBox">
        <div class="input_ItemBox_text">用户名</div>
        <input type="text" v-model="regUsername" placeholder="请输入昵称"/>
      </div>

      <div class="input_ItemBox">
        <div class="input_ItemBox_text">邮箱</div>
        <input type="email" v-model="email" placeholder="请输入邮箱"/>
      </div>

      <div class="input_ItemBox">
        <div class="input_ItemBox_text">密码</div>
        <input type="password" v-model="password" placeholder="请输入密码"/>
      </div>

      <div v-if="titleItem === 2" class="input_ItemBox">
        <div class="input_ItemBox_text">确认密码</div>
        <input type="password" v-model="confirmPassword" placeholder="请再次输入密码"/>
      </div>

      <div class="registerBox">
        <div v-if="titleItem === 1" @click="titleItem = 2">立即注册</div>
        <div v-else @click="titleItem = 1">已有账号？去登录</div>
        <div v-if="titleItem === 1">忘记密码</div>
      </div>

      <van-button
          class="LoginBtn"
          color="#000"
          :loading="loading"
          @click="handleSubmit"
      >
        {{ titleItem === 1 ? '登录' : '提交注册' }}
      </van-button>
    </div>
  </div>
</template>

<script>
// Vant 2 引入方式
import { Toast } from 'vant';
import { loginUser, registerUser } from "@/api/auth";

export default {
  name: "LoginPage",
  data() {
    return {
      titleItem: 1, // 1: 登录, 2: 注册
      email: "",
      password: "",
      confirmPassword: "",
      regUsername: "",
      loading: false,
    }
  },
  methods: {
    // 基础邮箱校验
    isInvalidEmail(email) {
      return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    async handleSubmit() {
      if (this.titleItem === 1) {
        await this.handleLogin();
      } else {
        await this.handleRegister();
      }
    },

    // 登录逻辑
    async handleLogin() {
      if (!this.email || !this.password) {
        Toast("请完整填写邮箱和密码");
        return;
      }

      this.loading = true;
      Toast.loading({ message: '登录中...', forbidClick: true, duration: 0 });

      try {
        await loginUser(this.email, this.password);
        Toast.success("登录成功！");
        const redirectPath = this.$route.query.redirect || '/';
        this.$router.replace(redirectPath).catch(() => {});
      } catch (err) {
        if (err.code === 'email_not_confirmed') {
          Toast.fail("邮箱未确认！");
          return;
        }
        Toast.fail(err.message || "登录失败");
      } finally {
        this.loading = false;
      }
    },

    // 注册逻辑
    async handleRegister() {
      if (!this.regUsername || !this.email || !this.password) {
        Toast("请完整填写信息");
        return;
      }
      if (this.isInvalidEmail(this.email)) {
        Toast("邮箱格式错误");
        return;
      }
      if (this.password !== this.confirmPassword) {
        Toast("两次密码输入不一致");
        return;
      }
      if (this.password.length < 6) {
        Toast("密码至少6位");
        return;
      }

      this.loading = true;
      Toast.loading({ message: '注册中...', forbidClick: true, duration: 0 });

      try {
        await registerUser(this.email, this.password, this.regUsername);
        Toast.success("注册成功！请前往邮箱确认后登录");
        this.titleItem = 1;
        this.password = "";
        this.confirmPassword = "";
      } catch (err) {
        Toast.fail(err.message || "注册失败");
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
.All {
  width: 100%;
  background: #fff;
}
h1 {
  text-align: center;
  margin: 70px auto 20px;
}
.BackBtn {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 10;
}
.InputTitle {
  width: 80%;
  height: 70px;
  line-height: 70px;
  font-size: 20px;
  display: flex;
  margin: 0 auto;
}
.InputTitleItem {
  flex: 1;
  text-align: center;
  position: relative;
  color: #7D8288;
  cursor: pointer;
}
.InputTitleItemC {
  color: #000;
  font-weight: bold;
}
.Divide {
  position: absolute;
  width: 1px;
  height: 20px;
  right: -0.5px;
  top: 50%;
  transform: translateY(-50%);
  background-color: #7D8288;
}
.Line {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 2px;
  background-color: #000;
}
.input_ItemBox {
  width: 75%;
  margin: 0 auto;
}
.input_ItemBox_text {
  font-size: 18px;
  margin: 15px 0 10px;
}
.input_ItemBox input{
  width: 100%;
  height: 50px;
  font-size: 16px;
  padding: 0 0 0 20px;
  border-radius: 13px;
  box-sizing: border-box;
  border: 1px solid #000;
  outline: none;
}
.LoginBtn {
  width: 75%;
  display: block;
  margin: 40px auto 0;
  height: 50px;
  border-radius: 13px;
  font-weight: 700;
}
.registerBox {
  display: flex;
  width: 75%;
  margin: 15px auto 0;
  font-size: 14px;
  color: #666;
}
.registerBox div {
  flex: 1;
}
.registerBox div:nth-child(1) {
  text-align: left;
}
.registerBox div:nth-child(2) {
  text-align: right;
}
</style>