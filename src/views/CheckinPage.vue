<template>
  <div class="CheckinContainer">
    <!-- 顶部栏 -->
    <div class="TopBox">
      <div class="TopRow">
        <div class="BackBtn" @click="$router.back()">
          <i class="iconfont icon-fanhui"></i>
        </div>
        <div class="TopTitle">写作打卡</div>
        <div class="Placeholder"></div>
      </div>
      <div class="MonthNav">
        <i class="iconfont icon-xiangzuojiantou NavArrow" @click="prevMonth"></i>
        <span class="MonthLabel">{{ currentYear }}年{{ currentMonth }}月</span>
        <i class="iconfont icon-xiangyoujiantou NavArrow" @click="nextMonth"></i>
      </div>
    </div>

    <div class="PageContent">
      <!-- 统计卡 -->
      <div class="StatsRow">
        <div class="StatItem">
          <div class="StatNum streak">{{ streakDays }}</div>
          <div class="StatLabel">连续天数</div>
        </div>
        <div class="StatItem">
          <div class="StatNum">{{ totalDays }}</div>
          <div class="StatLabel">累计打卡</div>
        </div>
        <div class="StatItem">
          <div class="StatNum">{{ monthDays }}</div>
          <div class="StatLabel">本月打卡</div>
        </div>
      </div>

      <!-- 月历 -->
      <div class="CalendarCard">
        <div class="WeekHeader">
          <span v-for="d in weekDays" :key="d" class="WeekDay">{{ d }}</span>
        </div>
        <div class="DayGrid">
          <div v-for="cell in calendarCells" :key="cell.key" class="DayCell">
            <div
                v-if="cell.day"
                class="DayNum"
                :class="{
                  checked: cell.checked,
                  today: cell.isToday,
                  future: cell.isFuture
                }"
            >{{ cell.day }}</div>
            <div v-else class="DayNum placeholder"></div>
          </div>
        </div>
      </div>

      <!-- 今日打卡 -->
      <div class="TodayCard">
        <div class="TodayHeader">
          <div class="TodayTitle">
            <span v-if="todayChecked" class="CheckedBadge">✓ 今日已打卡</span>
            <span v-else class="UncheckedBadge">今日待打卡</span>
          </div>
          <div class="TodayDate">{{ todayStr }}</div>
        </div>

        <div v-if="todayChecked" class="TodayResult">
          <div class="ResultRow">
            <span class="ResultLabel">今日字数</span>
            <span class="ResultVal">{{ todayRecord.word_count }} 字</span>
          </div>
          <div class="ResultRow" v-if="todayRecord.note">
            <span class="ResultLabel">今日记录</span>
            <span class="ResultVal note">{{ todayRecord.note }}</span>
          </div>
        </div>

        <div v-else class="CheckinForm">
          <van-field
              v-model.number="form.wordCount"
              type="digit"
              label="今日字数"
              placeholder="输入今日写作字数"
              clearable
          />
          <van-field
              v-model="form.note"
              type="textarea"
              label="今日记录"
              placeholder="记录今天的写作感受（可选）"
              rows="2"
              maxlength="100"
          />
          <van-button
              block
              class="CheckinBtn"
              :loading="submitting"
              @click="submitCheckin"
          >
            立即打卡
          </van-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Toast } from 'vant'
import { supabase } from '@/config/supabase'
import { getMonthCheckins, getTodayCheckin, doCheckin, getAllCheckins } from '@/api/checkin'

export default {
  name: 'CheckinPage',
  data() {
    const now = new Date()
    return {
      userId: '',
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1,
      weekDays: ['日', '一', '二', '三', '四', '五', '六'],
      checkedDates: new Set(),    // 当月已打卡日期 set（日期字符串 YYYY-MM-DD）
      allCheckedDates: new Set(), // 全量已打卡日期，用于计算连续天数
      todayChecked: false,
      todayRecord: null,
      submitting: false,
      form: { wordCount: '', note: '' }
    }
  },
  computed: {
    todayStr() {
      const d = new Date()
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    },
    monthDays() {
      return this.checkedDates.size
    },
    totalDays() {
      return this.allCheckedDates.size
    },
    streakDays() {
      let streak = 0
      const today = new Date()
      for (let i = 0; i < 365; i++) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        const key = d.toISOString().slice(0, 10)
        if (this.allCheckedDates.has(key)) {
          streak++
        } else {
          break
        }
      }
      return streak
    },
    calendarCells() {
      const year = this.currentYear
      const month = this.currentMonth
      const firstDay = new Date(year, month - 1, 1).getDay()
      const daysInMonth = new Date(year, month, 0).getDate()
      const today = new Date()
      const cells = []

      // 填充前置空格
      for (let i = 0; i < firstDay; i++) {
        cells.push({ key: `empty-${i}`, day: null })
      }
      // 填充日期
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const isToday = dateStr === today.toISOString().slice(0, 10)
        const isFuture = new Date(dateStr) > today
        cells.push({
          key: dateStr,
          day: d,
          checked: this.checkedDates.has(dateStr),
          isToday,
          isFuture
        })
      }
      return cells
    }
  },
  async mounted() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return this.$router.push('/login')
    this.userId = session.user.id
    await Promise.all([
      this.loadMonthData(),
      this.loadAllDates()
    ])
  },
  methods: {
    async loadMonthData() {
      try {
        const list = await getMonthCheckins(this.userId, this.currentYear, this.currentMonth)
        this.checkedDates = new Set(list.map(r => r.checkin_date))

        const today = await getTodayCheckin(this.userId)
        this.todayChecked = !!today
        this.todayRecord = today
      } catch {
        Toast.fail('加载失败')
      }
    },
    async loadAllDates() {
      try {
        const list = await getAllCheckins(this.userId)
        this.allCheckedDates = new Set(list.map(r => r.checkin_date))
      } catch { /* ignore */ }
    },
    async prevMonth() {
      if (this.currentMonth === 1) {
        this.currentYear--
        this.currentMonth = 12
      } else {
        this.currentMonth--
      }
      await this.loadMonthData()
    },
    async nextMonth() {
      const now = new Date()
      if (this.currentYear === now.getFullYear() && this.currentMonth === now.getMonth() + 1) return
      if (this.currentMonth === 12) {
        this.currentYear++
        this.currentMonth = 1
      } else {
        this.currentMonth++
      }
      await this.loadMonthData()
    },
    async submitCheckin() {
      if (!this.form.wordCount && this.form.wordCount !== 0) {
        Toast.fail('请输入今日写作字数')
        return
      }
      this.submitting = true
      try {
        const record = await doCheckin({
          userId: this.userId,
          wordCount: Number(this.form.wordCount) || 0,
          note: this.form.note.trim() || null
        })
        this.todayChecked = true
        this.todayRecord = record
        this.checkedDates = new Set([...this.checkedDates, this.todayStr])
        this.allCheckedDates = new Set([...this.allCheckedDates, this.todayStr])
        Toast.success('打卡成功！')
      } catch {
        Toast.fail('打卡失败')
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.CheckinContainer {
  min-height: 100vh;
  background: #f4f6f8;
}

.TopBox {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #eee;
  z-index: 100;
  box-sizing: border-box;
}

/* 第一行：返回 + 标题 + 占位 */
.TopRow {
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.BackBtn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  font-size: 20px;
  color: #333;
}

.TopTitle {
  font-size: 16px;
  font-weight: 600;
  color: #111;
}

.Placeholder {
  width: 36px;
}

/* 第二行：月份切换 */
.MonthNav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 4px 0 12px;
}

.MonthLabel {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  min-width: 90px;
  text-align: center;
}

.NavArrow {
  font-size: 14px;
  color: #666;
}

.PageContent {
  padding: 110px 16px 30px;
}

/* 统计行 */
.StatsRow {
  display: flex;
  background: #fff;
  border-radius: 14px;
  padding: 16px 0;
  margin-bottom: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.StatItem {
  flex: 1;
  text-align: center;
  border-right: 1px solid #f0f0f0;
}
.StatItem:last-child { border-right: none; }

.StatNum {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  line-height: 1;
  margin-bottom: 6px;
}
.StatNum.streak { color: #ff6b35; }
.StatLabel { font-size: 12px; color: #aaa; }

/* 月历 */
.CalendarCard {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.WeekHeader {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 10px;
}
.WeekDay {
  text-align: center;
  font-size: 12px;
  color: #aaa;
  padding: 4px 0;
}

.DayGrid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.DayCell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.DayNum {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #333;
  font-weight: 500;
}
.DayNum.placeholder { opacity: 0; }
.DayNum.checked {
  background: #333;
  color: #fff;
}
.DayNum.today:not(.checked) {
  border: 2px solid #1989fa;
  color: #1989fa;
  font-weight: 700;
}
.DayNum.future { color: #ddd; }

/* 今日打卡 */
.TodayCard {
  background: #fff;
  border-radius: 14px;
  padding: 20px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.TodayHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.TodayTitle { font-size: 15px; font-weight: 600; }
.TodayDate  { font-size: 12px; color: #bbb; }

.CheckedBadge {
  color: #07c160;
  background: #f0fff5;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 13px;
}
.UncheckedBadge {
  color: #ff6b35;
  background: #fff5f0;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 13px;
}

.TodayResult { }
.ResultRow {
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
  gap: 12px;
}
.ResultRow:last-child { border-bottom: none; }
.ResultLabel { font-size: 13px; color: #999; flex-shrink: 0; }
.ResultVal { font-size: 14px; color: #333; flex: 1; }
.ResultVal.note { line-height: 1.6; }

.CheckinBtn {
  margin-top: 16px;
  height: 48px;
  border-radius: 24px;
  background: #333 !important;
  color: #fff !important;
  border: none !important;
  font-size: 16px;
  font-weight: 600;
}
</style>
