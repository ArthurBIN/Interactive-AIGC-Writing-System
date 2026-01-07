<template>
  <div class="MessageBox_Overlay">
    <div class="MessageBox">

      <div class="ContentBox">
        <slot name="ContentBox"></slot>
      </div>

      <div class="MessageBox_BtnBox">
        <div class="Btn_Item Btn_Casual" @click="Cancel">取消</div>
        <div class="Btn_Item Btn_Commit" @click="Save">确认</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "MessageBox",
  methods: {
    Cancel() {
      this.$emit('Cancel')
    },
    Save() {
      this.$emit('Save')
    }
  }
}
</script>

<style scoped>
.MessageBox_Overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
}
.MessageBox {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80%;
  min-width: 300px;
  max-width: 500px;
  border-radius: 20px;
  transform: translate(-50%, -50%);
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 9999;
}
.MessageBox_BtnBox {
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px 0;
}
.Btn_Item {
  width: 120px;
  height: 50px;
  text-align: center;
  line-height: 50px;
  border-radius: 15px;
}
.Btn_Commit {
  background-color: #E5717D;
  color: white;
  margin-left: 30px;
}
.Btn_Casual {
  color: #E5717D;
  border: 1px solid #E5717D;
}
.ContentBox {
  width: 90%;
  margin: 20px auto 0;
  min-height: 100px;
}
</style>