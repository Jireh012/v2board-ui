<template>
  <div class="page">
    <h1>订单管理</h1>
    <p class="hint">数据来自 /api/v1/admin/order/fetch。</p>
    <table v-if="rows.length" class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>订单号</th>
          <th>用户ID</th>
          <th>套餐ID</th>
          <th>周期</th>
          <th>金额（元）</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="o in rows" :key="o.id">
          <td>{{ o.id }}</td>
          <td>{{ o.trade_no }}</td>
          <td>{{ o.user_id }}</td>
          <td>{{ o.plan_id }}</td>
          <td>{{ o.period }}</td>
          <td>{{ (o.total_amount || 0) / 100 }}</td>
          <td>{{ o.status }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else>暂无订单数据。</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchAdminOrders, type AdminOrderRow, type PageResult } from '../../api/admin'

const rows = ref<AdminOrderRow[]>([])

async function load() {
  const page: PageResult<AdminOrderRow> = await fetchAdminOrders()
  rows.value = page.data
}

onMounted(load)
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hint {
  font-size: 13px;
  color: #9ca3af;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.table th,
.table td {
  border: 1px solid #1f2937;
  padding: 6px 8px;
}

.table th {
  background: #020617;
  text-align: left;
}
</style>

