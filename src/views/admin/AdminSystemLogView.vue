<template>
  <div class="admin-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">系统日志</h1>
        <p class="page-subtitle">查看 Java API 落库的 ERROR 及以上异常（表 v2_log）。</p>
      </div>
      <button class="btn" type="button" :disabled="loading" @click="load">
        {{ loading ? '刷新中…' : '刷新' }}
      </button>
    </div>

    <div v-if="error" class="block-error">{{ error }}</div>

    <div class="card">
      <div class="card-head row">
        <h2>错误记录</h2>
        <div class="filters">
          <label class="filter-label">
            Level
            <select v-model="level" class="input" @change="onFilterChange">
              <option value="">全部</option>
              <option value="ERROR">ERROR</option>
              <option value="FATAL">FATAL</option>
            </select>
          </label>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>Level</th>
            <th>Method</th>
            <th>URI</th>
            <th>Title</th>
            <th>IP</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id">
            <td class="nowrap">{{ formatTs(row.created_at) }}</td>
            <td><span class="level" :class="(row.level || '').toLowerCase()">{{ row.level || '-' }}</span></td>
            <td>{{ row.method }}</td>
            <td class="uri">{{ row.uri }}</td>
            <td class="title">{{ row.title }}</td>
            <td>{{ row.ip || '-' }}</td>
            <td>
              <button class="btn sm" type="button" @click="openDetail(row)">详情</button>
            </td>
          </tr>
          <tr v-if="!loading && rows.length === 0">
            <td colspan="7" class="empty">暂无系统日志</td>
          </tr>
        </tbody>
      </table>

      <div class="pagination">
        <button class="btn sm" type="button" :disabled="current <= 1 || loading" @click="goPage(current - 1)">
          上一页
        </button>
        <span class="page-num">{{ current }} / {{ totalPages }}（共 {{ total }}）</span>
        <button
          class="btn sm"
          type="button"
          :disabled="current >= totalPages || loading"
          @click="goPage(current + 1)"
        >
          下一页
        </button>
        <select v-model.number="pageSize" class="input page-size" @change="onPageSizeChange">
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
      </div>
    </div>

    <div v-if="detail" class="modal-mask" @click.self="detail = null">
      <div class="modal">
        <div class="modal-header">
          <div>
            <h2>日志详情 #{{ detail.id }}</h2>
            <p class="modal-sub">{{ formatTs(detail.created_at) }} · {{ detail.level }} · {{ detail.method }} {{ detail.uri }}</p>
          </div>
          <button class="modal-close" type="button" @click="detail = null">&times;</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <div class="field-label">Title</div>
            <pre class="pre">{{ detail.title }}</pre>
          </div>
          <div class="field">
            <div class="field-label">Host / IP</div>
            <pre class="pre">{{ detail.host || '-' }} / {{ detail.ip || '-' }}</pre>
          </div>
          <div class="field">
            <div class="field-label">Data</div>
            <pre class="pre">{{ detail.data || '-' }}</pre>
          </div>
          <div class="field">
            <div class="field-label">Context</div>
            <pre class="pre">{{ formatContext(detail.context) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchSystemLogs, type SystemLogRow } from '../../api/admin/systemLog'

const loading = ref(false)
const error = ref('')
const rows = ref<SystemLogRow[]>([])
const total = ref(0)
const current = ref(1)
const pageSize = ref(20)
const level = ref('')
const detail = ref<SystemLogRow | null>(null)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

function formatTs(ts: number) {
  if (!ts) return '-'
  return new Date(ts * 1000).toLocaleString()
}

function formatContext(ctx?: string | null) {
  if (!ctx) return '-'
  try {
    return JSON.stringify(JSON.parse(ctx), null, 2)
  } catch {
    return ctx
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetchSystemLogs(current.value, pageSize.value, level.value || undefined)
    rows.value = res?.list || []
    total.value = res?.total ?? 0
    current.value = res?.current ?? current.value
    pageSize.value = res?.pageSize ?? pageSize.value
  } catch (e: any) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
}

function goPage(p: number) {
  current.value = p
  load()
}

function onFilterChange() {
  current.value = 1
  load()
}

function onPageSizeChange() {
  current.value = 1
  load()
}

function openDetail(row: SystemLogRow) {
  detail.value = row
}

onMounted(load)
</script>

<style scoped>
.card { margin-bottom: 16px; }
.card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; gap: 12px; }
.card-head.row { flex-wrap: wrap; }
.filters { display: flex; align-items: center; gap: 10px; }
.filter-label { display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 13px; }
.input { border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 10px; background: #fff; }
.data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.data-table th, .data-table td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: top; }
.data-table th { color: #64748b; font-weight: 600; }
.empty { color: #94a3b8; text-align: center; }
.nowrap { white-space: nowrap; }
.uri, .title { max-width: 280px; word-break: break-all; }
.level { font-weight: 600; font-size: 12px; }
.level.error, .level.fatal { color: #b91c1c; }
.pagination { display: flex; align-items: center; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
.page-num { color: #64748b; font-size: 13px; }
.page-size { width: auto; }
.btn.sm { padding: 4px 10px; font-size: 12px; }
.modal-mask {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45);
  display: flex; align-items: center; justify-content: center; z-index: 50; padding: 16px;
}
.modal {
  background: #fff; border-radius: 12px; width: min(720px, 100%); max-height: 85vh;
  overflow: auto; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
}
.modal-header {
  display: flex; justify-content: space-between; gap: 12px;
  padding: 16px 20px; border-bottom: 1px solid #e2e8f0;
}
.modal-header h2 { margin: 0; font-size: 18px; }
.modal-sub { margin: 4px 0 0; color: #64748b; font-size: 13px; }
.modal-close { border: 0; background: transparent; font-size: 24px; line-height: 1; cursor: pointer; color: #64748b; }
.modal-body { padding: 16px 20px 20px; }
.field { margin-bottom: 14px; }
.field-label { font-size: 12px; color: #64748b; margin-bottom: 6px; font-weight: 600; }
.pre {
  margin: 0; padding: 10px 12px; background: #f8fafc; border-radius: 8px;
  white-space: pre-wrap; word-break: break-word; font-size: 12px; line-height: 1.45;
}
</style>
