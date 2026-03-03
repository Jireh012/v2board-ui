<template>
  <div class="page">
    <h1>支付方式</h1>
    <p class="hint">数据来自 /api/v1/admin/payment/fetch。</p>
    <table v-if="rows.length" class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>名称</th>
          <th>驱动</th>
          <th>手续费</th>
          <th>状态</th>
          <th>通知地址</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in rows" :key="p.id">
          <td>{{ p.id }}</td>
          <td>{{ p.name }}</td>
          <td>{{ p.payment }}</td>
          <td>{{ p.handling_fee_percent }}% + {{ (p.handling_fee_fixed || 0) / 100 }}</td>
          <td>{{ p.enable === 1 ? '启用' : '停用' }}</td>
          <td>{{ p.notify_url }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else>暂无支付方式。</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { request } from '../../api/http'

interface AdminPaymentRow {
  id: number
  name: string
  payment: string
  handling_fee_fixed: number
  handling_fee_percent: number
  enable: number
  notify_url: string
}

const rows = ref<AdminPaymentRow[]>([])

async function load() {
  rows.value = await request<AdminPaymentRow[]>('/api/v1/admin/payment/fetch')
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

