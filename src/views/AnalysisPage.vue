<template>
  <div class="AnalysisContainer">
    <van-overlay :show="loading" class="full-loading">
      <div class="loading-wrapper">
        <van-loading size="45px" vertical color="#1989fa">
          <span class="loading-text">{{ loadingTip }}</span>
        </van-loading>
      </div>
    </van-overlay>

    <div class="TopBox">
      <div class="LeftGroup">
        <div class="BackButton" @click="goBack">
          <i class="iconfont icon-fanhui"></i>
        </div>
      </div>

      <div class="TopTitle">作文智评</div>
    </div>

    <div v-if="!loading && content" class="analysis-content">
      <div class="score-card">
        <div class="score-label">综合评分</div>
        <div class="score-num">{{ aiResult.score || 0 }}<span>分</span></div>
        <p class="summary-text">{{ aiResult.summary || 'AI 正在分析中...' }}</p>
      </div>

      <article class="paper-body">
        <header class="title-area">
          <h2>{{ title }}</h2>
        </header>

        <div class="content-render">
          <template v-for="(chunk, index) in renderedChunks">
            <span v-if="chunk.type === 'none'" :key="index">{{ chunk.text }}</span>
            <span
                v-else
                :key="index"
                :class="['mark-item', `mark-${chunk.type}`]"
                @click="handleMarkClick(chunk.info)"
            >
              {{ chunk.text }}
            </span>
          </template>
        </div>
      </article>

      <div class="footer-tip">点击高亮部分查看 AI 老师的点评</div>
    </div>

    <van-popup
        v-model="popShow"
        round
        position="bottom"
        :style="{ height: '40%' }"
        closeable
    >
      <div class="PopContent" v-if="popContent">
        <div class="pop-header">
          <span :class="['pop-tag', `tag-${popContent.type}`]">
            {{ getMarkTitle(popContent.type) }}
          </span>
        </div>

        <div class="pop-original">
          <div class="label">原文片段</div>
          <div class="text"
               :class="(popContent.type === 'error' || popContent.type === 'suggestion') ? 'text-error' : ''"
          >
            {{ popContent.original }}
          </div>
        </div>

        <div class="pop-suggestion" v-if="popContent.suggestion">
          <div class="label">修改建议</div>
          <div class="text highlight-text">{{ popContent.suggestion }}</div>
        </div>

        <div class="pop-reason">
          <div class="label">批注详情</div>
          <div class="text quote">{{ popContent.reason }}</div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script>
import {Dialog, Toast} from 'vant';
import {getCompositionById, saveComposition} from "@/api/composition";

export default {
  name: 'AnalysisPage',
  data() {
    return {
      title: '',
      content: '',
      loading: false,
      loadingTip: 'AI 老师正在批阅...',
      apiKey: process.env.VUE_APP_MOONSHOT_API_KEY,
      aiResult: {
        score: 0,
        summary: '',
        annotations: []
      },
      popShow: false,
      popContent: null,
    };
  },
  computed: {
    renderedChunks() {
      if (!this.content) return [];
      const annotations = this.aiResult.annotations || [];
      if (annotations.length === 0) {
        return [{text: this.content, type: 'none'}];
      }

      const sortedNotes = [...annotations].sort((a, b) => a.startIndex - b.startIndex);
      let chunks = [];
      let lastIndex = 0;

      sortedNotes.forEach(note => {
        if (note.startIndex < lastIndex) return;

        if (note.startIndex > lastIndex) {
          chunks.push({
            text: this.content.substring(lastIndex, note.startIndex),
            type: 'none'
          });
        }
        chunks.push({
          text: this.content.substring(note.startIndex, note.endIndex),
          type: note.type,
          info: note
        });
        lastIndex = note.endIndex;
      });

      if (lastIndex < this.content.length) {
        chunks.push({
          text: this.content.substring(lastIndex),
          type: 'none'
        });
      }
      return chunks;
    }
  },
  created() {
    this.initPage();
  },
  methods: {
    initPage() {
      const id = this.$route.params.id;
      if (id) {
        this.loadHistoryData(id)
      } else {
        const localData = localStorage.getItem('temp_composition_data');
        if (localData) {
          const parsed = JSON.parse(localData);
          this.title = parsed.title;
          this.content = parsed.content;
          this.startAiAnalysis();
        } else {
          this.handleEmpty();
        }
      }
    },

    async loadHistoryData(id) {
      this.loading = true;
      try {
        const data = await getCompositionById(id);
        this.title = data.title;
        this.content = data.content;
        this.aiResult = data.result;
      } catch (err) {
        Toast.fail('获取历史数据失败');
      } finally {
        this.loading = false;
      }
    },

    fixAnnotations(annotations) {
      let lastSearchIndex = 0;
      return annotations.map(note => {
        const realIndex = this.content.indexOf(note.original, lastSearchIndex);
        if (realIndex !== -1) {
          lastSearchIndex = realIndex + note.original.length;
          return {
            ...note,
            startIndex: realIndex,
            endIndex: realIndex + note.original.length
          };
        }
        return note;
      }).filter(note => this.content.substring(note.startIndex, note.endIndex) === note.original);
    },

    async startAiAnalysis() {
      if (!this.apiKey) {
        Toast.fail('未配置 API Key');
        return;
      }

      this.loading = true;
      this.loadingTip = 'AI 老师正在多维度分析...';

      const systemPrompt = {
        role: "system",
        content: `你是一位全能的语文名师。请从多个维度深度分析作文并返回 JSON 报告。

        【点评维度（type）】：
        1. error: 错别字或语法错误
        2. highlight: 写作亮点或金句
        3. suggestion: 逻辑不通或内容干瘪的修改建议
        4. structure: 段落过渡或文章结构层面的点评

        【必须遵守的数据结构】：
        所有维度的批注必须统一放在一个 "annotations" 数组里。

        【JSON 示例】：
        {
          "score": 90,
          "summary": "文章整体点评...",
          "annotations": [
            { "original": "片段", "suggestion": "建议内容", "reason": "理由", "startIndex": 0, "endIndex": 2, "type": "error" },
            { "original": "片段", "suggestion": "", "reason": "理由", "startIndex": 5, "endIndex": 10, "type": "structure" }
          ]
        }

        【规则】：
        1. original 必须与原文完全一致。
        2. 不要返回任何 JSON 以外的文字。`
      };

      try {
        const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: "moonshot-v1-8k",
            messages: [
              systemPrompt,
              {role: "user", content: `正文内容：${this.content}`}
            ],
            temperature: 0.3,
            max_tokens: 4000
          })
        });

        const data = await response.json();
        const jsonStr = data.choices[0].message.content.replace(/```json|```/g, '').trim();
        const rawResult = JSON.parse(jsonStr);

        if (rawResult.annotations && rawResult.annotations.length > 0) {
          rawResult.annotations = this.fixAnnotations(rawResult.annotations);
        }

        // 2. 整体存储：不拆开，直接存入 result 字段
        const savedData = await saveComposition({
          title: this.title,
          content: this.content,
          result: rawResult
        });

        this.aiResult = rawResult;

        if (savedData?.id) {
          this.$router.replace(`/analysis/${savedData.id}`);
        }
        localStorage.removeItem('temp_composition_data');
      } catch (error) {
        Toast.fail('解析或存档异常');
      } finally {
        this.loading = false;
      }
    },

    handleMarkClick(info) {
      this.popContent = info;
      this.popShow = true;
    },

    getMarkTitle(type) {
      const titles = {
        error: '语法改进',
        highlight: '名师赏析',
        suggestion: '逻辑优化',
        structure: '篇章布局',
      };
      return titles[type] || '详情';
    },

    handleEmpty() {
      Dialog.alert({message: '未找到内容'}).then(() => this.$router.replace('/upload'));
    },

    goBack() {
      this.$router.back();
    },
  }
}
</script>

<style scoped>
.TopBox {
  position: fixed;
  top: 0;
  width: 100%;
  height: 56px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  box-sizing: border-box;
  z-index: 100;
  border-bottom: 1px solid #f0f0f0;
}

.LeftGroup {
  display: flex;
  align-items: center;
  gap: 12px;
}

.BackButton {
  font-size: 20px;
  color: #333;
}

.TopTitle {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 16px;
  font-weight: 600;
  color: #111;
}

.full-loading {
  background-color: #ffffff !important;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.loading-wrapper {
  text-align: center;
}

.loading-text {
  margin-top: 15px;
  color: #1989fa;
  font-weight: 500;
}

.AnalysisContainer {
  background-color: #f4f6f8;
}

.analysis-content {
  padding: 66px 16px 50px;
}

.score-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.score-label {
  font-size: 14px;
  color: #999;
}

.score-num {
  font-size: 44px;
  font-weight: bold;
  color: #1989fa;
}

.score-num span {
  font-size: 16px;
}

.summary-text {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-top: 10px;
}

.paper-body {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  min-height: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.title-area h2 {
  text-align: center;
  font-size: 20px;
  margin-bottom: 24px;
  color: #333;
}

.content-render {
  font-size: 17px;
  line-height: 2.6;
  color: #333;
  white-space: pre-wrap;
  word-break: break-all;
}

.mark-item {
  cursor: pointer;
  padding: 2px 0;
  margin: 0 1px;
  transition: all 0.2s;
}

/* 样式区分 */
.mark-error {
  background-color: rgba(255, 77, 79, 0.15);
  border-bottom: 2px dashed #ff4d4f;
}

.mark-highlight {
  background-color: rgba(255, 193, 7, 0.2);
  border-bottom: 2px solid #ffc107;
}

.mark-suggestion {
  background-color: rgba(24, 144, 255, 0.1);
  border-bottom: 2px dotted #1890ff;
}

.mark-structure {
  background-color: rgba(114, 46, 209, 0.1);
  border-bottom: 2px solid #722ed1;
}

.footer-tip {
  text-align: center;
  color: #bbb;
  font-size: 12px;
  margin-top: 20px;
}

/* 弹窗整体内边距 */
.PopContent {
  padding: 24px 20px;
  background-color: #fff;
}

.pop-header {
  margin-bottom: 20px;
}

/* 标签样式 */
.pop-tag {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: bold;
}

/* 不同类型标签的色彩映射 */
.tag-error {
  background: #fff1f0;
  color: #ff4d4f;
}

.tag-highlight {
  background: #fffbe6;
  color: #faad14;
}

.tag-suggestion {
  background: #e6f7ff;
  color: #1890ff;
}

.tag-idiom {
  background: #f6ffed;
  color: #52c41a;
}

.tag-structure {
  background: #f9f0ff;
  color: #722ed1;
}

.tag-emotion {
  background: #fff0f6;
  color: #eb2f96;
}

/* 模块通用样式 */
.pop-original, .pop-suggestion, .pop-reason {
  margin-bottom: 18px;
}

.label {
  font-size: 12px;
  color: #999;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
}

/* 原文展示 */
.pop-original .text {
  font-size: 15px;
  color: #666;
}

.pop-original .text-error {
  text-decoration: line-through;
}

/* 建议文字突出显示 */
.highlight-text {
  font-size: 16px;
  font-weight: 600;
  color: #52c41a; /* 建议通常用正面色彩展示 */
}

/* 引用块样式（用于批注理由） */
.quote {
  font-size: 15px;
  color: #444;
  line-height: 1.6;
  padding-left: 12px;
  border-left: 4px solid #eee;
  font-style: italic;
}

/* 针对结构点评等的特殊样式微调 */
.pop-reason .text {
  white-space: pre-line;
}
</style>