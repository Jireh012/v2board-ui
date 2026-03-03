<template>
  <div class="knowledge-page">
    <h1>使用教程</h1>
    <p class="hint">
      这里用于展示节点使用教程、客户端下载方式等说明，可根据你的面板实际内容补充。
    </p>
    <ul class="list">
      <li>如何在各平台导入订阅链接</li>
      <li>常见问题与排查思路</li>
      <li>节点不可用时的自检方式</li>
    </ul>
    <p class="tip">
      如果你已有独立的文档站点，可以在此页面增加外链按钮跳转过去。
    </p>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.knowledge-page {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

h1 {
  margin: 0 0 4px;
  font-size: 20px;
}

.hint {
  font-size: 13px;
  color: #6b7280;
}

.list {
  padding-left: 18px;
  font-size: 14px;
  color: #111827;
}

.tip {
  margin-top: 4px;
  font-size: 13px;
  color: #6b7280;
}
</style>

