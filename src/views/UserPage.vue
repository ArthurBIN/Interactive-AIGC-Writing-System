<template>
  <div class="UserPageContainer">
    <div class="TopNav">
      <span class="NavTitle">账户中心</span>
    </div>

    <div class="UserContent">
      <div class="UserIdentityCard">
        <div class="AvatarWrapper">
          <img src="../images/tx.png" alt="avatar">
        </div>
        <div class="InfoDetail">
          <h2 class="UserNick">{{ userNickname }}</h2>
          <div class="UserIdentity">
            <span class="IdLabel">UID: {{ userIdShort }}</span>
          </div>
        </div>
      </div>

      <div class="ActionArea">
        <van-button
            block
            plain
            type="danger"
            class="LogoutVantBtn"
            @click="handleLogout"
        >
          退出当前账号
        </van-button>
      </div>
    </div>
  </div>
</template>

<script>
import {supabase} from "@/config/supabase";
import {logoutUser} from "@/api/auth";
import {Dialog, Toast} from "vant";

export default {
  name: "UserPage",
  data() {
    return {
      session: null
    }
  },
  computed: {
    userNickname() {
      if (!this.session) return '';
      const {user} = this.session;
      return user.user_metadata?.nick_name || user.email?.split('@')[0] || '智慧创作者';
    },
    userIdShort() {
      return this.session?.user?.id?.substring(0, 8).toUpperCase() || '--------';
    }
  },
  async mounted() {
    const {data: {session}} = await supabase.auth.getSession();
    this.session = session;
  },
  methods: {
    async handleLogout() {
      Dialog.confirm({
        title: '提示',
        message: '确定要退出当前登录账号吗？',
        confirmButtonColor: '#000',
        cancelButtonColor: '#969799',
      }).then(async () => {
        const {error} = await logoutUser();
        if (error) {
          Toast.fail("登出操作失败");
        } else {
          this.session = null;
          this.$router.replace("/login");
          Toast.success("已安全退出");
        }
      }).catch(() => {
      });
    }
  }
}
</script>

<style scoped>
.UserPageContainer {
  padding: 24px;
  box-sizing: border-box;
}

/* 导航头 */
.TopNav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 54px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-bottom: 0.5px solid #eaeaea;
}

.NavTitle {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: 1px;
}

/* 个人信息卡片 */
.UserIdentityCard {
  background: #1a1a1a;
  border-radius: 20px;
  padding: 30px 24px;
  color: #ffffff;
  display: flex;
  align-items: center;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.12);
  margin-bottom: 40px;
}

.AvatarWrapper {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #333;
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  flex-shrink: 0;
}

.AvatarWrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.InfoDetail {
  margin-left: 16px;
}

.UserNick {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.UserIdentity {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.06);
  padding: 1px 6px;
  border-radius: 4px;
  font-family: monospace;
}


.LogoutVantBtn {
  height: 48px;
  border-radius: 12px !important;
  font-size: 15px;
  font-weight: 500;
  border-color: #ee0a24 !important;
  color: #ee0a24 !important;
}
</style>