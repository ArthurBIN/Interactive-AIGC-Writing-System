<template>
  <div class="GoalContainer">
    <!-- 顶部栏 -->
    <div class="TopBox">
      <div class="BackBtn" @click="$router.back()">
        <i class="iconfont icon-fanhui"></i>
      </div>
      <div class="TopTitle">写作目标</div>
      <div class="AddBtn" @click="openAddDialog">
        <i class="iconfont icon-add"></i>
      </div>
    </div>

    <div class="PageContent">
      <!-- 进行中的目标 -->
      <div v-if="activeGoals.length > 0">
        <div class="SectionLabel">进行中</div>
        <div
            v-for="goal in activeGoals"
            :key="goal.id"
            class="GoalCard"
        >
          <div class="GoalTop">
            <div class="GoalTitle">{{ goal.title }}</div>
            <div class="GoalMenu">
              <i class="iconfont icon-shanchu DelIcon" @click="confirmDelete(goal)"></i>
            </div>
          </div>

          <div class="GoalDesc" v-if="goal.description">{{ goal.description }}</div>

          <!-- 进度条 -->
          <div class="ProgressRow">
            <div class="ProgressBar">
              <div
                  class="ProgressFill"
                  :style="{ width: getProgress(goal) + '%' }"
                  :class="{ full: getProgress(goal) >= 100 }"
              ></div>
            </div>
            <span class="ProgressText">{{ goal.completed_count }}/{{ goal.target_count }}</span>
          </div>

          <div class="GoalFooter">
            <span class="DeadlineTag" v-if="goal.deadline" :class="{ overdue: isOverdue(goal.deadline) }">
              <i class="iconfont icon-rili"></i>
              截止 {{ goal.deadline }}
              <span v-if="isOverdue(goal.deadline)">（已过期）</span>
            </span>
            <div class="GoalActions">
              <div class="ActionBtn add" @click="addProgress(goal)">
                <i class="iconfont icon-add"></i> 完成一篇
              </div>
              <div
                  class="ActionBtn done"
                  v-if="getProgress(goal) >= 100"
                  @click="markCompleted(goal)"
              >标为完成</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 已完成的目标 -->
      <div v-if="completedGoals.length > 0">
        <div class="SectionLabel" style="margin-top: 20px;">已完成</div>
        <div
            v-for="goal in completedGoals"
            :key="goal.id"
            class="GoalCard completed"
        >
          <div class="GoalTop">
            <div class="GoalTitle">
              <i class="iconfont icon-check-circle" style="color:#07c160;margin-right:6px;"></i>
              {{ goal.title }}
            </div>
            <i class="iconfont icon-shanchu DelIcon" @click="confirmDelete(goal)"></i>
          </div>
          <div class="ProgressRow">
            <div class="ProgressBar">
              <div class="ProgressFill full" style="width:100%"></div>
            </div>
            <span class="ProgressText">{{ goal.completed_count }}/{{ goal.target_count }}</span>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="goalList.length === 0" class="EmptyBox">
        <div class="EmptyIcon">🎯</div>
        <div class="EmptyText">还没有设定任何写作目标</div>
        <div class="EmptyTip">点击右上角 + 添加目标</div>
      </div>
    </div>

    <!-- 添加目标对话框 -->
    <van-dialog
        v-model="showAddDialog"
        title="添加写作目标"
        show-cancel-button
        :before-close="onBeforeCloseAdd"
    >
      <div class="DialogContent">
        <van-field
            v-model="form.title"
            label="目标名称"
            placeholder="例如：本周写3篇作文"
            clearable
            maxlength="50"
        />
        <van-field
            v-model="form.description"
            type="textarea"
            label="备注说明"
            placeholder="目标说明（可选）"
            rows="2"
            maxlength="100"
        />
        <van-field
            v-model.number="form.targetCount"
            type="digit"
            label="目标篇数"
            placeholder="计划完成多少篇"
        />
        <van-field
            v-model="form.deadline"
            label="截止日期"
            placeholder="YYYY-MM-DD（可选）"
            clearable
        />
      </div>
    </van-dialog>
  </div>
</template>

<script>
import { Toast, Dialog } from 'vant'
import { supabase } from '@/config/supabase'
import { getGoalList, addGoal, updateGoal, deleteGoal } from '@/api/goal'

export default {
  name: 'GoalPage',
  data() {
    return {
      userId: '',
      goalList: [],
      showAddDialog: false,
      form: {
        title: '',
        description: '',
        targetCount: '',
        deadline: ''
      }
    }
  },
  computed: {
    activeGoals() {
      return this.goalList.filter(g => !g.is_completed)
    },
    completedGoals() {
      return this.goalList.filter(g => g.is_completed)
    }
  },
  async mounted() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return this.$router.push('/login')
    this.userId = session.user.id
    await this.loadGoals()
  },
  methods: {
    async loadGoals() {
      try {
        this.goalList = await getGoalList(this.userId)
      } catch {
        Toast.fail('加载失败')
      }
    },

    openAddDialog() {
      this.form = { title: '', description: '', targetCount: '', deadline: '' }
      this.showAddDialog = true
    },

    async onBeforeCloseAdd(action, done) {
      if (action !== 'confirm') return done()
      if (!this.form.title.trim()) {
        Toast.fail('请填写目标名称')
        return done(false)
      }
      if (!this.form.targetCount || Number(this.form.targetCount) < 1) {
        Toast.fail('目标篇数至少为1')
        return done(false)
      }
      try {
        const goal = await addGoal({
          userId: this.userId,
          title: this.form.title.trim(),
          description: this.form.description.trim() || null,
          targetCount: Number(this.form.targetCount),
          deadline: this.form.deadline || null
        })
        this.goalList.unshift(goal)
        Toast.success('目标已添加')
        done()
      } catch {
        Toast.fail('添加失败')
        done(false)
      }
    },

    async addProgress(goal) {
      try {
        const updated = await updateGoal(goal.id, {
          completed_count: goal.completed_count + 1
        })
        const idx = this.goalList.findIndex(g => g.id === goal.id)
        if (idx !== -1) this.$set(this.goalList, idx, updated)
        Toast.success('进度 +1')
      } catch {
        Toast.fail('更新失败')
      }
    },

    async markCompleted(goal) {
      try {
        const updated = await updateGoal(goal.id, { is_completed: true })
        const idx = this.goalList.findIndex(g => g.id === goal.id)
        if (idx !== -1) this.$set(this.goalList, idx, updated)
        Toast.success('目标已完成！')
      } catch {
        Toast.fail('更新失败')
      }
    },

    confirmDelete(goal) {
      Dialog.confirm({ message: `确定删除目标「${goal.title}」吗？` }).then(async () => {
        try {
          await deleteGoal(goal.id)
          this.goalList = this.goalList.filter(g => g.id !== goal.id)
          Toast.success('已删除')
        } catch {
          Toast.fail('删除失败')
        }
      }).catch(() => {})
    },

    getProgress(goal) {
      if (!goal.target_count) return 0
      return Math.min(Math.round(goal.completed_count / goal.target_count * 100), 100)
    },

    isOverdue(deadline) {
      if (!deadline) return false
      return new Date(deadline) < new Date()
    }
  }
}
</script>

<style scoped>
.GoalContainer {
  min-height: 100vh;
  background: #f4f6f8;
}

.TopBox {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 54px;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  box-sizing: border-box;
  z-index: 100;
}

.BackBtn { width: 36px; height: 54px; display: flex; align-items: center; font-size: 20px; color: #333; }
.TopTitle { font-size: 16px; font-weight: 600; color: #111; position: absolute; left: 50%; transform: translateX(-50%); }
.AddBtn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 22px; background: #333; color: #fff; border-radius: 50%; }

.PageContent {
  padding: 70px 16px 30px;
}

.SectionLabel {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.GoalCard {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.GoalCard.completed { opacity: 0.65; }

.GoalTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.GoalTitle { font-size: 16px; font-weight: 600; color: #1a1a1a; flex: 1; }
.GoalDesc  { font-size: 13px; color: #999; margin-bottom: 10px; line-height: 1.5; }
.DelIcon   { font-size: 18px; color: #ddd; padding: 4px; }

/* 进度条 */
.ProgressRow {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.ProgressBar {
  flex: 1;
  height: 7px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}
.ProgressFill {
  height: 100%;
  background: #1989fa;
  border-radius: 4px;
  transition: width 0.4s ease;
}
.ProgressFill.full { background: #07c160; }
.ProgressText { font-size: 12px; color: #999; flex-shrink: 0; }

/* 底部操作 */
.GoalFooter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.DeadlineTag {
  font-size: 12px;
  color: #888;
  display: flex;
  align-items: center;
  gap: 4px;
}
.DeadlineTag.overdue { color: #ee0a24; }

.GoalActions { display: flex; gap: 8px; }
.ActionBtn {
  padding: 5px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}
.ActionBtn.add  { background: #f0f7ff; color: #1989fa; }
.ActionBtn.done { background: #f0fff5; color: #07c160; }

/* 空状态 */
.EmptyBox { text-align: center; padding: 60px 0; }
.EmptyIcon { font-size: 48px; margin-bottom: 12px; }
.EmptyText { font-size: 15px; color: #999; margin-bottom: 6px; }
.EmptyTip  { font-size: 13px; color: #bbb; }

/* 对话框 */
.DialogContent { padding: 12px 16px 16px; }
</style>
