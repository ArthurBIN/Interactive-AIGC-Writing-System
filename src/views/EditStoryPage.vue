<template>
  <div class="All">
    <div class="TopBox">
      <div class="LeftGroup">
        <div class="BackButton" @click="goBack">
          <i class="iconfont icon-fanhui"></i>
        </div>
      </div>

      <div class="TopTitle">作品详情</div>

      <div class="RightGroup">
        <div class="ActionIcon HistoryIcon" @click="openVersionHistory" title="历史版本">
          <van-icon name="clock-o"/>
          <span class="VersionBadge" v-if="versionCount > 0">{{ versionCount }}</span>
        </div>
        <div class="ActionIcon" @click="handleShare">
          <van-icon name="share-o"/>
        </div>
        <div class="SaveAction" @click="handleUpdate" :class="{ disabled: isSaving }">
          {{ isSaving ? '...' : '保存' }}
        </div>
      </div>
    </div>

    <van-skeleton title :row="10" v-if="isLoading" class="SkeletonBox"/>

    <div class="ContentContainer" v-else>
      <div class="EssayPaper">
        <div class="TitleWrapper">
          <input
              type="text"
              v-model="essay.title"
              placeholder="文章标题"
              class="EssayTitleInput"
          />
        </div>

        <div class="MetaInfo">
          <span class="StyleTag" v-if="essay.style">{{ essay.style }}</span>
          <span class="TimeText">{{ formatDateTime(essay.created_at) }}</span>
        </div>

        <textarea
            v-model="essay.content"
            class="EssayTextArea"
            placeholder="开始你的创作..."
            ref="contentTextarea"
            @mouseup="onTextSelect"
            @touchend="onTextSelect"
            @keyup="onTextSelect"
        ></textarea>

        <!-- AI改写工具栏：选中文字后出现 -->
        <transition name="slide-up">
          <div class="RewriteBar" v-if="showRewriteBar && selection">
            <span class="SelectInfo">已选 {{ selection.text.length }} 字</span>
            <span
                class="RewriteChip"
                @mousedown.prevent @touchstart.prevent
                @click="rewriteSelected('换个说法')"
            >换个说法</span>
            <span
                class="RewriteChip"
                @mousedown.prevent @touchstart.prevent
                @click="rewriteSelected('扩充内容')"
            >扩充内容</span>
            <span
                class="RewriteChip"
                @mousedown.prevent @touchstart.prevent
                @click="rewriteSelected('精简压缩')"
            >精简压缩</span>
          </div>
        </transition>

        <div class="WordCount">
          共 {{ essay.content ? essay.content.length : 0 }} 字
        </div>
      </div>
    </div>

    <div class="BottomBar" v-if="!isLoading">
      <van-button
          type="default"
          block
          round
          class="PrintButton"
          @click="goToPrint"
      >
        <span>生成精美图片 / 打印</span>
      </van-button>
    </div>

    <!-- 版本历史弹窗 -->
    <van-popup
        v-model="showVersions"
        round
        position="bottom"
        :style="{ height: '65%' }"
        closeable
    >
      <div class="VersionPanel">
        <div class="VersionPanelTitle">
          历史版本
          <span class="VersionPanelSub">每次保存自动记录 · 共 {{ versionList.length }} 个版本</span>
        </div>

        <div class="VersionLoading" v-if="versionLoading">
          <van-loading size="24px" vertical>加载中...</van-loading>
        </div>

        <van-empty description="还没有历史版本，保存后即可生成" v-else-if="versionList.length === 0"/>

        <div class="VersionList" v-else>
          <div class="VersionItem" v-for="v in versionList" :key="v.id">
            <div class="VersionItemHeader">
              <div class="VersionNumTag">版本 {{ v.version_num }}</div>
              <div class="VersionTime">{{ formatDateTime(v.created_at) }}</div>
            </div>
            <div class="VersionItemTitle">{{ v.title || '（无标题）' }}</div>
            <div class="VersionItemMeta">{{ v.word_count }} 字</div>
            <div class="VersionItemPreview">{{ v.content.substring(0, 55) }}…</div>
            <van-button
                size="small"
                round
                plain
                type="info"
                class="RestoreBtn"
                @click="restoreVersion(v)"
            >恢复此版本</van-button>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- AI改写结果弹窗 -->
    <van-popup
        v-model="showRewritePopup"
        round
        position="bottom"
        :style="{ height: '60%' }"
        closeable
        @closed="onRewritePopupClosed"
    >
      <div class="RewritePopup">
        <div class="RewritePopupTitle">
          AI 智能改写
          <span class="RewriteMode">· {{ currentRewriteMode }}</span>
        </div>

        <div class="RewriteLoading" v-if="rewriteLoading">
          <van-loading size="28px" vertical color="#1989fa">AI 正在改写中...</van-loading>
        </div>

        <div class="RewriteBody" v-else-if="rewriteResult">
          <div class="CompareBlock">
            <div class="BlockLabel original-label">原文</div>
            <div class="BlockText original-text">{{ selection && selection.text }}</div>
          </div>
          <div class="ArrowRow">
            <div class="ArrowLine"></div>
            <span class="ArrowIcon">↓</span>
            <div class="ArrowLine"></div>
          </div>
          <div class="CompareBlock">
            <div class="BlockLabel rewrite-label">改写后</div>
            <div class="BlockText rewrite-text">{{ rewriteResult }}</div>
          </div>
        </div>

        <div class="RewriteActions" v-if="!rewriteLoading && rewriteResult">
          <van-button round plain class="RejectBtn" @click="cancelRewrite">放弃</van-button>
          <van-button round type="info" class="AcceptBtn" @click="applyRewrite">采用此版本</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script>
import {Dialog, Toast} from "vant";
import {getEssayDetail, updateEssay} from "@/api/essay";
import {saveVersion, getVersions} from "@/api/essayVersion";

export default {
  name: "EditStoryPage",
  data() {
    return {
      essayId: "",
      essay: {
        title: "",
        content: "",
        style: "",
        created_at: ""
      },
      isLoading: true,
      isSaving: false,
      // 版本历史
      showVersions: false,
      versionList: [],
      versionLoading: false,
      versionCount: 0,
      // AI改写
      showRewriteBar: false,
      selection: null,
      showRewritePopup: false,
      rewriteLoading: false,
      rewriteResult: '',
      currentRewriteMode: ''
    }
  },

  async mounted() {
    this.essayId = this.$route.query.id;
    if (this.essayId) {
      await this.fetchDetail();
      // 后台静默获取版本数量
      getVersions(this.essayId)
          .then(list => { this.versionCount = list.length; })
          .catch(() => {});
    } else {
      Toast.fail("参数错误");
      this.goBack();
    }
  },

  methods: {
    async fetchDetail() {
      try {
        const data = await getEssayDetail(this.essayId);
        this.essay = data;
      } catch (error) {
        console.error(error);
        Toast.fail("获取作品失败");
      } finally {
        this.isLoading = false;
      }
    },

    async handleUpdate() {
      if (!this.essay.title || !this.essay.content) {
        return Toast("标题或内容不能为空");
      }

      this.isSaving = true;
      try {
        await updateEssay(this.essayId, {
          title: this.essay.title,
          content: this.essay.content
        });
        // 自动保存版本快照
        await saveVersion(this.essayId, {
          title: this.essay.title,
          content: this.essay.content
        });
        this.versionCount++;
        Toast.success("保存成功");
      } catch (error) {
        Toast.fail("保存失败");
      } finally {
        this.isSaving = false;
      }
    },

    // ── 版本历史 ──
    async openVersionHistory() {
      this.showVersions = true;
      this.versionLoading = true;
      try {
        this.versionList = await getVersions(this.essayId);
        this.versionCount = this.versionList.length;
      } catch (e) {
        Toast.fail('加载版本历史失败');
      } finally {
        this.versionLoading = false;
      }
    },

    restoreVersion(version) {
      Dialog.confirm({
        title: `恢复到版本 ${version.version_num}`,
        message: `创建于 ${this.formatDateTime(version.created_at)}，共 ${version.word_count} 字。当前内容将被替换，确认恢复吗？`,
        confirmButtonText: '恢复',
        cancelButtonText: '取消',
        confirmButtonColor: '#1989fa',
      }).then(() => {
        this.essay.title = version.title;
        this.essay.content = version.content;
        this.showVersions = false;
        Toast.success(`已恢复到版本 ${version.version_num}`);
      }).catch(() => {});
    },

    // ── AI改写 ──
    onTextSelect() {
      setTimeout(() => {
        const el = this.$refs.contentTextarea;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const text = this.essay.content.substring(start, end);
        if (text.trim().length >= 8) {
          this.selection = {start, end, text: text.trim()};
          this.showRewriteBar = true;
        } else {
          this.showRewriteBar = false;
          this.selection = null;
        }
      }, 50);
    },

    async rewriteSelected(mode) {
      if (!this.selection) return;
      this.currentRewriteMode = mode;
      this.showRewritePopup = true;
      this.rewriteLoading = true;
      this.rewriteResult = '';

      const modeMap = {
        '换个说法': '用不同的表达方式改写以下文字，保持相同的意思但换一种说法，语言风格与原文保持一致',
        '扩充内容': '对以下文字进行扩充，增加细节描写和情感表达，让内容更加丰富生动，字数扩展为原来的1.5到2倍',
        '精简压缩': '对以下文字进行精简，保留核心意思，删去冗余部分，使表达更加简洁有力'
      };

      const apiKey = process.env.VUE_APP_MOONSHOT_API_KEY;
      try {
        const res = await fetch("https://api.moonshot.cn/v1/chat/completions", {
          method: "POST",
          headers: {"Content-Type": "application/json", "Authorization": `Bearer ${apiKey}`},
          body: JSON.stringify({
            model: "moonshot-v1-8k",
            messages: [
              {role: "system", content: "你是一个专业的作文改写助手。只输出改写后的文字，不要解释说明，不要加引号或标题。"},
              {role: "user", content: `${modeMap[mode]}：\n\n${this.selection.text}`}
            ],
            temperature: 0.7
          })
        });
        const data = await res.json();
        this.rewriteResult = data.choices[0].message.content.trim();
      } catch (e) {
        Toast.fail('改写失败，请重试');
        this.showRewritePopup = false;
      } finally {
        this.rewriteLoading = false;
      }
    },

    applyRewrite() {
      if (!this.selection || !this.rewriteResult) return;
      const {start, end} = this.selection;
      this.essay.content =
          this.essay.content.substring(0, start) +
          this.rewriteResult +
          this.essay.content.substring(end);
      Toast.success('已替换');
      this.showRewritePopup = false;
      this.showRewriteBar = false;
      this.selection = null;
    },

    cancelRewrite() {
      this.showRewritePopup = false;
    },

    onRewritePopupClosed() {
      this.rewriteResult = '';
      this.rewriteLoading = false;
    },

    // 前往生成图片页
    goToPrint() {
      if (!this.essay.content) return Toast("内容不能为空");
      this.$router.push({
        path: '/printimg',
        query: {
          id: this.essayId
        }
      });
    },

    async handleShare() {
      const shareText = `《${this.essay.title}》\n\n${this.essay.content}`;

      // 优先使用系统原生分享（移动端）
      if (navigator.share) {
        try {
          await navigator.share({
            title: this.essay.title,
            text: shareText,
          });
          return;
        } catch (e) {
          // 用户取消分享，不做处理
          if (e.name === 'AbortError') return;
        }
      }

      // 降级：复制正文到剪贴板
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareText);
        } else {
          const el = document.createElement('textarea');
          el.value = shareText;
          el.style.position = 'fixed';
          el.style.opacity = '0';
          document.body.appendChild(el);
          el.focus();
          el.select();
          document.execCommand('copy');
          document.body.removeChild(el);
        }
        Toast.success('内容已复制到剪贴板');
      } catch (e) {
        Toast.fail('复制失败，请手动复制');
      }
    },

    goBack() {
      this.$router.back();
    },

    formatDateTime(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
  }
}
</script>

<style scoped>
.All {
  width: 100%;
  padding-bottom: 80px;
}

/* 顶部导航增强 */
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

.LeftGroup, .RightGroup {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ActionIcon {
  font-size: 22px;
  color: #333;
  padding: 4px;
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

.SaveAction {
  padding: 4px 8px;
  color: #2563eb;
  font-weight: 600;
  font-size: 15px;
}

.disabled {
  opacity: 0.5;
}

/* 内容区域 */
.ContentContainer {
  margin-top: 56px;
  padding: 16px;
}

.EssayPaper {
  background: #fff;
  border-radius: 12px;
  padding: 24px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  min-height: 75vh;
  display: flex;
  flex-direction: column;
}

.TitleWrapper {
  margin-bottom: 12px;
}

.EssayTitleInput {
  width: 100%;
  border: none;
  font-size: 22px;
  font-weight: 700;
  color: #111;
  outline: none;
  background: transparent;
}

.MetaInfo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.StyleTag {
  background: #f0f4ff;
  color: #3b82f6;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.TimeText {
  color: #aaa;
  font-size: 11px;
}

.EssayTextArea {
  width: 100%;
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  padding: 0;
  resize: none;
  background: transparent;
}

.WordCount {
  margin-top: 16px;
  text-align: right;
  font-size: 12px;
  color: #ccc;
  border-top: 1px solid #f5f5f5;
  padding-top: 12px;
}

/* 底部按钮 */
.BottomBar {
  position: fixed;
  bottom: 0;
  width: 100%;
  padding: 12px 20px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
  box-sizing: border-box;
}

.PrintButton {
  border: 1.5px solid #333 !important;
  font-weight: 600 !important;
  color: #333 !important;
}

.PrintButton i {
  margin-right: 6px;
  font-size: 18px;
}

.SkeletonBox {
  margin-top: 70px;
  padding: 20px;
}

/* 版本历史图标 */
.HistoryIcon {
  position: relative;
}

.VersionBadge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  background: #1989fa;
  color: #fff;
  border-radius: 8px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  pointer-events: none;
}

/* 版本历史弹窗 */
.VersionPanel {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.VersionPanelTitle {
  font-size: 16px;
  font-weight: 600;
  color: #111;
  margin-bottom: 4px;
}

.VersionPanelSub {
  display: block;
  font-size: 12px;
  color: #bbb;
  font-weight: normal;
  margin-top: 2px;
  margin-bottom: 14px;
}

.VersionLoading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.VersionList {
  flex: 1;
  overflow-y: auto;
}

.VersionItem {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 12px;
  border: 1px solid #f0f0f0;
}

.VersionItemHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.VersionNumTag {
  background: #1989fa;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.VersionTime {
  font-size: 11px;
  color: #bbb;
}

.VersionItemTitle {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.VersionItemMeta {
  font-size: 12px;
  color: #999;
  margin-bottom: 6px;
}

.VersionItemPreview {
  font-size: 13px;
  color: #888;
  line-height: 1.6;
  margin-bottom: 10px;
}

.RestoreBtn {
  width: 100%;
  height: 36px;
}

/* AI改写工具栏 */
.RewriteBar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0 4px;
  flex-wrap: wrap;
}

.SelectInfo {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
}

.RewriteChip {
  padding: 5px 12px;
  border-radius: 14px;
  background: #ecf5ff;
  color: #1989fa;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #d0e8ff;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.RewriteChip:active {
  background: #1989fa;
  color: #fff;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s ease;
}
.slide-up-enter,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* 改写弹窗 */
.RewritePopup {
  padding: 20px 16px 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.RewritePopupTitle {
  font-size: 16px;
  font-weight: 600;
  color: #111;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.RewriteMode {
  color: #1989fa;
  font-weight: normal;
  font-size: 14px;
}

.RewriteLoading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.RewriteBody {
  flex: 1;
  overflow-y: auto;
}

.CompareBlock {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 4px;
}

.BlockLabel {
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}

.original-label { color: #999; }
.rewrite-label { color: #1989fa; }

.BlockText {
  font-size: 14px;
  line-height: 1.7;
  color: #333;
  white-space: pre-wrap;
}

.original-text {
  color: #888;
  text-decoration: line-through;
  text-decoration-color: #ccc;
}

.rewrite-text {
  color: #1a1a1a;
}

.ArrowRow {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  gap: 6px;
}

.ArrowLine {
  flex: 1;
  height: 1px;
  background: #e5e5e5;
}

.ArrowIcon {
  color: #1989fa;
  font-size: 16px;
}

.RewriteActions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  flex-shrink: 0;
}

.RejectBtn {
  flex: 1;
  height: 44px;
}

.AcceptBtn {
  flex: 2;
  height: 44px;
}
</style>