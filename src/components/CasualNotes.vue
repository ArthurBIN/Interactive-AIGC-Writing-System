<template>
  <div class="CasualNotes">
<!--    时间-->
    <div class="TopTime">
      {{Time}}
    </div>
    <div class="ContentBox">
      <div class="TextBox">
        {{Text}}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "CasualNotes",
  props: ['Time', 'Text']
}
</script>

<style scoped>
.CasualNotes {
  width: 90%;
  margin: 5px auto;
  padding: 10px;
}
.TopTime {
  width: 100%;
  color: black;
}
.ContentBox {
  padding: 5px 10px 20px 20px;
  border-left: 4px dashed #F5DAD2;
  box-sizing: border-box;
  margin-left: 10px;
  margin-top: 10px;
}

.TextBox {
  width: 100%;
  padding: 15px;
  line-height: 1.5;
  font-size: 17px;
  background-color: #FCFFE0;
  box-sizing: border-box;
  box-shadow: 2px 2px 10px rgba(186, 205, 146, 0.7);
  border-radius: 15px;

}
</style>