<template>
  <div class="All">
    <div class="Header">
      <div class="HeaderSubtitle">选择一个主题，开启你的写作之旅</div>
    </div>

    <div class="TopicList">
      <div
          v-for="(item, index) in topicList"
          :key="index"
          class="TopicCard"
          @click="goToChat(item.text)">
        <div class="TopicCardContent">
          <div class="TopicNumber">{{ String(index + 1).padStart(2, '0') }}</div>
          <div class="TopicInfo">
            <div class="TopicTitle">{{ item.text }}</div>
            <div class="TopicDescription">{{ item.intro }}</div>
          </div>
          <div class="TopicArrow">
            <i class="iconfont icon-xiangyoujiantou"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {Dialog} from "vant";
import {getCurrentUser} from "@/api/auth";

export default {
  name: "IndexPage",
  data() {
    return {
      topicList: [
        {
          intro: "写一写那个对你影响最深的人，刻画他/她的外貌特征、性格闪光点及感人瞬间。",
          text: "人物刻画"
        },
        {
          intro: "记录一件让你明白道理或深受启发的事，分享成长过程中的酸甜苦辣。",
          text: "叙事成长"
        },
        {
          intro: "描绘你眼中的校园一角或家乡美景，运用感官描写，让文字动起来。",
          text: "写景抒情"
        },
        {
          intro: "通过一件具体的物品，寄托一段珍贵的回忆或一份特别的情感。",
          text: "托物言志"
        },
        {
          intro: "写给未来的自己或某位重要的人，表达平日里不敢开口的真心话。",
          text: "书信传情"
        },
        {
          intro: "假如你拥有超能力或置身于未来世界，展开想象，构建一个奇妙故事。",
          text: "想象作文"
        },
        {
          intro: "针对某个校园现象或社会热点，清晰表达你的观点，练习逻辑思考。",
          text: "议论思辨"
        },
        {
          intro: "回顾阅读过的名著或观看过的影片，分享最打动你的情节与深刻感悟。",
          text: "读后感/影评"
        },
        {
          intro: "记录生活中的细碎温暖，从一蔬一饭、一草一木中寻找写作的灵感。",
          text: "人间烟火"
        },
        {
          intro: "描写一次紧张的考试、有趣的比赛或难忘的旅行，抓住心理变化。",
          text: "生活瞬间"
        }
      ]
    }
  },

  methods: {
    async goToChat(topicName) {
      const data = await getCurrentUser();

      if (data) {
        this.$router.push("/chat?style=" + topicName);
      } else {
        Dialog.confirm({
          title: '提示',
          message: '您还未登录，是否先去登录？',
        })
            .then(() => {
              this.$router.push("/login");
            })
            .catch(() => {
            });
      }
    },
  }
}
</script>

<style scoped>
.All {
  width: 100%;
  padding-bottom: 40px;
}

.Header {
  width: 100%;
  padding: 30px 0;
  text-align: center;
}

.HeaderSubtitle {
  font-size: 14px;
  color: #888;
}

.TopicList {
  width: 100%;
  padding: 0 16px;
  box-sizing: border-box;
}

.TopicCard {
  width: 100%;
  margin-bottom: 12px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s;
}

.TopicCard:active {
  transform: scale(0.98);
}

.TopicCardContent {
  display: flex;
  align-items: center;
  padding: 16px;
}

.TopicNumber {
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: #000;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.TopicInfo {
  flex: 1;
  margin-left: 15px;
  min-width: 0;
}

.TopicTitle {
  font-size: 17px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.TopicDescription {
  font-size: 13px;
  color: #777;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.TopicArrow {
  margin-left: 10px;
  color: #ccc;
}
</style>