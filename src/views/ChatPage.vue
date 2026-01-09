<template>
  <div class="All">
    <!-- 顶部栏 -->
    <div class="TopBox">
      <GoBack class="GoBackBtn"></GoBack>
      <div class="TopTitle">{{ style || '新对话' }}</div>

      <!-- 右上角跳转按钮 -->
      <div class="TopRightIcon" @click="goEditPage()">
        <div class="IconBreath" v-if="contentTotal > 300"></div>
        <div class="BreathTip" @click.stop="showBreathTip = false" v-if="contentTotal > 300 && showBreathTip">
          试试生成故事吧~
        </div>
        <i class="iconfont icon-xiangyoujiantou"></i>
      </div>
    </div>

    <!-- 聊天内容区域 -->
    <div class="ChatContainer">
      <!-- 消息列表 -->
      <div class="MessageBox" ref="scrollArea">
        <div class="MessageItem" v-for="(item, index) in messageList" :key="index">
          <!-- 用户消息 -->
          <div v-if="item.role === 'user'" class="UserMessage">
            <div class="UserBubble">
              {{ item.content }}
            </div>
          </div>

          <!-- AI消息 -->
          <div v-else class="AssistantMessage">
            <div class="AssistantAvatar">
              <i class="iconfont icon-aislogo"></i>
            </div>
            <div class="AssistantContent" v-html="render(item.content)"></div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="InputContainer">
        <div class="InputWrapper">
          <textarea
              v-model="inputText"
              ref="autoResizeTextarea"
              class="InputArea"
              placeholder="发送消息..."
              rows="1"
          ></textarea>

          <div class="InputActions">
            <div
                class="SendButton"
                :class="{ active: inputText.trim() }"
                @click="sendMessage">
              <i class="iconfont icon-xiangshang"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {Toast} from "vant";
import {createChat, getChatDetail, updateChatMessages} from "@/api/chat";
import {supabase} from "@/config/supabase";
import {marked} from 'marked';

export default {
  name: 'ChatPage',
  data() {
    return {
      userId: "",
      dbChatId: null,     // 数据库记录ID
      style: "",          // 主题
      messageList: [],    // 对话数组
      inputText: "",
      contentTotal: 0,
      showBreathTip: true,
      isGenerating: false,
      isFirstMessage: true
    }
  },

  watch: {
    inputText() {
      this.$nextTick(() => {
        this.adjustTextareaHeight();
      });
    },
    messageList: {
      handler(newList) {
        this.contentTotal = newList.reduce((t, i) => i.role === "user" ? t + (i.content?.length || 0) : t, 0);
        this.scrollToBottom();
      },
      deep: true
    }
  },

  async mounted() {
    await this.initPage();
  },

  methods: {
    render(text) {
      return marked.parse(text);
    },
    async initPage() {
      const {data: {session}} = await supabase.auth.getSession();
      if (!session) return this.$router.push('/login');
      this.userId = session.user.id;

      const existingId = this.$route.query.chat_id;
      this.style = this.$route.query.style || '新对话';

      try {
        if (existingId) {
          // 历史对话：加载数据
          const chat = await getChatDetail(existingId);
          this.dbChatId = chat.id;
          this.messageList = chat.messages || [];
          this.isFirstMessage = false;
        } else {
          // 新对话：仅内存展示欢迎语，不操作数据库
          this.messageList = [{
            role: "assistant",
            content: `你好！我是你的作文助手。关于“${this.style}”，你现在有什么想法吗？`
          }];
          this.isFirstMessage = true;
        }
      } catch (e) {
        Toast.fail("加载失败");
      }
    },

    async sendMessage() {
      const message = this.inputText.trim();
      if (!message || this.isGenerating) return;

      this.messageList.push({role: "user", content: message});
      this.inputText = "";
      this.isGenerating = true;

      try {
        // 延迟创建：只有用户发了第一条消息，才在数据库建表
        if (this.isFirstMessage && !this.dbChatId) {
          const chatRecord = await createChat(this.userId, this.style, this.messageList);
          this.dbChatId = chatRecord.id;
          this.isFirstMessage = false;
        } else {
          await updateChatMessages(this.dbChatId, this.messageList);
        }

        await this.callMoonshotAPI();
      } catch (error) {
        Toast.fail("同步失败");
        this.isGenerating = false;
      }
    },

    async callMoonshotAPI() {
      const apiKey = process.env.VUE_APP_MOONSHOT_API_KEY;
      const systemPrompt = {
        role: "system",
        content: `你是一个中学生作文导师。当前主题：${this.style}。请引导学生思考，不要代写全篇。`
      };

      try {
        const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
          method: "POST",
          headers: {"Content-Type": "application/json", "Authorization": `Bearer ${apiKey}`},
          body: JSON.stringify({
            model: "moonshot-v1-8k",
            messages: [systemPrompt, ...this.messageList],
            stream: true
          })
        });

        const assistantMessage = {role: "assistant", content: ""};
        this.messageList.push(assistantMessage);

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const {done, value} = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6);
              if (dataStr === "[DONE]") break;
              try {
                const data = JSON.parse(dataStr);
                const delta = data.choices[0].delta.content;
                if (delta) assistantMessage.content += delta;
                // eslint-disable-next-line no-empty
              } catch (e) {
              }
            }
          }
          this.scrollToBottom();
        }
        // AI 回复结束后，保存全量数组
        await updateChatMessages(this.dbChatId, this.messageList);
      } catch (e) {
        Toast.fail("AI 响应异常");
      } finally {
        this.isGenerating = false;
      }
    },


    adjustTextareaHeight() {
      const textarea = this.$refs.autoResizeTextarea;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
      }
    },

    goEditPage() {
      if (this.contentTotal === 0) {
        Toast.fail("聊聊天再生成吧！");
      } else {
        this.$router.replace({
          path: "/edit",
          query: {
            chat_id: this.dbChatId
          }
        });
      }
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const scrollArea = this.$refs.scrollArea;
        if (scrollArea) {
          scrollArea.scrollTop = scrollArea.scrollHeight;
        }
      });
    }
  },

  beforeDestroy() {
    Toast.clear();
  }
}
</script>

<style scoped>
.All {
  width: 100%;
  height: 100vh;
  background: linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部栏 */
.TopBox {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 99;
  width: 100%;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  box-sizing: border-box;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e5e7eb;
}

.GoBackBtn {
  position: absolute;
  left: 16px;
  font-size: 20px;
  color: #374151;
  cursor: pointer;
}

.TopTitle {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.TopRightIcon {
  position: absolute;
  right: 16px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #374151;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
}

.TopRightIcon:hover {
  background-color: #f3f4f6;
}

.IconBreath {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: 0 0 5px 5px rgba(37, 99, 235, 0.5);
  animation: breathing 1.8s infinite;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: -1;
}

@keyframes breathing {
  0% {
    opacity: 0.7;
    transform: translate(-50%, -50%) scale(1);
    background-color: #2563eb;
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.3);
    background-color: #3b82f6;
  }
  100% {
    opacity: 0.7;
    transform: translate(-50%, -50%) scale(1);
    background-color: #2563eb;
  }
}

.BreathTip {
  position: absolute;
  padding: 8px 12px;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  color: #374151;
  white-space: nowrap;
  animation: fadeInRight 0.3s ease forwards;
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateY(-50%) translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }
}

/* 聊天容器 */
.ChatContainer {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-top: 56px;
  overflow: hidden;
}

/* 消息列表 */
.MessageBox {
  flex: 1;
  overflow-y: auto;
  padding: 24px 16px 100px;
  box-sizing: border-box;
}

.MessageItem {
  margin-bottom: 32px;
}

/* 用户消息 */
.UserMessage {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.UserBubble {
  max-width: 75%;
  padding: 12px 16px;
  background-color: #2563eb;
  color: white;
  border-radius: 18px;
  border-bottom-right-radius: 4px;
  font-size: 15px;
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* AI消息 */
.AssistantMessage {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}

.AssistantAvatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.AssistantContent {
  flex: 1;
  font-size: 15px;
  line-height: 1.7;
  color: #1f2937;
  word-wrap: break-word;
  white-space: normal;
  padding-top: 4px;
}

/* 输入区域 */
.InputContainer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 98;
  background-color: #ffffff;
  border-top: 1px solid #e5e7eb;
  padding: 16px;
  box-sizing: border-box;
}

.InputWrapper {
  max-width: 100%;
  margin: 0 auto;
  position: relative;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 24px;
  padding: 8px 12px;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  transition: all 0.2s;
}

.InputWrapper:focus-within {
  background-color: #ffffff;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.InputArea {
  flex: 1;
  background-color: transparent;
  border: none;
  resize: none;
  min-height: 24px;
  max-height: 200px;
  padding: 8px 4px;
  font-size: 15px;
  line-height: 1.5;
  outline: none;
  color: #111827;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.InputArea::placeholder {
  color: #9ca3af;
}

.InputActions {
  display: flex;
  align-items: center;
  padding-bottom: 4px;
}

.SendButton {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #e5e7eb;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  font-size: 16px;
}

.SendButton.active {
  background-color: #2563eb;
  color: white;
  cursor: pointer;
}

.SendButton.active:hover {
  background-color: #1d4ed8;
  transform: scale(1.05);
}

.SendButton.active:active {
  transform: scale(0.95);
}

.SendButton:not(.active) {
  cursor: not-allowed;
}

/* 滚动条样式 */
.MessageBox::-webkit-scrollbar {
  width: 6px;
}

.MessageBox::-webkit-scrollbar-track {
  background: transparent;
}

.MessageBox::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.MessageBox::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>