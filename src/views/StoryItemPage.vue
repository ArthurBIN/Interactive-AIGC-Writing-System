<template>
  <div class="All">
    <van-skeleton title :row="3" v-if="isLoading" class="SkeletonBox"/>

    <div class="StoryList" v-if="userId && essayLists.length > 0 && !isLoading">
      <van-swipe-cell
          v-for="item in essayLists"
          :key="item.id"
          class="SwipeCell"
      >
        <div class="StoryCard" @click="goToStoryDetail(item)">
          <div class="StoryHeader">
            <div class="StoryTitle">{{ item.title || '无标题作文' }}</div>
            <div class="StoryAction">
              <i class="iconfont icon-xiangyoujiantou"></i>
            </div>
          </div>

          <div class="StoryContent">
            {{ item.content }}
          </div>

          <div class="StoryFooter">
            <div class="StoryTime">
              <i class="iconfont icon-time"></i>
              {{ formatTime(item.created_at) }}
            </div>
            <div class="StoryStyleTag" v-if="item.style">{{ item.style }}</div>
          </div>

          <!-- 构思对话关联入口 -->
          <div
              class="ChatLink"
              v-if="item.chat_id"
              @click.stop="goToChat(item.chat_id, item.style)"
          >
            <van-icon name="chat-o"/>
            <span>查看构思对话</span>
            <van-icon name="arrow"/>
          </div>
        </div>

        <template #right>
          <div class="DeleteBtn" @click="handleDelete(item.id)">
            <van-icon name="delete-o" size="22"/>
            <span>删除</span>
          </div>
        </template>
      </van-swipe-cell>
    </div>

    <van-empty description="请您先登录" v-if="!userId && !isLoading" class="EmptyState">
      <van-button round class="LoginButton" @click="goLogin()">前往登录</van-button>
    </van-empty>

    <van-empty description="您还没有生成过作文哦~" v-if="userId && !isLoading && essayLists.length === 0"
               class="EmptyState"/>
  </div>
</template>

<script>
import {Dialog, Toast} from "vant";
import {supabase} from '@/config/supabase';
import {getUserEssays, deleteEssay} from "@/api/essay";

export default {
  name: "StoryItemPage",
  data() {
    return {
      userId: "",
      essayLists: [],
      isLoading: true,
    }
  },

  async mounted() {
    await this.checkUserStatus();
  },

  methods: {
    async checkUserStatus() {
      const {data: {session}} = await supabase.auth.getSession();
      if (session) {
        this.userId = session.user.id;
        await this.loadEssays();
      } else {
        this.userId = "";
        this.isLoading = false;
      }
    },

    async loadEssays() {
      try {
        const data = await getUserEssays(this.userId);
        this.essayLists = data || [];
      } catch (error) {
        console.error(error);
        Toast.fail("获取列表失败");
      } finally {
        this.isLoading = false;
      }
    },

    // 格式化时间
    formatTime(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const y = date.getFullYear();
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const d = date.getDate().toString().padStart(2, '0');
      const hh = date.getHours().toString().padStart(2, '0');
      const mm = date.getMinutes().toString().padStart(2, '0');
      return `${y}-${m}-${d} ${hh}:${mm}`;
    },

    // 前往登录
    goLogin() {
      this.$router.push("/login");
    },

    // 删除作文
    handleDelete(id) {
      Dialog.confirm({
        title: '删除确认',
        message: '确定要删除这篇作文吗？删除后不可恢复。',
        confirmButtonColor: '#ee0a24',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      }).then(async () => {
        try {
          await deleteEssay(id);
          this.essayLists = this.essayLists.filter(item => item.id !== id);
          Toast.success('删除成功');
        } catch (e) {
          Toast.fail('删除失败');
        }
      }).catch(() => {});
    },

    // 前往构思对话
    goToChat(chatId, style) {
      this.$router.push({
        path: '/chat',
        query: {chat_id: chatId, style: style || ''}
      });
    },

    // 前往预览详情
    goToStoryDetail(item) {
      this.$router.push({
        path: '/editstory',
        query: {
          id: item.id,
        }
      });
    }
  }
}
</script>

<style scoped>
.All {
  width: 100%;
  min-height: 100%;
  padding-bottom: 20px;
}

.SkeletonBox {
  padding: 20px 16px;
}

.StoryList {
  width: 100%;
  padding: 12px 14px;
  box-sizing: border-box;
}

.SwipeCell {
  margin-bottom: 10px;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);
}

.StoryCard {
  width: 100%;
  background: #fff;
  border-radius: 14px;
  padding: 16px 16px 14px 20px;
  box-sizing: border-box;
  border-left: 4px solid #5b6ef5;
  transition: background 0.15s;
  position: relative;
}

.SwipeCell .StoryCard {
  margin-bottom: 0;
  border-radius: 0;
}

.StoryCard:active {
  background: #fafafa;
}

.StoryHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.StoryTitle {
  flex: 1;
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 8px;
}

.StoryAction {
  color: #c0c4cc;
  font-size: 13px;
}

.StoryContent {
  font-size: 13px;
  color: #777;
  line-height: 1.65;
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.StoryFooter {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.StoryTime {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #b0b5be;
}

.StoryStyleTag {
  padding: 2px 10px;
  background: #eff0ff;
  color: #5b6ef5;
  font-size: 11px;
  border-radius: 20px;
  font-weight: 500;
  border: 1px solid #dfe1fd;
}

.EmptyState {
  padding-top: 100px;
}

.LoginButton {
  width: 140px;
  background-color: #333;
  color: #fff;
  border: none;
}

.DeleteBtn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 100%;
  min-width: 76px;
  padding: 0 18px;
  background: linear-gradient(160deg, #ff6b6b, #d9363e);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
}

/* 构思对话关联 */
.ChatLink {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 10px;
  padding: 7px 10px;
  background: #ecf5ff;
  border-radius: 8px;
  font-size: 12px;
  color: #1989fa;
  border: 1px solid #d0e8ff;
}

.ChatLink span {
  flex: 1;
  font-size: 12px;
}
</style>