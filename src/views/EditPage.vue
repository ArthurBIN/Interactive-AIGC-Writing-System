<template>
  <div class="All">
    <div class="TopBox">
      <div class="BackButton" @click="goBack">
        <i class="iconfont icon-fanhui"></i>
      </div>
      <div class="TopTitle">定制作文生成</div>
      <div class="Placeholder"></div>
    </div>

    <div class="StoryContainer">
      <div class="TabBar" v-if="draftTexts.length > 0">
        <div
            v-for="(item, index) in draftTexts"
            :key="index"
            class="TabItem"
            :class="{ active: currentIndex === index }"
            @click="switchStory(index)">
          <span>草稿 {{ index + 1 }}</span>
          <i class="iconfont icon-close TabClose" @click.stop="deleteStory(index)" v-if="draftTexts.length > 1"></i>
        </div>
      </div>

      <div class="StoryCard" v-if="currentStory">
        <div class="TitleSection">
          <div class="TitleInput">
            <input
                type="text"
                v-model="currentStory.title"
                :disabled="isGenerating"
                placeholder="请输入标题或等待生成"
                class="TitleInputField"
            />
          </div>
        </div>

        <div class="ContentSection">
          <textarea
              class="ContentArea"
              ref="contentBox"
              v-model="currentStory.text"
              :disabled="isGenerating"
              placeholder="作文内容生成中..."
          ></textarea>
        </div>

        <div class="StyleTag">写作风格：{{ currentStory.style }}</div>
      </div>
    </div>

    <div class="BottomActions">
      <div
          v-if="currentStory && currentStory.text && !isGenerating"
          class="ActionButton SecondaryButton"
          @click="regenerateStory"
      >
        <i class="iconfont icon-replay"></i>
        <span>换个风格</span>
      </div>

      <div
          class="ActionButton PrimaryButton"
          :class="{ 'FullWidth': !currentStory || !currentStory.text || isGenerating, 'disabled': isGenerating }"
          @click="handleSave"
      >
        <i class="iconfont icon-save" v-if="!isGenerating"></i>
        <van-loading size="20px" v-else/>
        <span>{{ isGenerating ? '正在创作中...' : '保存作品' }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import {Dialog, Toast} from "vant";
import {supabase} from '@/config/supabase';
import {getChatDetail} from "@/api/chat";
import {saveEssay} from "@/api/essay";

export default {
  name: "EditPage",
  data() {
    return {
      userId: "",
      chatId: "",
      topicName: "",
      currentIndex: 0,
      draftTexts: [],
      styleOptions: ["文学散文风", "严谨议论风", "清新叙事风"],
      isGenerating: false,
      chatHistory: []
    };
  },

  computed: {
    currentStory() {
      return this.draftTexts[this.currentIndex] || null;
    }
  },

  async mounted() {
    const {data: {session}} = await supabase.auth.getSession();
    if (!session) return this.$router.push('/login');

    this.userId = session.user.id;
    this.chatId = this.$route.query.chat_id;
    this.topicName = this.$route.query.topic_name || "未命名主题";

    if (this.chatId) {
      await this.loadChatAndGenerate();
    }
  },

  methods: {
    async loadChatAndGenerate() {
      try {
        const chat = await getChatDetail(this.chatId);
        this.chatHistory = chat.messages || [];
        this.initFirstDraft();
      } catch (e) {
        Toast.fail("背景数据加载失败");
      }
    },

    initFirstDraft() {
      this.draftTexts.push({text: "", title: "", style: this.styleOptions[0]});
      this.generateStory();
    },

    async generateStory() {
      if (this.isGenerating) return;
      this.isGenerating = true;

      const currentDraft = this.draftTexts[this.currentIndex];
      const apiKey = process.env.VUE_APP_MOONSHOT_API_KEY;

      const prompt = `你是一个专业的作文专家。请根据以下对话中讨论的素材、灵感和主题，撰写一篇作文。
      主题：${this.topicName}。
      写作风格：${currentDraft.style}。
      对话背景：${JSON.stringify(this.chatHistory.map(m => m.content))}。
      要求：结构完整，字数在600字左右。不要说其他多余的内容，直接输出作文正文。`;

      try {
        const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
          method: "POST",
          headers: {"Content-Type": "application/json", "Authorization": `Bearer ${apiKey}`},
          body: JSON.stringify({
            model: "moonshot-v1-8k",
            messages: [{role: "system", content: "你是一个作文生成器。"}, {role: "user", content: prompt}],
            stream: true
          })
        });

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
                if (delta) {
                  // 这里的赋值会触发视图更新
                  currentDraft.text += delta;
                  this.scrollToBottom();
                }
                // eslint-disable-next-line no-empty
              } catch (e) {
              }
            }
          }
        }
        await this.generateTitle();
      } catch (error) {
        Toast.fail("生成失败");
      } finally {
        this.isGenerating = false;
      }
    },

    async generateTitle() {
      const currentDraft = this.draftTexts[this.currentIndex];
      const apiKey = process.env.VUE_APP_MOONSHOT_API_KEY;
      try {
        const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
          method: "POST",
          headers: {"Content-Type": "application/json", "Authorization": `Bearer ${apiKey}`},
          body: JSON.stringify({
            model: "moonshot-v1-8k",
            messages: [{role: "user", content: `请为以下作文起一个优美的标题，只输出标题文字：\n${currentDraft.text}`}]
          })
        });
        const res = await response.json();
        currentDraft.title = res.choices[0].message.content.replace(/[《》"“”]/g, '');
      } catch (e) {
        currentDraft.title = "未命名作文";
      }
    },

    async handleSave() {
      if (this.isGenerating) return;
      if (!this.currentStory.text) return Toast("请先生成内容");

      Toast.loading({message: '保存中...', forbidClick: true});
      try {
        await saveEssay({
          user_id: this.userId,
          chat_id: this.chatId,
          title: this.currentStory.title,
          content: this.currentStory.text,
          style: this.currentStory.style
        });
        Toast.success("保存成功");
        this.$router.replace('/storyitem');
      } catch (e) {
        Toast.fail("保存失败");
      }
    },

    regenerateStory() {
      if (this.draftTexts.length >= 3) return Toast("草稿已达上限");
      const nextStyle = this.styleOptions[this.draftTexts.length] || this.styleOptions[0];
      this.draftTexts.push({text: "", title: "", style: nextStyle});
      this.currentIndex = this.draftTexts.length - 1;
      this.generateStory();
    },

    deleteStory(index) {
      if (this.draftTexts.length <= 1) return;
      Dialog.confirm({message: '确定删除此草稿？'}).then(() => {
        this.draftTexts.splice(index, 1);
        this.currentIndex = Math.max(0, this.currentIndex - 1);
      });
    },

    switchStory(index) {
      if (this.isGenerating) return;
      this.currentIndex = index;
    },

    goBack() {
      this.$router.back();
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const el = this.$refs.contentBox;
        if (el) el.scrollTop = el.scrollHeight;
      });
    }
  }
};
</script>

<style scoped>
.All {
  width: 100%;
  min-height: 100vh;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
}

.TopBox {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 99;
  width: 100%;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e5e7eb;
}

.BackButton {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.TopTitle {
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
}

.Placeholder {
  width: 36px;
}

.StoryContainer {
  flex: 1;
  margin-top: 56px;
  padding: 16px 16px 120px;
}

.TabBar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
}

.TabItem {
  flex-shrink: 0;
  padding: 8px 16px;
  background: #fff;
  border-radius: 20px;
  border: 1px solid #e5e5e5;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.TabItem.active {
  background: #333;
  color: #fff;
  border-color: #333;
}

.StoryCard {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  overflow: hidden;
}

.TitleSection {
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.TitleInputField {
  width: 100%;
  height: 40px;
  border: none;
  font-size: 18px;
  font-weight: 600;
  outline: none;
  background: transparent;
}

.TitleInputField:disabled {
  color: #999;
}

.ContentSection {
  padding: 16px;
  position: relative;
}

.ContentArea {
  width: 100%;
  height: 400px;
  font-size: 15px;
  line-height: 1.8;
  color: #333;
  font-family: inherit;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.StyleTag {
  padding: 10px;
  background: #f9f9f9;
  font-size: 12px;
  color: #888;
  text-align: center;
  border-top: 1px solid #eee;
}

.BottomActions {
  position: fixed;
  bottom: 0;
  width: 100%;
  padding: 16px;
  background: #fff;
  border-top: 1px solid #eee;
  display: flex;
  gap: 12px;
  box-sizing: border-box;
}

.ActionButton {
  flex: 1;
  height: 48px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  transition: all 0.3s;
}

.PrimaryButton {
  background: #333;
  color: #fff;
}

.SecondaryButton {
  background: #fff;
  border: 1.5px solid #333;
  color: #333;
}

.FullWidth {
  flex: 1 !important;
}

.disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>