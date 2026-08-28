<template>
  <div class="admin-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">节点流量</h1>
        <p class="page-subtitle">按本站节点查询每日上/下行（UTC 日，约保留 2 个月）。第三方订阅源不上报，不会出现在此列表。</p>
      </div>
      <button class="btn" type="button" :disabled="loading || !selectedKey" @click="query">
        {{ loading ? '查询中…' : '查询' }}
      </button>
    </div>

    <div class="card">
      <div class="filters">
        <label class="filter-label">
          节点
          <select v-model="selectedKey" class="input filter-input node-select" :disabled="nodesLoading" @change="onNodeChange">
            <option v-if="!nodes.length" value="">{{ nodesLoading ? '加载节点…' : '暂无本站节点' }}</option>
            <option v-for="n in nodes" :key="nodeKey(n)" :value="nodeKey(n)">
              {{ n.name }} · {{ n.type }} · #{{ n.id }}
            </option>
          </select>
        </label>
        <label class="filter-label">
          开始
          <input v-model="startDate" class="input filter-input" type="date" />
        </label>
        <label class="filter-label">
          结束
          <input v-model="endDate" class="input filter-input" type="date" />
        </label>
      </div>
    </div>

    <div v-if="error" class="block-error">{{ error }}</div>

    <div v-if="result" class="stat-row">
      <div class="stat-card">
        <span class="stat-label">区间上行</span>
        <strong class="stat-value">{{ fmtTraffic(result.u) }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">区间下行</span>
        <strong class="stat-value">{{ fmtTraffic(result.d) }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">区间合计</span>
        <strong class="stat-value accent">{{ fmtTraffic(result.total) }}</strong>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <h2>{{ tableTitle }}</h2>
      </div>
      <div v-if="loading && !result" class="empty">加载中…</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>日期</th>
            <th class="num">上行</th>
            <th class="num">下行</th>
            <th class="num">合计</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in result?.days || []" :key="row.record_at">
            <td class="nowrap">{{ row.date }}</td>
            <td class="num">{{ fmtTraffic(row.u) }}</td>
            <td class="num">{{ fmtTraffic(row.d) }}</td>
            <td class="num">{{ fmtTraffic(row.total) }}</td>
          </tr>
          <tr v-if="!loading && queried && !(result?.days || []).length">
            <td colspan="4" class="empty">
              所选日期内无日统计。节点可能未上报，或记录已超出约 2 个月保留期。
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="toastMessage" class="toast" :class="{ error: toastError }">{{ toastMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchStatServer, type StatServerTraffic } from '../../api/admin'
import { fetchNodes, type ServerNode } from '../../api/admin/server'

const nodes = ref<ServerNode[]>([])
const nodesLoading = ref(false)
const selectedKey = ref('')
const startDate = ref(utcDaysAgo(29))
const endDate = ref(utcToday())
const loading = ref(false)
const error = ref('')
const result = ref<StatServerTraffic | null>(null)
const queried = ref(false)
const toastMessage = ref('')
const toastError = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | null = null

const tableTitle = computed(() => {
  if (!result.value) return '每日流量'
  const name = result.value.server_name || selectedLabel.value || '未命名节点'
  return `${name} · ${result.value.start_date} ~ ${result.value.end_date}`
})

const selectedLabel = computed(() => {
  const n = nodes.value.find((x) => nodeKey(x) === selectedKey.value)
  return n ? n.name : ''
})

function nodeKey(n: ServerNode) {
  return `${n.type}:${n.id}`
}

function parseSelected(): { server_id: number; server_type: string } | null {
  const raw = selectedKey.value
  const i = raw.lastIndexOf(':')
  if (i <= 0) return null
  const server_type = raw.slice(0, i)
  const server_id = Number(raw.slice(i + 1))
  if (!server_type || !Number.isFinite(server_id) || server_id <= 0) return null
  return { server_id, server_type }
}

function utcToday() {
  return new Date().toISOString().slice(0, 10)
}

function utcDaysAgo(n: number) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

function fmtTraffic(n: number | null | undefined) {
  const v = Number(n || 0)
  if (v <= 0) return '0.00 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let x = v
  while (x >= 1024 && i < units.length - 1) {
    x /= 1024
    i += 1
  }
  return `${x.toFixed(2)} ${units[i]}`
}

function showToast(msg: string, isError = false) {
  toastMessage.value = msg
  toastError.value = isError
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    if (toastMessage.value === msg) toastMessage.value = ''
  }, 2600)
}

async function loadNodes() {
  nodesLoading.value = true
  try {
    const list = await fetchNodes()
    nodes.value = Array.isArray(list) ? list : []
    if (nodes.value.length && !selectedKey.value) {
      selectedKey.value = nodeKey(nodes.value[0])
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载节点失败'
    showToast(error.value, true)
  } finally {
    nodesLoading.value = false
  }
}

async function query() {
  const node = parseSelected()
  if (!node) {
    showToast('请选择节点', true)
    return
  }
  if (!startDate.value || !endDate.value) {
    showToast('请选择开始和结束日期', true)
    return
  }
  if (startDate.value > endDate.value) {
    showToast('开始日期不能晚于结束日期', true)
    return
  }
  loading.value = true
  error.value = ''
  try {
    result.value = await fetchStatServer({
      server_id: node.server_id,
      server_type: node.server_type,
      start_date: startDate.value,
      end_date: endDate.value
    })
    queried.value = true
  } catch (e) {
    const msg = e instanceof Error ? e.message : '查询失败'
    error.value = msg
    showToast(msg, true)
  } finally {
    loading.value = false
  }
}

function onNodeChange() {
  if (selectedKey.value) void query()
}

onMounted(async () => {
  await loadNodes()
  if (selectedKey.value) await query()
})
</script>

<style scoped>
.filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.filter-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 13px;
}
.filter-input {
  width: auto;
  min-width: 0;
}
.node-select {
  min-width: 280px;
  max-width: min(480px, 100%);
}
.stat-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.stat-card {
  background: var(--card-bg, #fff);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
}
.stat-label {
  display: block;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 6px;
}
.stat-value {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-main, #0f172a);
}
.stat-value.accent { color: #2563eb; }
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.card-head h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
}
.data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.data-table th, .data-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
}
.data-table th { color: #64748b; font-weight: 600; }
.data-table .num { text-align: right; font-variant-numeric: tabular-nums; }
.empty { color: #94a3b8; text-align: center; padding: 24px 8px; }
.nowrap { white-space: nowrap; }
.block-error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
}
.toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background: #1e293b;
  color: #fff;
  padding: 12px 22px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  z-index: 3000;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.25);
}
.toast.error { background: #dc2626; }
@media (max-width: 720px) {
  .stat-row { grid-template-columns: 1fr; }
  .node-select { min-width: 0; width: 100%; }
}
</style>
