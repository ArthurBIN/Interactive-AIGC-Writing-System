<template>
  <div class="StoryItemBox" @click="ClickStoryItem">
    <div class="SIB_Title">
      <div class="SIB_T_Text">{{Title}}</div>
      <div class="SIB_T_JianT">
        查看<van-icon name="arrow" />
      </div>
    </div>
    <div class="SIB_Content">{{Content}}</div>
    <div class="SIB_Time">{{Time}}</div>
  </div>
</template>

<script>
export default {
  name: "StoryItemBox",
  props:['Title','Content','Time'],
  methods: {
    ClickStoryItem() {
      this.$emit('ClickStoryItem')
    }
  }
}
</script>

<style scoped>
.StoryItemBox {
  position: relative;
  width: 94%;
  margin: 10px auto;
  padding: 3vw;
  font-size: 4.5vw;
  box-sizing: border-box;
  border: 2px solid #3E6546;
  border-radius: 15px;
  background-color: #F1F7DE;
}
.SIB_Title {
  width: 100%;
  text-align: center;
  font-size: 5vw;
  color: #839B84;
  font-weight: 700;
  position: relative;
}
.SIB_T_Text {
  max-width: 60%;
  display: inline-block;
}
.SIB_T_JianT {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 0;
  font-size: 4vw;
  color: #959085;
}
.SIB_Content {
  position: relative;
  width: 95%;
  -webkit-line-clamp: 4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 3vw auto 0;
}
.SIB_Time {
  width: 98%;
  text-align: right;
  font-size: 3.7vw;
  margin-top: 10px;
  position: relative;
  color: #595959;
}
</style>