<!--
  表單用的輸入框:v-text-field 加上專案統一的外觀與間距。
  沒有宣告任何 props:父層傳來的 label、v-model、error-messages 等都會透傳給根元素 v-text-field。
-->
<template>
  <v-text-field
    class="app-text-field"
    variant="outlined"
  />
</template>

<style scoped>
/* 下一個欄位的浮動標籤會往上凸出,留點間距才不會壓到這個欄位的錯誤訊息 */
.app-text-field {
  margin-bottom: 12px;
}
</style>
