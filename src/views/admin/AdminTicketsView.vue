<template>
  <div class="page">
    <h1>工单管理</h1>
    <p class="hint">数据来自 /api/v1/admin/ticket/fetch。</p>
    <table v-if="rows.length" class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>用户ID</th>
          <th>标题</th>
          <th>级别</th>
          <th>状态</th>
          <th>回复状态</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in rows" :key="t.id">
          <td>{{ t.id }}</td>
          <td>{{ t.user_id }}</td>
          <td>{{ t.subject }}</td>
          <td>{{ t.level }}</td>
          <td>{{ t.status }}</td>
          <td>{{ t.reply_status }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else>暂无工单数据。</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchAdminTickets, type AdminTicket, type PageResult } from '../../api/admin'

const rows = ref<AdminTicket[]>([])

async function load() {
  const page: PageResult<AdminTicket> = await fetchAdminTickets()
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

