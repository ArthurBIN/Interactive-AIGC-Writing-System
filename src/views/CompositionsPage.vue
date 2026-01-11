<template>
  <div class="CompositionsContainer">
    <van-list
        v-model="loading"
        :finished="finished"
        finished-text="没有更多历史记录了"
        @load="onLoad"
    >
      <div
          class="composition-card"
          v-for="item in list"
          :key="item.id"
          @click="goDetail(item.id)"
      >
        <div class="card-main">
          <h3 class="card-title van-ellipsis">{{ item.title || '无标题作文' }}</h3>
          <div class="card-info">
            <span class="card-time">{{ formatDate(item.created_at) }}</span>
          </div>
        </div>
        <div class="card-score" :class="getScoreClass(item.result?.score)">
          <span class="score-val">{{ item.result?.score || 0 }}</span>
          <span class="score-unit">分</span>
        </div>
      </div>
    </van-list>
  </div>
</template>

<script>
import {getCompositionList} from '@/api/composition';
import dayjs from 'dayjs';

export default {
  name: 'CompositionsPage',
  data() {
    return {
      list: [],
      loading: false,
      finished: false,
      refreshing: false
    };
  },
  methods: {
    async onLoad() {
      try {
        const data = await getCompositionList();

        if (this.refreshing) {
          this.list = [];
          this.refreshing = false;
        }
        this.list = data;
        this.finished = true;
      } catch (error) {
        this.$toast('获取列表失败，请检查网络');
        this.finished = true;
      } finally {
        this.loading = false;
      }
    },
    goDetail(id) {
      this.$router.push(`/analysis/${id}`);
    },
    formatDate(date) {
      return dayjs(date).format('YYYY-MM-DD HH:mm');
    },
    getScoreClass(score) {
      if (score >= 90) return 'score-excellent';
      if (score >= 75) return 'score-good';
      if (score >= 60) return 'score-pass';
      return 'score-fail';
    }
  }
};
</script>

<style scoped>
.CompositionsContainer {
  padding: 16px;
  box-sizing: border-box;
}

.composition-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s;
}

.composition-card:active {
  transform: scale(0.98);
  background-color: #fafafa;
}

.card-main {
  flex: 1;
  overflow: hidden;
  margin-right: 12px;
}

.card-title {
  font-size: 16px;
  color: #323233;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.card-info {
  font-size: 12px;
  color: #969799;
}

/* 分数圆圈样式 */
.card-score {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px solid #ebedf0;
}

.score-val {
  font-size: 18px;
  font-weight: bold;
}

.score-unit {
  font-size: 10px;
  margin-top: -2px;
}

/* 分数颜色等级 */
.score-excellent {
  color: #07c160;
  border-color: #c7f0db;
  background: #f0f9f4;
}

.score-good {
  color: #1989fa;
  border-color: #d1e5ff;
  background: #f0f7ff;
}

.score-pass {
  color: #ff976a;
  border-color: #ffe4d7;
  background: #fffbe8;
}

.score-fail {
  color: #ee0a24;
  border-color: #ffdada;
  background: #fff1f0;
}
</style>