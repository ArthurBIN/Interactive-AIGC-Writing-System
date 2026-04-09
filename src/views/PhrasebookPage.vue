<template>
  <div class="PhraseContainer">
    <!-- 顶部栏 -->
    <div class="TopBox">
      <div class="BackBtn" @click="$router.back()">
        <i class="iconfont icon-fanhui"></i>
      </div>
      <div class="TopTitle">词句收藏本</div>
      <div class="AddBtn" @click="showAddDialog = true">
        <i class="iconfont icon-add"></i>
      </div>
    </div>

    <div class="PageContent">
      <!-- 分类筛选 -->
      <div class="CategoryBar">
        <div
            v-for="cat in categories"
            :key="cat"
            class="CatTag"
            :class="{ active: activeCategory === cat }"
            @click="activeCategory = cat"
        >
          {{ cat }}
        </div>
      </div>

      <!-- 词句列表 -->
      <div v-if="filteredList.length > 0" class="PhraseList">
        <div
            v-for="item in filteredList"
            :key="item.id"
            class="PhraseCard"
        >
          <div class="PhraseContent">{{ item.content }}</div>
          <div class="PhraseFooter">
            <span class="PhraseTag" :style="getTagStyle(item.category)">{{ item.category }}</span>
            <span class="PhraseSource" v-if="item.source">来自：{{ item.source }}</span>
            <span class="PhraseDate">{{ formatDate(item.created_at) }}</span>
            <i class="iconfont icon-shanchu DelIcon" @click="confirmDelete(item)"></i>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="EmptyBox">
        <div class="EmptyIcon">📝</div>
        <div class="EmptyText">还没有收藏任何词句</div>
        <div class="EmptyTip">点击右上角 + 添加好词好句</div>
      </div>
    </div>

    <!-- 添加对话框 -->
    <van-dialog
        v-model="showAddDialog"
        title="添加词句"
        show-cancel-button
        :before-close="onBeforeCloseAdd"
    >
      <div class="DialogContent">
        <van-field
            v-model="form.content"
            type="textarea"
            placeholder="请输入要收藏的词句或段落..."
            rows="4"
            maxlength="300"
            show-word-limit
        />
        <van-field
            v-model="form.source"
            label="来源"
            placeholder="来自哪篇文章（可选）"
            clearable
        />
        <div class="CatSelector">
          <div class="CatLabel">分类</div>
          <div class="CatOptions">
            <div
                v-for="cat in inputCategories"
                :key="cat"
                class="CatOption"
                :class="{ selected: form.category === cat }"
                @click="form.category = cat"
            >{{ cat }}</div>
          </div>
        </div>
      </div>
    </van-dialog>
  </div>
</template>

<script>
import { Toast, Dialog } from 'vant'
import { supabase } from '@/config/supabase'
import { getPhraseList, addPhrase, deletePhrase } from '@/api/phrasebook'

const CATEGORIES = ['全部', '开头结尾', '过渡句', '修辞手法', '金句摘抄', '议论素材', '通用']
const INPUT_CATEGORIES = CATEGORIES.slice(1)

const TAG_COLORS = {
  '开头结尾': { bg: '#fff0f6', color: '#eb2f96' },
  '过渡句':   { bg: '#f6ffed', color: '#52c41a' },
  '修辞手法': { bg: '#fff8e6', color: '#fa8c16' },
  '金句摘抄': { bg: '#fffbe6', color: '#faad14' },
  '议论素材': { bg: '#f0f5ff', color: '#2f54eb' },
  '通用':     { bg: '#f5f5f5', color: '#595959' },
}

export default {
  name: 'PhrasebookPage',
  data() {
    return {
      userId: '',
      phraseList: [],
      loading: false,
      activeCategory: '全部',
      categories: CATEGORIES,
      inputCategories: INPUT_CATEGORIES,
      showAddDialog: false,
      form: {
        content: '',
        source: '',
        category: '通用'
      }
    }
  },
  computed: {
    filteredList() {
      if (this.activeCategory === '全部') return this.phraseList
      return this.phraseList.filter(p => p.category === this.activeCategory)
    }
  },
  async mounted() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return this.$router.push('/login')
    this.userId = session.user.id
    await this.loadList()
  },
  methods: {
    async loadList() {
      this.loading = true
      try {
        this.phraseList = await getPhraseList(this.userId)
      } catch {
        Toast.fail('加载失败')
      } finally {
        this.loading = false
      }
    },

    async onBeforeCloseAdd(action, done) {
      if (action !== 'confirm') {
        this.resetForm()
        return done()
      }
      if (!this.form.content.trim()) {
        Toast.fail('内容不能为空')
        return done(false)
      }
      try {
        const item = await addPhrase({
          userId: this.userId,
          content: this.form.content.trim(),
          category: this.form.category,
          source: this.form.source.trim() || null
        })
        this.phraseList.unshift(item)
        Toast.success('收藏成功')
        this.resetForm()
        done()
      } catch {
        Toast.fail('收藏失败')
        done(false)
      }
    },

    confirmDelete(item) {
      Dialog.confirm({ message: '确定删除这条收藏吗？' }).then(async () => {
        try {
          await deletePhrase(item.id)
          this.phraseList = this.phraseList.filter(p => p.id !== item.id)
          Toast.success('已删除')
        } catch {
          Toast.fail('删除失败')
        }
      }).catch(() => {})
    },

    resetForm() {
      this.form = { content: '', source: '', category: '通用' }
    },

    getTagStyle(cat) {
      const s = TAG_COLORS[cat] || TAG_COLORS['通用']
      return { background: s.bg, color: s.color }
    },

    formatDate(str) {
      return str ? str.slice(0, 10) : ''
    }
  }
}
</script>

<style scoped>
.PhraseContainer {
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

.BackBtn, .AddBtn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #333;
  border-radius: 50%;
}

.AddBtn {
  font-size: 22px;
  background: #333;
  color: #fff;
}

.TopTitle {
  font-size: 16px;
  font-weight: 600;
  color: #111;
}

.PageContent {
  padding: 70px 16px 30px;
}

.CategoryBar {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 12px;
  scrollbar-width: none;
}
.CategoryBar::-webkit-scrollbar { display: none; }

.CatTag {
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  background: #fff;
  color: #666;
  border: 1px solid #e5e5e5;
  transition: all 0.2s;
}
.CatTag.active {
  background: #333;
  color: #fff;
  border-color: #333;
}

.PhraseList {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.PhraseCard {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.PhraseContent {
  font-size: 15px;
  color: #1a1a1a;
  line-height: 1.7;
  margin-bottom: 10px;
  white-space: pre-wrap;
}

.PhraseFooter {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.PhraseTag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.PhraseSource, .PhraseDate {
  font-size: 11px;
  color: #bbb;
}

.DelIcon {
  margin-left: auto;
  color: #ddd;
  font-size: 16px;
}

.EmptyBox {
  text-align: center;
  padding: 60px 0;
}
.EmptyIcon { font-size: 48px; margin-bottom: 12px; }
.EmptyText { font-size: 15px; color: #999; margin-bottom: 6px; }
.EmptyTip  { font-size: 13px; color: #bbb; }

/* 对话框内容 */
.DialogContent { padding: 12px 16px 16px; }

.CatSelector { margin-top: 12px; }
.CatLabel { font-size: 13px; color: #666; margin-bottom: 8px; }
.CatOptions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.CatOption {
  padding: 5px 12px;
  border-radius: 16px;
  font-size: 13px;
  background: #f5f5f5;
  color: #666;
  border: 1px solid #e5e5e5;
  transition: all 0.2s;
}
.CatOption.selected {
  background: #333;
  color: #fff;
  border-color: #333;
}
</style>
