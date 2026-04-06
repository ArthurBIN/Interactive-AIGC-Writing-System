<template>
  <div class="UserPageContainer">
    <div class="TopNav">
      <span class="NavTitle">账户中心</span>
    </div>

    <div class="UserContent">
      <!-- 用户身份卡 -->
      <div class="UserIdentityCard">
        <div class="AvatarWrapper">
          <img src="../images/tx.png" alt="avatar">
        </div>
        <div class="InfoDetail">
          <h2 class="UserNick">{{ userNickname }}</h2>
          <div class="UserIdentity">
            <span class="IdLabel">UID: {{ userIdShort }}</span>
          </div>
        </div>
      </div>

      <!-- 写作成长统计 -->
      <div class="StatsSection" v-if="!statsLoading">
        <div class="SectionTitle">写作成长</div>

        <div class="StatsGrid">
          <div class="StatCard">
            <div class="StatNum">{{ stats.essayCount }}</div>
            <div class="StatLabel">篇作文</div>
          </div>
          <div class="StatCard">
            <div class="StatNum">{{ stats.analysisCount }}</div>
            <div class="StatLabel">次批改</div>
          </div>
          <div class="StatCard highlight">
            <div class="StatNum" :style="{ color: getScoreColor(stats.avgScore) }">
              {{ stats.avgScore || '-' }}
            </div>
            <div class="StatLabel">平均分</div>
          </div>
          <div class="StatCard highlight">
            <div class="StatNum" :style="{ color: getScoreColor(stats.bestScore) }">
              {{ stats.bestScore || '-' }}
            </div>
            <div class="StatLabel">最高分</div>
          </div>
        </div>

        <!-- 近期分数趋势 -->
        <div class="TrendCard" v-if="stats.recentScores.length >= 2">
          <div class="TrendHeader">
            <span class="TrendTitle">分数趋势</span>
            <span class="TrendSub">近 {{ stats.recentScores.length }} 次批改</span>
          </div>
          <div class="TrendChartWrap">
            <svg width="100%" height="70" :viewBox="`0 0 ${trendWidth} 70`" preserveAspectRatio="none">
              <!-- 横向参考线 -->
              <line x1="0" y1="15" :x2="trendWidth" y2="15" stroke="#f5f5f5" stroke-width="1"/>
              <line x1="0" y1="38" :x2="trendWidth" y2="38" stroke="#f5f5f5" stroke-width="1"/>
              <line x1="0" y1="61" :x2="trendWidth" y2="61" stroke="#f5f5f5" stroke-width="1"/>
              <!-- 渐变填充 -->
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#1989fa" stop-opacity="0.3"/>
                  <stop offset="100%" stop-color="#1989fa" stop-opacity="0.02"/>
                </linearGradient>
              </defs>
              <polygon :points="trendFillPoints" fill="url(#trendGrad)"/>
              <!-- 折线 -->
              <polyline
                  :points="trendLinePoints"
                  fill="none"
                  stroke="#1989fa"
                  stroke-width="2"
                  stroke-linejoin="round"
                  stroke-linecap="round"
              />
              <!-- 数据点 -->
              <circle
                  v-for="(pt, i) in trendPoints"
                  :key="i"
                  :cx="pt.x"
                  :cy="pt.y"
                  r="3.5"
                  fill="#1989fa"
                  stroke="#fff"
                  stroke-width="1.5"
              />
              <!-- 分数标签（仅首尾） -->
              <text
                  :x="trendPoints[0].x"
                  :y="trendPoints[0].y - 8"
                  text-anchor="middle"
                  font-size="10"
                  fill="#1989fa"
              >{{ stats.recentScores[0] }}</text>
              <text
                  :x="trendPoints[trendPoints.length - 1].x"
                  :y="trendPoints[trendPoints.length - 1].y - 8"
                  text-anchor="middle"
                  font-size="10"
                  fill="#1989fa"
              >{{ stats.recentScores[stats.recentScores.length - 1] }}</text>
            </svg>
            <div class="TrendRange">
              <span>{{ stats.minScore }}</span>
              <span>满分 100</span>
            </div>
          </div>
        </div>

        <!-- 写作弱项诊断 -->
        <div class="DiagCard" v-if="stats.totalAnnotations > 0">
          <div class="TrendHeader">
            <span class="TrendTitle">写作诊断报告</span>
            <span class="TrendSub">基于 {{ stats.totalAnnotations }} 条批注</span>
          </div>
          <div class="DiagList">
            <div class="DiagItem" v-for="item in weaknessItems" :key="item.type">
              <div class="DiagItemHeader">
                <span class="DiagTag" :style="{ background: item.bg, color: item.color }">
                  {{ item.label }}
                </span>
                <span class="DiagCount">{{ item.count }} 处</span>
                <span class="DiagPct">{{ getAnnotationPct(item.count) }}%</span>
              </div>
              <div class="DiagBar">
                <div
                    class="DiagBarFill"
                    :style="{ width: getAnnotationPct(item.count) + '%', background: item.color }"
                ></div>
              </div>
            </div>
          </div>
          <div class="DiagTip" v-if="weaknessTip">
            <van-icon name="bulb-o" color="#ff976a"/>
            {{ weaknessTip }}
          </div>
        </div>

        <!-- 无数据提示 -->
        <div class="NoDataTip" v-if="stats.analysisCount === 0">
          <span>上传作文，开始你的第一次 AI 批改吧</span>
        </div>
      </div>

      <!-- 加载中骨架 -->
      <div class="StatsSkeleton" v-else>
        <van-skeleton title :row="3"/>
      </div>

      <div class="ActionArea">
        <van-button
            block
            plain
            type="danger"
            class="LogoutVantBtn"
            @click="handleLogout"
        >
          退出当前账号
        </van-button>
      </div>
    </div>
  </div>
</template>

<script>
import {supabase} from "@/config/supabase";
import {logoutUser} from "@/api/auth";
import {Dialog, Toast} from "vant";

const TREND_WIDTH = 280;

export default {
  name: "UserPage",
  data() {
    return {
      session: null,
      statsLoading: true,
      stats: {
        essayCount: 0,
        analysisCount: 0,
        avgScore: 0,
        bestScore: 0,
        minScore: 0,
        recentScores: [],
        annotationTypes: {error: 0, suggestion: 0, structure: 0, highlight: 0},
        totalAnnotations: 0
      },
      trendWidth: TREND_WIDTH
    }
  },
  computed: {
    userNickname() {
      if (!this.session) return '';
      const {user} = this.session;
      return user.user_metadata?.nick_name || user.email?.split('@')[0] || '智慧创作者';
    },
    userIdShort() {
      return this.session?.user?.id?.substring(0, 8).toUpperCase() || '--------';
    },
    trendPoints() {
      const scores = this.stats.recentScores;
      if (scores.length < 2) return [];
      const n = scores.length;
      const padX = 16;
      const chartW = TREND_WIDTH - padX * 2;
      const minS = Math.min(...scores);
      const maxS = Math.max(...scores);
      const range = maxS - minS || 10;
      return scores.map((s, i) => ({
        x: padX + (i / (n - 1)) * chartW,
        y: 62 - ((s - minS) / range) * 50
      }));
    },
    trendLinePoints() {
      return this.trendPoints.map(p => `${p.x},${p.y}`).join(' ');
    },
    trendFillPoints() {
      if (this.trendPoints.length < 2) return '';
      const pts = this.trendPoints.map(p => `${p.x},${p.y}`).join(' ');
      const last = this.trendPoints[this.trendPoints.length - 1];
      const first = this.trendPoints[0];
      return `${pts} ${last.x},70 ${first.x},70`;
    },
    weaknessItems() {
      const t = this.stats.annotationTypes || {};
      const items = [
        {type: 'error', label: '语言准确性', count: t.error || 0, color: '#ff4d4f', bg: '#fff0f0'},
        {type: 'suggestion', label: '内容充实度', count: t.suggestion || 0, color: '#1890ff', bg: '#e6f7ff'},
        {type: 'structure', label: '篇章结构', count: t.structure || 0, color: '#722ed1', bg: '#f9f0ff'},
        {type: 'highlight', label: '写作亮点', count: t.highlight || 0, color: '#faad14', bg: '#fffbe6'},
      ];
      return items.sort((a, b) => b.count - a.count);
    },
    weaknessTip() {
      const problems = this.weaknessItems.filter(i => i.type !== 'highlight' && i.count > 0);
      if (!problems.length) return '';
      const tips = {
        error: '注意错别字和语法规范，写作前多检查用词是否准确',
        suggestion: '文章内容还需充实，多添加具体事例和细节描写',
        structure: '重点提升段落过渡和文章布局，注意逻辑层次',
      };
      return tips[problems[0].type] || '';
    }
  },
  async mounted() {
    const {data: {session}} = await supabase.auth.getSession();
    this.session = session;
    if (session) await this.loadStats(session.user.id);
    else this.statsLoading = false;
  },
  methods: {
    async loadStats(userId) {
      this.statsLoading = true;
      try {
        // 作文数量
        const {count: essayCount} = await supabase
            .from('essays')
            .select('id', {count: 'exact', head: true})
            .eq('user_id', userId);

        // 批改记录（按当前用户过滤）
        const {data: compositions} = await supabase
            .from('compositions')
            .select('result, created_at')
            .eq('user_id', userId)
            .order('created_at', {ascending: true});

        const scores = (compositions || [])
            .map(c => c.result?.score)
            .filter(s => typeof s === 'number' && s > 0);

        const recentScores = scores.slice(-8);

        // 批注类型分布
        const allAnnotations = (compositions || [])
            .flatMap(c => c.result?.annotations || []);
        const typeCount = {
          error: allAnnotations.filter(a => a.type === 'error').length,
          suggestion: allAnnotations.filter(a => a.type === 'suggestion').length,
          structure: allAnnotations.filter(a => a.type === 'structure').length,
          highlight: allAnnotations.filter(a => a.type === 'highlight').length,
        };

        this.stats = {
          essayCount: essayCount || 0,
          analysisCount: scores.length,
          avgScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
          bestScore: scores.length ? Math.max(...scores) : 0,
          minScore: scores.length ? Math.min(...scores) : 0,
          recentScores,
          annotationTypes: typeCount,
          totalAnnotations: Object.values(typeCount).reduce((a, b) => a + b, 0)
        };
      } catch (e) {
        console.error('加载统计失败', e);
      } finally {
        this.statsLoading = false;
      }
    },

    getAnnotationPct(count) {
      if (!this.stats.totalAnnotations) return 0;
      return Math.round(count / this.stats.totalAnnotations * 100);
    },

    getScoreColor(score) {
      if (!score) return '#999';
      if (score >= 90) return '#07c160';
      if (score >= 75) return '#1989fa';
      if (score >= 60) return '#ff976a';
      return '#ee0a24';
    },

    async handleLogout() {
      Dialog.confirm({
        title: '提示',
        message: '确定要退出当前登录账号吗？',
        confirmButtonColor: '#000',
        cancelButtonColor: '#969799',
      }).then(async () => {
        const {error} = await logoutUser();
        if (error) {
          Toast.fail("登出操作失败");
        } else {
          this.session = null;
          this.$router.replace("/login");
          Toast.success("已安全退出");
        }
      }).catch(() => {
      });
    }
  }
}
</script>

<style scoped>
.UserPageContainer {
  padding: 0 24px 40px;
  box-sizing: border-box;
}

/* 导航头 */
.TopNav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 54px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-bottom: 0.5px solid #eaeaea;
}

.NavTitle {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: 1px;
}

/* 个人信息卡片 */
.UserIdentityCard {
  background: #1a1a1a;
  border-radius: 20px;
  padding: 30px 24px;
  color: #ffffff;
  display: flex;
  align-items: center;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.12);
  margin-bottom: 30px;
}

.AvatarWrapper {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #333;
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  flex-shrink: 0;
}

.AvatarWrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.InfoDetail {
  margin-left: 16px;
}

.UserNick {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.UserIdentity {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.06);
  padding: 1px 6px;
  border-radius: 4px;
  font-family: monospace;
}


.LogoutVantBtn {
  height: 48px;
  border-radius: 12px !important;
  font-size: 15px;
  font-weight: 500;
  border-color: #ee0a24 !important;
  color: #ee0a24 !important;
}

/* ── 写作成长统计 ── */
.StatsSection {
  margin-bottom: 24px;
}

.SectionTitle {
  font-size: 14px;
  font-weight: 600;
  color: #888;
  letter-spacing: 1px;
  margin-bottom: 12px;
  text-transform: uppercase;
}

.StatsGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}

.StatCard {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.StatCard.highlight {
  background: #f8fbff;
  border: 1px solid #e4f0ff;
}

.StatNum {
  font-size: 30px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1;
  margin-bottom: 6px;
}

.StatLabel {
  font-size: 12px;
  color: #aaa;
}

/* 趋势图 */
.TrendCard {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.TrendHeader {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}

.TrendTitle {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.TrendSub {
  font-size: 12px;
  color: #bbb;
}

.TrendChartWrap {
  width: 100%;
}

.TrendRange {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #ccc;
  margin-top: 4px;
}

.NoDataTip {
  text-align: center;
  padding: 20px;
  font-size: 13px;
  color: #bbb;
  background: #fafafa;
  border-radius: 12px;
}

.StatsSkeleton {
  padding: 8px 0;
  margin-bottom: 24px;
}

.UserContent {
  padding-top: 30px;
}

/* 写作诊断卡片 */
.DiagCard {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  margin-top: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.DiagList {
  margin-bottom: 12px;
}

.DiagItem {
  margin-bottom: 10px;
}

.DiagItemHeader {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}

.DiagTag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.DiagCount {
  font-size: 12px;
  color: #666;
  flex: 1;
}

.DiagPct {
  font-size: 12px;
  color: #999;
  font-weight: 600;
}

.DiagBar {
  height: 5px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.DiagBarFill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;
}

.DiagTip {
  font-size: 13px;
  color: #666;
  background: #fff8f0;
  border-radius: 8px;
  padding: 10px 12px;
  line-height: 1.6;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  border-left: 3px solid #ff976a;
}
</style>