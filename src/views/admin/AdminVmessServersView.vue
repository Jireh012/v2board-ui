<template>
  <div class="page">
    <h1>VMess 节点</h1>
    <p class="hint">数据来自 /api/v1/admin/server/vmess/fetch。</p>
    <table v-if="rows.length" class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>名称</th>
          <th>地址</th>
          <th>端口</th>
          <th>显示</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in rows" :key="s.id">
          <td>{{ s.id }}</td>
          <td>{{ s.name }}</td>
          <td>{{ s.host }}</td>
          <td>{{ s.port }}</td>
          <td>{{ s.show === 1 ? '是' : '否' }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else>暂无节点。</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { request } from '../../api/http'

interface AdminVmess {
  id: number
  name: string
  host: string
  port: number
  show: number
}

const rows = ref<AdminVmess[]>([])

async function load() {
  rows.value = await request<AdminVmess[]>('/api/v1/admin/server/vmess/fetch')
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

