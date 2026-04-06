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

      <div class="RightGroup" v-if="currentId && !loading">
        <div class="ReAnalyzeBtn" @click="confirmReAnalyze">
          <i class="iconfont icon-replay"></i>
          <span>重新分析</span>
        </div>
      </div>
    </div>

    <div v-if="!loading && content" class="analysis-content">
      <div class="score-card">
        <!-- 综合分数区 -->
        <div class="score-top-row">
          <div class="score-main">
            <div class="score-label">综合评分</div>
            <div class="score-num">{{ aiResult.score || 0 }}<span>分</span></div>
            <div class="score-level-tag" :class="getScoreLevelClass(aiResult.score)">
              {{ getScoreLevelText(aiResult.score) }}
            </div>
          </div>
        </div>

        <p class="summary-text">{{ aiResult.summary || 'AI 正在分析中...' }}</p>

        <!-- 多维度雷达图 -->
        <div class="radar-section" v-if="aiResult.dimensions && aiResult.dimensions.length === 5">
          <div class="radar-title">多维度评分</div>
          <RadarChart :scores="aiResult.dimensions" :size="200"/>
        </div>
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
import {getCompositionById, saveComposition, updateComposition} from "@/api/composition";
import RadarChart from "@/components/RadarChart.vue";

export default {
  name: 'AnalysisPage',
  components: {RadarChart},
  data() {
    return {
      title: '',
      content: '',
      loading: false,
      loadingTip: 'AI 老师正在批阅...',
      apiKey: process.env.VUE_APP_MOONSHOT_API_KEY,
      currentId: null,
      aiResult: {
        score: 0,
        dimensions: null,
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
        this.currentId = id;
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

    confirmReAnalyze() {
      Dialog.confirm({
        title: '重新分析',
        message: '将重新调用 AI 对当前作文进行批改，并覆盖原有结果，确认继续吗？',
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        confirmButtonColor: '#1989fa',
      }).then(() => {
        this.startAiAnalysis(true);
      }).catch(() => {});
    },

    async startAiAnalysis(isReAnalyze = false) {
      if (!this.apiKey) {
        Toast.fail('未配置 API Key');
        return;
      }

      this.loading = true;
      this.loadingTip = 'AI 老师正在多维度分析...';

      const systemPrompt = {
        role: "system",
        content: `你是一位全能的语文名师。请对作文进行深度分析，返回严格符合格式的 JSON 报告。

【五维评分】dimensions 数组按顺序对应（每项 0-100 整数）：
[内容立意, 结构布局, 语言表达, 情感共鸣, 创意亮点]

【批注维度（type）】：
1. error: 错别字或语法错误
2. highlight: 写作亮点或金句
3. suggestion: 逻辑不通或内容干瘪的修改建议
4. structure: 段落过渡或文章结构层面的点评

【JSON 结构】：
{
  "score": 88,
  "dimensions": [85, 90, 88, 82, 80],
  "summary": "整体点评，2-3句话",
  "annotations": [
    { "original": "原文片段", "suggestion": "修改建议", "reason": "批注理由", "startIndex": 0, "endIndex": 4, "type": "error" }
  ]
}

【规则】：
1. original 必须与原文完全一致，可用于 indexOf 定位。
2. dimensions 必须是长度为 5 的整数数组。
3. 只输出 JSON，不要有任何其他文字。`
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

        this.aiResult = rawResult;

        if (isReAnalyze && this.currentId) {
          // 重新分析：更新已有记录
          await updateComposition(this.currentId, {
            title: this.title,
            content: this.content,
            result: rawResult
          });
          Toast.success('重新分析完成');
        } else {
          // 首次分析：创建新记录
          const savedData = await saveComposition({
            title: this.title,
            content: this.content,
            result: rawResult
          });
          if (savedData?.id) {
            this.currentId = savedData.id;
            this.$router.replace(`/analysis/${savedData.id}`);
          }
          localStorage.removeItem('temp_composition_data');
        }
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

    getScoreLevelText(score) {
      if (!score) return '';
      if (score >= 90) return '优秀';
      if (score >= 80) return '良好';
      if (score >= 70) return '中等';
      if (score >= 60) return '及格';
      return '待提升';
    },

    getScoreLevelClass(score) {
      if (!score) return '';
      if (score >= 90) return 'level-excellent';
      if (score >= 80) return 'level-good';
      if (score >= 70) return 'level-medium';
      if (score >= 60) return 'level-pass';
      return 'level-fail';
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

.RightGroup {
  display: flex;
  align-items: center;
}

.ReAnalyzeBtn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #1989fa;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(25, 137, 250, 0.08);
}

.ReAnalyzeBtn i {
  font-size: 14px;
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
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.score-top-row {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.score-main {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-label {
  font-size: 13px;
  color: #999;
  margin-bottom: 2px;
}

.score-num {
  font-size: 48px;
  font-weight: bold;
  color: #1989fa;
  line-height: 1;
}

.score-num span {
  font-size: 16px;
  font-weight: normal;
  margin-left: 2px;
}

.score-level-tag {
  margin-top: 6px;
  padding: 2px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.level-excellent { background: #f0f9f4; color: #07c160; }
.level-good { background: #ecf5ff; color: #1989fa; }
.level-medium { background: #fff8e6; color: #ff976a; }
.level-pass { background: #fff3e6; color: #ff6900; }
.level-fail { background: #fff0f0; color: #ee0a24; }

.summary-text {
  font-size: 14px;
  color: #666;
  line-height: 1.7;
  margin: 0 0 16px;
  padding: 12px 14px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid #1989fa;
}

.radar-section {
  border-top: 1px solid #f5f5f5;
  padding-top: 16px;
}

.radar-title {
  font-size: 13px;
  color: #999;
  text-align: center;
  margin-bottom: 12px;
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