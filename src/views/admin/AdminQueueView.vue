<template>
  <div class="admin-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">队列监控</h1>
        <p class="page-subtitle">Redis 后台任务积压、Worker 状态与失败重试（非 Laravel Horizon）。</p>
      </div>
      <button class="btn" type="button" :disabled="loading" @click="loadAll">
        {{ loading ? '刷新中…' : '刷新' }}
      </button>
    </div>

    <div v-if="error" class="block-error">{{ error }}</div>

    <div class="card metrics-card">
      <div class="metrics-primary">
        <div class="metric">
          <span class="metric-label">当前作业量</span>
          <strong class="metric-value">{{ loading ? '…' : totalJobs }}</strong>
        </div>
        <div class="metric">
          <span class="metric-label">这一小时处理量</span>
          <strong class="metric-value">{{ loading ? '…' : stats?.recentJobs ?? 0 }}</strong>
        </div>
        <div class="metric">
          <span class="metric-label">失败数量</span>
          <strong class="metric-value">{{ loading ? '…' : stats?.failedJobs ?? 0 }}</strong>
        </div>
        <div class="metric">
          <span class="metric-label">状态</span>
          <strong class="metric-value" :class="workersOk ? 'ok' : 'bad'">
            {{ loading ? '…' : workersOk ? '运行中' : '未运行' }}
          </strong>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h2>当前作业详情</h2></div>
      <table class="data-table">
        <thead>
          <tr>
            <th>队列名称</th>
            <th>作业量</th>
            <th>线程数</th>
            <th>活跃</th>
            <th>占用</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in workload" :key="row.name">
            <td>{{ row.display_name }}</td>
            <td>{{ row.jobs }}</td>
            <td>{{ row.processes }}</td>
            <td>{{ row.active ?? 0 }}</td>
            <td>{{ row.occupied ? '是' : '否' }}</td>
          </tr>
          <tr v-if="!loading && workload.length === 0">
            <td colspan="5" class="empty">暂无队列配置</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <div class="card-head row">
        <h2>失败任务</h2>
        <button class="btn danger" type="button" :disabled="!failed.length" @click="onClearFailed">清空</button>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>队列</th>
            <th>类型</th>
            <th>失败时间</th>
            <th>异常</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in failed" :key="f.id">
            <td>{{ f.id }}</td>
            <td>{{ f.queue }}</td>
            <td>{{ f.job_type }}</td>
            <td>{{ formatTs(f.failed_at) }}</td>
            <td class="exc">{{ f.exception || '-' }}</td>
            <td class="actions">
              <button class="btn sm" type="button" @click="onRetry(f.id)">重试</button>
              <button class="btn sm danger" type="button" @click="onDelete(f.id)">删除</button>
            </td>
          </tr>
          <tr v-if="!loading && failed.length === 0">
            <td colspan="6" class="empty">暂无失败任务</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  clearFailedJobs,
  deleteFailedJob,
  fetchFailedJobs,
  fetchQueueStats,
  fetchQueueWorkload,
  fetchSystemStatus,
  retryFailedJob,
  type FailedJob,
  type QueueStats,
  type QueueWorkloadRow
} from '../../api/admin/queue'

const loading = ref(false)
const error = ref('')
const stats = ref<QueueStats | null>(null)
const workload = ref<QueueWorkloadRow[]>([])
const failed = ref<FailedJob[]>([])
const workersOk = ref(false)
let timer: number | undefined

const totalJobs = computed(() => workload.value.reduce((s, r) => s + (r.jobs || 0), 0))

function formatTs(ts: number) {
  if (!ts) return '-'
  return new Date(ts * 1000).toLocaleString()
}

async function loadAll() {
  loading.value = true
  error.value = ''
  try {
    const [st, wl, sys, fj] = await Promise.all([
      fetchQueueStats(),
      fetchQueueWorkload(),
      fetchSystemStatus(),
      fetchFailedJobs(1, 50)
    ])
    stats.value = st
    workload.value = wl || []
    workersOk.value = !!(sys?.queue_workers || st?.status)
    failed.value = fj?.list || []
  } catch (e: any) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
}

async function onRetry(id: number) {
  await retryFailedJob(id)
  await loadAll()
}

async function onDelete(id: number) {
  await deleteFailedJob(id)
  await loadAll()
}

async function onClearFailed() {
  if (!confirm('确认清空全部失败任务？')) return
  await clearFailedJobs()
  await loadAll()
}

onMounted(() => {
  loadAll()
  timer = window.setInterval(loadAll, 15000)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.metrics-card { margin-bottom: 16px; }
.metrics-primary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.metric-label { display: block; color: #64748b; font-size: 13px; margin-bottom: 6px; }
.metric-value { font-size: 22px; }
.metric-value.ok { color: #16a34a; }
.metric-value.bad { color: #dc2626; }
.card { margin-bottom: 16px; }
.card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.card-head.row { gap: 12px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.data-table th, .data-table td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: top; }
.data-table th { color: #64748b; font-weight: 600; }
.empty { color: #94a3b8; text-align: center; }
.exc { max-width: 280px; word-break: break-all; color: #b91c1c; font-size: 12px; }
.actions { display: flex; gap: 8px; }
.btn.sm { padding: 4px 10px; font-size: 12px; }
.btn.danger { color: #b91c1c; }
@media (max-width: 900px) {
  .metrics-primary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
