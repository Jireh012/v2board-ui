<template>
  <div class="admin-dashboard">
    <div class="page-header">
      <div>
        <h1 class="page-title">仪表盘</h1>
        <p class="page-subtitle">管理节点、用户、订单与系统配置的控制台入口。</p>
      </div>
    </div>
    <div class="cards">
      <div class="card">
        <h2>快速开始</h2>
        <p>左侧导航可进入用户、套餐、订单、工单、节点、支付与内容管理。</p>
      </div>
      <div class="card">
        <h2>界面说明</h2>
        <p>管理后台已与用户端统一为浅色布局与交互样式，便于日常运维。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.card h2 {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 800;
  color: var(--text-main);
}

.card p {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.6;
}
</style>
