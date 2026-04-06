<template>
  <div class="CompositionsContainer">
    <van-list
        v-model="loading"
        :finished="finished"
        finished-text="没有更多历史记录了"
        @load="onLoad"
    >
      <van-swipe-cell
          v-for="item in list"
          :key="item.id"
          class="swipe-cell"
      >
        <div class="composition-card" @click="goDetail(item.id)">
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

        <template #right>
          <div class="delete-btn" @click="handleDelete(item.id)">
            <van-icon name="delete-o" size="22"/>
            <span>删除</span>
          </div>
        </template>
      </van-swipe-cell>
    </van-list>
  </div>
</template>

<script>
import {getCompositionList, deleteComposition} from '@/api/composition';
import {Dialog, Toast} from 'vant';
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
    handleDelete(id) {
      Dialog.confirm({
        title: '删除确认',
        message: '确定要删除这条批改记录吗？删除后不可恢复。',
        confirmButtonColor: '#ee0a24',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      }).then(async () => {
        try {
          await deleteComposition(id);
          this.list = this.list.filter(item => item.id !== id);
          Toast.success('删除成功');
        } catch (e) {
          Toast.fail('删除失败');
        }
      }).catch(() => {});
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
  min-height: 100%;
  padding: 12px 14px;
  box-sizing: border-box;
}

.swipe-cell {
  margin-bottom: 10px;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);
}

.composition-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px 16px 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-left: 4px solid #fa8c16;
  transition: background 0.15s;
}

.swipe-cell .composition-card {
  border-radius: 0;
}

.composition-card:active {
  background: #fafafa;
}

.card-main {
  flex: 1;
  overflow: hidden;
  margin-right: 14px;
}

.card-title {
  font-size: 16px;
  color: #1a1a2e;
  margin: 0 0 6px 0;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-info {
  font-size: 11px;
  color: #b0b5be;
}

/* 分数圆圈样式 */
.card-score {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2.5px solid #ebedf0;
  flex-shrink: 0;
}

.score-val {
  font-size: 19px;
  font-weight: 800;
  line-height: 1;
}

.score-unit {
  font-size: 10px;
  margin-top: 2px;
  opacity: 0.7;
}

.delete-btn {
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

/* 分数颜色等级 */
.score-excellent {
  color: #07c160;
  border-color: #a8e6c5;
  background: #f0faf5;
}

.score-good {
  color: #1989fa;
  border-color: #a8d4ff;
  background: #f0f7ff;
}

.score-pass {
  color: #fa8c16;
  border-color: #ffd591;
  background: #fff8ed;
}

.score-fail {
  color: #ee0a24;
  border-color: #ffb3b3;
  background: #fff1f0;
}
</style>