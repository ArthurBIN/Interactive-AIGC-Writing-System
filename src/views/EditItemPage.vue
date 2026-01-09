<template>
  <div class="All">
    <div class="Header" v-if="userId && infoLists.length > 0">
      <div class="SearchBox">
        <i class="iconfont icon-search SearchIcon"></i>
        <input type="text" v-model="searchQuery" class="SearchInput" placeholder="搜索记录..."/>
      </div>
    </div>

    <van-skeleton title :row="3" v-if="isLoading" class="SkeletonBox"/>

    <div class="RecordList" v-if="userId && filteredLists.length > 0 && !isLoading">
      <div
          class="RecordCard"
          v-for="(item, index) in filteredLists"
          :key="index"
          @click="goInfoPage(item.id, item.title)">
        <div class="RecordHeader">
          <div class="RecordTitle">
            {{ item.title || `随记-${formatDate(item.updated_at)}` }}
          </div>
          <div class="RecordAction">
            <span>查看</span>
            <i class="iconfont icon-xiangyoujiantou"></i>
          </div>
        </div>

        <div class="RecordContent">
          {{ getLatestMessage(item.messages) }}
        </div>

        <div class="RecordTime">
          {{ formatDateTime(item.updated_at) }}
        </div>
      </div>
    </div>

    <van-empty description="请您先登录" v-if="!userId && !isLoading" class="EmptyState">
      <van-button round class="LoginButton" @click="goLogin()">前往登录</van-button>
    </van-empty>

    <van-empty
        :description="searchQuery ? '未找到相关记录' : '您还没有记录哦~'"
        v-if="userId && !isLoading && filteredLists.length === 0"
        class="EmptyState"
    />
  </div>
</template>

<script>
import {Toast} from "vant";
import {supabase} from '@/config/supabase';
import {getUserChatList} from "@/api/chat";

export default {
  name: "EditItemPage",
  data() {
    return {
      userId: "",
      infoLists: [],
      isLoading: true,
      searchQuery: "" // 添加搜索功能支持
    }
  },

  computed: {
    // 过滤后的列表
    filteredLists() {
      if (!this.searchQuery) return this.infoLists;
      return this.infoLists.filter(item =>
          item.title?.includes(this.searchQuery) ||
          JSON.stringify(item.messages).includes(this.searchQuery)
      );
    }
  },

  async mounted() {
    await this.checkUser();
  },

  methods: {
    // 检查登录状态并获取数据
    async checkUser() {
      const {data: {session}} = await supabase.auth.getSession();
      if (session) {
        this.userId = session.user.id;
        await this.getHistory();
      } else {
        this.userId = "";
        this.isLoading = false;
      }
    },

    // 前往登录
    goLogin() {
      this.$router.push("/login");
    },

    // 获取聊天历史 (Supabase版)
    async getHistory() {
      try {
        const data = await getUserChatList(this.userId);
        this.infoLists = data || [];
      } catch (error) {
        console.error(error);
        Toast.fail("获取历史记录失败");
      } finally {
        this.isLoading = false;
      }
    },

    // 前往聊天详情页
    goInfoPage(chatId, title) {
      this.$router.push({
        path: "/chat",
        query: {
          chat_id: chatId,
          style: title
        }
      });
    },

    // 获取最后一条消息作为预览
    getLatestMessage(messages) {
      if (!messages || messages.length === 0) return '暂无内容';
      const lastMsg = messages[messages.length - 1];
      return lastMsg.content || '暂无内容';
    },

    // 格式化日期（月-日）
    formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    },

    // 格式化日期时间（年-月-日 时:分）
    formatDateTime(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const y = date.getFullYear();
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const d = date.getDate().toString().padStart(2, '0');
      const hh = date.getHours().toString().padStart(2, '0');
      date.getMinutes().toString().padStart(2, '0');
      return `${y}-${m}-${d} ${hh}:${hh}`;
    }

  }
}
</script>
<style scoped>
.All {
  width: 100%;
  padding-bottom: 20px;
}

/* 头部搜索区域 */
.Header {
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
  position: sticky;
  top: 50px;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  z-index: 10;
  border-bottom: 1px solid #f0f0f0;
}

.SearchBox {
  width: 100%;
  height: 44px;
  background-color: #f5f5f5;
  border-radius: 22px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  box-sizing: border-box;
  border: 1px solid #e5e5e5;
}

.SearchIcon {
  font-size: 18px;
  color: #999;
  margin-right: 10px;
}

.SearchInput {
  flex: 1;
  height: 100%;
  border: none;
  background: transparent;
  outline: none;
  font-size: 15px;
  color: #333;
}

.SearchInput::placeholder {
  color: #999;
}

/* 骨架屏 */
.SkeletonBox {
  padding: 20px 16px;
}

/* 记录列表 */
.RecordList {
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
}

/* 记录卡片 */
.RecordCard {
  width: 100%;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.RecordHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.RecordTitle {
  flex: 1;
  font-size: 17px;
  font-weight: 600;
  color: #111;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 10px;
}

.RecordAction {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #666;
  flex-shrink: 0;
}

.RecordAction i {
  font-size: 12px;
}

.RecordContent {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.RecordTime {
  font-size: 12px;
  color: #999;
}

/* 空状态 */
.EmptyState {
  padding: 60px 20px;
}

.LoginButton {
  width: 140px;
  height: 44px;
  background-color: #333;
  border: none;
  color: #fff;
  font-size: 15px;
}

/* 滚动条优化 */
.All::-webkit-scrollbar {
  width: 0;
  display: none;
}
</style>