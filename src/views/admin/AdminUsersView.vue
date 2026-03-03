<template>
  <div class="page">
    <h1>用户管理</h1>
    <p class="hint">数据来自 /api/v1/admin/user/fetch。</p>
    <table v-if="rows.length" class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>邮箱</th>
          <th>套餐ID</th>
          <th>余额（元）</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in rows" :key="u.id">
          <td>{{ u.id }}</td>
          <td>{{ u.email }}</td>
          <td>{{ u.plan_id }}</td>
          <td>{{ (u.balance || 0) / 100 }}</td>
          <td>{{ u.banned === 1 ? '封禁' : '正常' }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else>暂无用户数据。</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchAdminUsers, type AdminUser, type PageResult } from '../../api/admin'

const rows = ref<AdminUser[]>([])

async function load() {
  const page: PageResult<AdminUser> = await fetchAdminUsers()
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

