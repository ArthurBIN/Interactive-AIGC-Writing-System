<template>
  <div class="All">
    <div class="TopBox">
      <div class="BackButton" @click="goBack">
        <van-icon name="arrow-left"/>
      </div>
      <div class="TopTitle">卡片生成器</div>
      <div class="Placeholder"></div>
    </div>

    <div class="PreviewArea">
      <div class="PrintBox" ref="printBox" :style="{ backgroundColor: selectedBgColor }">

        <div class="illustrationBox" v-if="selectedIllustration">
          <img :src="selectedIllustration" alt="deco">
        </div>

        <div class="EssayPaper">
          <div class="CardHeader">
            <div class="CardTitle" v-if="essay.title">{{ essay.title }}</div>
            <div class="CardDivider"></div>
          </div>

          <div class="CardBody">{{ essay.content }}</div>

          <div class="CardFooter">
            <div class="BrandLogo">
              <span>Smart Essay</span>
              <div class="Dot"></div>
              <span>AI 灵感创作</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="EditPanel" :class="{ 'panel-hide': !showEdit }">
      <div class="PanelHandle" @click="showEdit = !showEdit">
        <van-icon :name="showEdit ? 'arrow-down' : 'arrow-up'"/>
        <span>{{ showEdit ? '收起配置' : '展开配置选项' }}</span>
      </div>

      <div class="PanelScrollContent">
        <div class="ConfigGroup">
          <div class="GroupLabel">背景颜色</div>
          <div class="HorizontalScroll">
            <div
                class="OptionSquare ColorItem"
                v-for="(color, index) in colorList"
                :key="'color-'+index"
                :class="{ active: selectedBgColor === color }"
                :style="{ backgroundColor: color }"
                @click="selectedBgColor = color"
            >
              <van-icon name="success" v-if="selectedBgColor === color" color="#fff"/>
            </div>
          </div>
        </div>

        <div class="ConfigGroup">
          <div class="GroupLabel">点缀装饰</div>
          <div class="HorizontalScroll">
            <div
                class="OptionSquare IlluItem"
                v-for="(item, index) in illustrationList"
                :key="'illu-'+index"
                :class="{ active: selectedIllustration === item }"
                @click="selectedIllustration = item"
            >
              <div v-if="!item" class="NoneBox">无</div>
              <img v-else :src="item" alt="">
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="BottomAction">
      <van-button
          type="default"
          block
          round
          class="ExportBtn"
          @click="saveCard"
          :loading="isExporting"
      >
        生成并保存卡片
      </van-button>
    </div>
  </div>
</template>

<script>
// 仅保留插画资源导入
import illustration1 from '../images/illustration1.png'
import illustration2 from '../images/illustration2.png'
import illustration3 from '../images/illustration3.png'
import illustration4 from '../images/illustration4.png'
import illustration5 from '../images/illustration5.png'
import illustration6 from '../images/illustration6.png'
import illustration7 from '../images/illustration7.png'
import illustration8 from '../images/illustration8.png'
import illustration9 from '../images/illustration9.png'
import illustration10 from '../images/illustration10.png'
import illustration11 from '../images/illustration11.png'
import illustration12 from '../images/illustration12.png'

import {Dialog, Toast} from "vant";
import html2canvas from "html2canvas";
import {getEssayDetail} from "@/api/essay";

export default {
  name: "PrintImgPage",
  data() {
    return {
      essayId: "",
      essay: {title: "", content: ""},
      isLoading: true,
      isExporting: false,
      showEdit: true,

      // 背景颜色列表（精选莫兰迪色系）
      selectedBgColor: '#F4F1EA',
      colorList: [
        '#F4F1EA', '#E8F3F1', '#F9E8E8', '#ECE9F2',
        '#FDF6E3', '#E1EAF9', '#E8F5E9', '#FFF3E0',
        '#F5F5F5', '#CFD8DC', '#D7CCC8', '#333333'
      ],

      selectedIllustration: null,
      illustrationList: [
        null, illustration1, illustration2, illustration3, illustration4,
        illustration5, illustration6, illustration7, illustration8,
        illustration9, illustration10, illustration11, illustration12
      ]
    }
  },
  async mounted() {
    this.essayId = this.$route.query.id;
    if (this.essayId) {
      await this.fetchDetail();
    } else {
      this.essay.title = this.$route.query.title || "未命名文章";
      this.essay.content = this.$route.query.content || "";
      this.isLoading = false;
    }
  },
  methods: {
    async fetchDetail() {
      try {
        const data = await getEssayDetail(this.essayId);
        this.essay = data;
      } catch (error) {
        Toast.fail("获取失败");
      } finally {
        this.isLoading = false;
      }
    },
    goBack() {
      this.$router.back();
    },
    async saveCard() {
      Dialog.confirm({title: '保存确认', message: '确认下载当前精美作文卡片吗？'}).then(async () => {
        this.isExporting = true;
        try {
          const printBox = this.$refs.printBox;
          const canvas = await html2canvas(printBox, {
            scale: 3,
            useCORS: true,
            backgroundColor: this.selectedBgColor // 导出时保留选定背景色
          });
          const link = document.createElement("a");
          link.href = canvas.toDataURL("image/png");
          link.download = `AI作文-${this.essay.title}.png`;
          link.click();
          Toast.success("保存成功");
        } catch (e) {
          Toast.fail("导出失败");
        } finally {
          this.isExporting = false;
        }
      });
    }
  }
}
</script>

<style scoped>
.All {
  width: 100%;
  min-height: 100vh;
  background-color: #f7f8fa;
}

/* 1. 顶部栏固定 */
.TopBox {
  position: fixed;
  top: 0;
  width: 100%;
  height: 50px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  box-sizing: border-box;
  border-bottom: 1px solid #f0f0f0;
  z-index: 200;
}

.BackButton {
  font-size: 20px;
}

.TopTitle {
  font-size: 16px;
  font-weight: 600;
}

.Placeholder {
  width: 20px;
}

/* 预览画板区 */
.PreviewArea {
  padding: 74px 20px 180px; /* 74px = 50px导航 + 24px间距 */
  display: flex;
  justify-content: center;
}

.PrintBox {
  width: 100%;
  max-width: 360px;
  min-height: 520px;
  position: relative;
  padding: 40px 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
  transition: background-color 0.3s ease;
}

/* 4. 装饰插画 - 缩小并避开标题区域 */
.illustrationBox {
  position: absolute;
  top: 5px;
  right: 5px;
  z-index: 10;
}

.illustrationBox img {
  width: 80px; /* 缩小尺寸 */
  height: auto;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

/* 白色纸张：解决溢出问题 */
.EssayPaper {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
}

.CardHeader {
  margin-bottom: 25px;
  position: relative;
}

.CardTitle {
  font-size: 19px;
  line-height: 2;
  font-weight: 800;
  text-align: center;
  font-family: serif;
  padding: 0 10px;
}

.CardDivider {
  width: 30px;
  height: 3px;
  background: #333;
  margin: 12px auto 0;
}

.CardBody {
  font-size: 15px;
  line-height: 2;
  color: #333;
  text-align: justify;
  white-space: pre-wrap;
  font-family: serif;
  flex: 1;
}

.CardFooter {
  margin-top: 30px;
  border-top: 1px solid #eee;
  padding-top: 15px;
}

.BrandLogo {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #bbb;
  letter-spacing: 1px;
}

.Dot {
  width: 3px;
  height: 3px;
  background: #ddd;
  border-radius: 50%;
  margin: 0 8px;
}

/* 2. 控制面板逻辑 */
.EditPanel {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: #fff;
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.06);
  z-index: 100;
  padding-bottom: 80px; /* 给固定按钮留位 */
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 隐藏时只露出 Handle 区域 */
.panel-hide {
  transform: translateY(250px);
}

.PanelHandle {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
}

.PanelScrollContent {
  padding: 0 20px 20px;
}

.ConfigGroup {
  margin-top: 16px;
}

.GroupLabel {
  font-size: 12px;
  color: #999;
  margin-bottom: 12px;
}

.HorizontalScroll {
  display: flex;
  overflow-x: auto;
  gap: 12px;
  padding: 4px 0;
}

.HorizontalScroll::-webkit-scrollbar {
  display: none;
}

.OptionSquare {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 12px;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
  overflow: hidden;
}

.ColorItem {
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.OptionSquare.active {
  border-color: #75A47F;
  transform: translateY(-2px);
}

.OptionSquare img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.NoneBox {
  font-size: 12px;
  color: #999;
}

/* 底部动作按钮 */
.BottomAction {
  position: fixed;
  bottom: 0;
  width: 100%;
  padding: 12px 20px;
  background: #fff;
  z-index: 110;
  border-top: 1px solid #f5f5f5;
  box-sizing: border-box;
}

.ExportBtn {
  border: 1.5px solid #333 !important;
  font-weight: 600 !important;
  color: #333 !important;
}
</style>