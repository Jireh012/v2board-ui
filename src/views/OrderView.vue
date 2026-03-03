<template>
  <div class="order-page">
    <h1>订单记录</h1>
    <p class="hint">通过 /api/v1/user/order/fetch 获取最近订单。</p>
    <button class="btn-refresh" @click="load">刷新</button>
    <table v-if="orders.length" class="table">
      <thead>
        <tr>
          <th>订单号</th>
          <th>套餐ID</th>
          <th>周期</th>
          <th>金额（元）</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="o in orders" :key="o.trade_no">
          <td>{{ o.trade_no }}</td>
          <td>{{ o.plan_id }}</td>
          <td>{{ o.period }}</td>
          <td>{{ (o.total_amount || 0) / 100 }}</td>
          <td>{{ o.status }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else>暂无订单。</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { request } from '../api/http'

interface OrderRow {
  trade_no: string
  plan_id: number
  period: string
  total_amount: number
  status: number
}

const orders = ref<OrderRow[]>([])

async function load() {
  try {
    orders.value = await request<OrderRow[]>('/api/v1/user/order/fetch')
  } catch {
    orders.value = []
  }
}

onMounted(load)
</script>

<style scoped>
.order-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hint {
  font-size: 13px;
  color: #6b7280;
}

.btn-refresh {
  align-self: flex-start;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  cursor: pointer;
  font-size: 13px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table th,
.table td {
  border: 1px solid #e5e7eb;
  padding: 6px 8px;
}

.table th {
  background: #f3f4f6;
  text-align: left;
}
</style>

