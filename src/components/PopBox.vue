<template>
  <div class="PopBox">
    <div class="PopBoxContentBox">
      <slot name="PopBoxContentBox"></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: "PopBox",

}
</script>

<style scoped>
.PopBox {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(215, 215, 215, 0.3);
  z-index: 99999;
}
.PopBoxContentBox {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-radius: 15px;
  width: 90%;
  max-height: 480px;
  overflow-y: scroll;
  background-color: #FFFFF5;
}
</style>