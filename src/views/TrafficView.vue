<template>
  <div class="traffic-page">
    <h1>流量明细</h1>
    <p class="hint">数据来自 /api/v1/user/stat/getTrafficLog。</p>
    <table v-if="logs.length" class="table">
      <thead>
        <tr>
          <th>日期</th>
          <th>上行</th>
          <th>下行</th>
          <th>倍率</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="l in logs" :key="l.record_at">
          <td>{{ formatDate(l.record_at) }}</td>
          <td>{{ formatTraffic(l.u) }}</td>
          <td>{{ formatTraffic(l.d) }}</td>
          <td>{{ l.server_rate }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else>暂无流量记录。</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { request } from '../api/http'

interface TrafficLog {
  u: number
  d: number
  record_at: number
  user_id: number
  server_rate: number
}

const logs = ref<TrafficLog[]>([])

async function load() {
  try {
    logs.value = await request<TrafficLog[]>('/api/v1/user/stat/getTrafficLog')
  } catch {
    logs.value = []
  }
}

onMounted(load)

function formatDate(ts: number): string {
  const d = new Date(ts * 1000)
  return d.toLocaleDateString()
}

function formatTraffic(bytes: number): string {
  const gb = 1024 * 1024 * 1024
  const mb = 1024 * 1024
  if (bytes >= gb) return (bytes / gb).toFixed(2) + ' GB'
  if (bytes >= mb) return (bytes / mb).toFixed(2) + ' MB'
  return (bytes / 1024).toFixed(2) + ' KB'
}
</script>

<style scoped>
.traffic-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hint {
  font-size: 13px;
  color: #6b7280;
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

