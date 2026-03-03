<template>
  <div class="admin-dashboard">
    <h1>概览</h1>
    <p class="hint">这里可以扩展成类似原版 PHP 后台的统计面板。</p>
    <div class="cards">
      <div class="card">
        <h2>提示</h2>
        <p>导航左侧已经提供用户、套餐、订单、工单、知识库、支付方式等管理入口。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.admin-dashboard {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hint {
  font-size: 13px;
  color: #9ca3af;
}

.cards {
  display: grid;
  grid-template-columns: minmax(260px, 420px);
}

.card {
  background: rgba(15, 23, 42, 0.9);
  border-radius: 12px;
  padding: 16px 18px;
  border: 1px solid #1f2937;
}

.card h2 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 15px;
}

.card p {
  margin: 0;
  font-size: 13px;
}
</style>

