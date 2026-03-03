<template>
  <div class="ticket-page">
    <div class="header">
      <h1>工单中心</h1>
      <button class="btn" @click="showCreate = !showCreate">
        {{ showCreate ? '取消新建' : '新建工单' }}
      </button>
    </div>

    <section v-if="showCreate" class="card">
      <h2>新建工单</h2>
      <form @submit.prevent="createTicket">
        <label class="field">
          <span>标题</span>
          <input v-model="form.subject" required />
        </label>
        <label class="field">
          <span>优先级</span>
          <select v-model.number="form.level">
            <option :value="1">一般</option>
            <option :value="2">紧急</option>
          </select>
        </label>
        <label class="field">
          <span>内容</span>
          <textarea v-model="form.message" required rows="4" />
        </label>
        <button class="btn" type="submit" :disabled="creating">
          {{ creating ? '提交中...' : '提交工单' }}
        </button>
      </form>
    </section>

    <section class="card">
      <h2>我的工单</h2>
      <table v-if="tickets.length" class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>标题</th>
            <th>级别</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in tickets" :key="t.id">
            <td>{{ t.id }}</td>
            <td>{{ t.subject }}</td>
            <td>{{ t.level }}</td>
            <td>{{ t.status }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else>暂无工单。</p>
    </section>

    <p v-if="error" class="error-text">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue'
import { request } from '../api/http'

interface Ticket {
  id: number
  subject: string
  level: number
  status: number
}

const tickets = ref<Ticket[]>([])
const showCreate = ref(false)
const creating = ref(false)
const error = ref('')

const form = reactive({
  subject: '',
  level: 1,
  message: ''
})

async function loadTickets() {
  try {
    tickets.value = await request<Ticket[]>('/api/v1/user/ticket/fetch')
  } catch {
    tickets.value = []
  }
}

async function createTicket() {
  error.value = ''
  creating.value = true
  try {
    const body = new URLSearchParams()
    body.set('subject', form.subject)
    body.set('level', String(form.level))
    body.set('message', form.message)
    await request<boolean>('/api/v1/user/ticket/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    })
    form.subject = ''
    form.level = 1
    form.message = ''
    showCreate.value = false
    await loadTickets()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '提交失败'
  } finally {
    creating.value = false
  }
}

onMounted(loadTickets)
</script>

<style scoped>
.ticket-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px 18px;
  border: 1px solid #e5e7eb;
}

.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
  font-size: 14px;
}

input,
textarea,
select {
  margin-top: 4px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-family: inherit;
}

.btn {
  padding: 7px 12px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #f9fafb;
  font-size: 14px;
  cursor: pointer;
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

.error-text {
  color: #b91c1c;
  font-size: 13px;
}
</style>

