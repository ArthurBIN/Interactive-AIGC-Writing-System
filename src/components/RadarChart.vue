<template>
  <div class="radar-wrap">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <!-- 背景同心多边形网格 -->
      <polygon
          v-for="level in 4"
          :key="'ring-' + level"
          :points="getRingPoints(level / 4)"
          fill="none"
          stroke="#f0f0f0"
          stroke-width="1"
      />
      <!-- 5条轴线 -->
      <line
          v-for="(_, i) in dimNames"
          :key="'axis-' + i"
          :x1="cx" :y1="cy"
          :x2="getPoint(i, 1).x" :y2="getPoint(i, 1).y"
          stroke="#e8e8e8"
          stroke-width="1"
      />
      <!-- 数据填充区域 -->
      <polygon
          :points="dataPoints"
          fill="rgba(25,137,250,0.15)"
          stroke="#1989fa"
          stroke-width="2"
          stroke-linejoin="round"
      />
      <!-- 数据点 -->
      <circle
          v-for="(score, i) in safeScores"
          :key="'dot-' + i"
          :cx="getPoint(i, score / 100).x"
          :cy="getPoint(i, score / 100).y"
          r="4"
          fill="#1989fa"
          stroke="#fff"
          stroke-width="2"
      />
      <!-- 维度标签 -->
      <text
          v-for="(dim, i) in dimNames"
          :key="'label-' + i"
          :x="getLabelPoint(i).x"
          :y="getLabelPoint(i).y"
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="11"
          fill="#888"
      >{{ dim }}</text>
    </svg>

    <!-- 图例 -->
    <div class="legend-row">
      <div class="legend-item" v-for="(dim, i) in dimNames" :key="'legend-' + i">
        <div class="legend-bar-wrap">
          <div
              class="legend-bar"
              :style="{ width: safeScores[i] + '%', background: getBarColor(safeScores[i]) }"
          ></div>
        </div>
        <span class="legend-name">{{ dim }}</span>
        <span class="legend-score" :style="{ color: getBarColor(safeScores[i]) }">{{ safeScores[i] }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RadarChart',
  props: {
    scores: {type: Array, default: () => [0, 0, 0, 0, 0]},
    size: {type: Number, default: 200}
  },
  data() {
    return {
      dimNames: ['内容立意', '结构布局', '语言表达', '情感共鸣', '创意亮点']
    }
  },
  computed: {
    cx() {
      return this.size / 2
    },
    cy() {
      return this.size / 2
    },
    r() {
      return this.size / 2 - 34
    },
    safeScores() {
      const arr = [...(this.scores || [])];
      while (arr.length < 5) arr.push(0);
      return arr.slice(0, 5);
    },
    dataPoints() {
      return this.safeScores.map((score, i) => {
        const p = this.getPoint(i, score / 100);
        return `${p.x},${p.y}`;
      }).join(' ');
    }
  },
  methods: {
    getAngle(i) {
      return -Math.PI / 2 + (2 * Math.PI * i) / 5;
    },
    getPoint(i, ratio) {
      const a = this.getAngle(i);
      return {
        x: this.cx + this.r * ratio * Math.cos(a),
        y: this.cy + this.r * ratio * Math.sin(a)
      };
    },
    getLabelPoint(i) {
      const a = this.getAngle(i);
      return {
        x: this.cx + (this.r + 22) * Math.cos(a),
        y: this.cy + (this.r + 22) * Math.sin(a)
      };
    },
    getRingPoints(ratio) {
      return Array.from({length: 5}, (_, i) => {
        const p = this.getPoint(i, ratio);
        return `${p.x},${p.y}`;
      }).join(' ');
    },
    getBarColor(score) {
      if (score >= 90) return '#07c160';
      if (score >= 75) return '#1989fa';
      if (score >= 60) return '#ff976a';
      return '#ee0a24';
    }
  }
}
</script>

<style scoped>
.radar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.legend-row {
  width: 100%;
  padding: 0 4px;
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-name {
  font-size: 12px;
  color: #888;
  width: 48px;
  flex-shrink: 0;
}

.legend-bar-wrap {
  flex: 1;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.legend-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;
}

.legend-score {
  font-size: 12px;
  font-weight: 700;
  width: 24px;
  text-align: right;
  flex-shrink: 0;
}
</style>
