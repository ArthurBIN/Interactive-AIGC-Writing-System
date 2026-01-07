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
        ></textarea>

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
        <i class="iconfont icon-image"></i>
        <span>生成精美图片 / 打印</span>
      </van-button>
    </div>
  </div>
</template>

<script>
import {Toast} from "vant";
import {getEssayDetail, updateEssay} from "@/api/essay";

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
      isSaving: false
    }
  },

  async mounted() {
    this.essayId = this.$route.query.id;
    if (this.essayId) {
      await this.fetchDetail();
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
        Toast.success("保存成功");
      } catch (error) {
        Toast.fail("保存失败");
      } finally {
        this.isSaving = false;
      }
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

    handleShare() {
      Toast("链接已复制，去分享给好友吧");
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
  background-color: #f8f9fa;
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
</style>