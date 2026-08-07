<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">工单管理</h1>
        <p class="page-subtitle">处理用户工单，支持会话回复与关闭。</p>
      </div>
      <div class="header-actions">
        <button class="btn" :disabled="loading" @click="load" title="刷新">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :class="{ spinning: loading }"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
          刷新
        </button>
      </div>
    </div>

    <div class="stat-row" v-if="!loading">
      <div class="stat-card">
        <span class="stat-label">工单总数</span>
        <strong class="stat-value">{{ total }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">本页待处理</span>
        <strong class="stat-value warn">{{ pageOpen }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">本页待回复</span>
        <strong class="stat-value accent">{{ pageNeedReply }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">本页已关闭</span>
        <strong class="stat-value muted">{{ pageClosed }}</strong>
      </div>
    </div>

    <div class="toolbar-card">
      <div class="search-bar">
        <div class="search-field">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            v-model="emailQuery"
            class="search-text"
            placeholder="按用户邮箱模糊搜索…"
            @keydown.enter="doSearch"
          />
        </div>
        <button type="button" class="btn primary" @click="doSearch">搜索</button>
        <button
          v-if="emailQuery || statusQuick !== 'all' || replyQuick !== 'all'"
          type="button"
          class="btn"
          @click="clearSearch"
        >
          清除
        </button>
      </div>
      <div class="toolbar-bottom">
        <div class="filters">
          <button
            v-for="ft in statusTabs"
            :key="String(ft.value)"
            type="button"
            class="filter-btn"
            :class="{ active: statusQuick === ft.value }"
            @click="statusQuick = ft.value; doSearch()"
          >
            {{ ft.label }}
          </button>
          <span class="filter-sep" />
          <button
            v-for="ft in replyTabs"
            :key="'r' + String(ft.value)"
            type="button"
            class="filter-btn"
            :class="{ active: replyQuick === ft.value }"
            @click="replyQuick = ft.value; doSearch()"
          >
            {{ ft.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="panel">
      <div v-if="loading" class="state-box">
        <div class="spinner"></div>
        <p>加载工单…</p>
      </div>
      <div v-else-if="!rows.length" class="state-box empty">
        <h3>暂无工单</h3>
        <p>当前筛选条件下没有工单。</p>
      </div>
      <template v-else>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th style="width:56px">#</th>
                <th>标题</th>
                <th>用户</th>
                <th>级别</th>
                <th>状态</th>
                <th>回复</th>
                <th>更新时间</th>
                <th class="col-actions sticky-right">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in rows" :key="t.id" class="click-row" @click="openDetail(t)">
                <td class="id-cell">{{ t.id }}</td>
                <td>
                  <div class="name-cell">
                    <span class="name">{{ t.subject || '（无标题）' }}</span>
                  </div>
                </td>
                <td>#{{ t.user_id }}</td>
                <td><span class="level" :class="'lv-' + t.level">{{ levelLabel(t.level) }}</span></td>
                <td><span class="status" :class="t.status === 0 ? 'open' : 'closed'">{{ statusLabel(t.status) }}</span></td>
                <td><span class="reply" :class="'rs-' + t.reply_status">{{ replyLabel(t.reply_status) }}</span></td>
                <td class="time-cell">{{ fmtTime(t.updated_at) }}</td>
                <td class="actions-td sticky-right" @click.stop>
                  <button type="button" class="menu-trigger" @click="openDetail(t)">查看</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <span class="page-info">共 {{ total }} 条</span>
          <button class="btn-page" :disabled="currentPage <= 1" @click="goPage(currentPage - 1)">上一页</button>
          <span class="page-num">{{ currentPage }} / {{ totalPages }}</span>
          <button class="btn-page" :disabled="currentPage >= totalPages" @click="goPage(currentPage + 1)">下一页</button>
          <select v-model.number="pageSize" class="page-size" @change="currentPage = 1; load()">
            <option :value="10">10 条/页</option>
            <option :value="20">20 条/页</option>
            <option :value="50">50 条/页</option>
          </select>
        </div>
      </template>
    </div>

    <Teleport to="body">
      <div v-if="showDetail" class="modal-mask" @click.self="showDetail = false">
        <div class="modal modal-ticket">
          <div class="modal-header">
            <div class="detail-head">
              <div class="detail-title-row">
                <h2>{{ detail?.subject || '工单详情' }}</h2>
                <template v-if="detail">
                  <span class="status" :class="detail.status === 0 ? 'open' : 'closed'">{{ statusLabel(detail.status) }}</span>
                  <span class="level" :class="'lv-' + detail.level">{{ levelLabel(detail.level) }}</span>
                </template>
              </div>
              <p v-if="detail" class="modal-sub">#{{ detail.id }} · 用户 #{{ detail.user_id }} · {{ fmtTime(detail.created_at) }}</p>
            </div>
            <button class="modal-close" @click="showDetail = false">&times;</button>
          </div>

          <div class="modal-body ticket-body">
            <div v-if="detailLoading" class="state-box compact">
              <div class="spinner"></div>
              <p>加载会话…</p>
            </div>
            <template v-else-if="detail">
              <div class="chat" ref="chatEl">
                <div v-if="!detail.message?.length" class="chat-empty">暂无消息</div>
                <div
                  v-for="m in detail.message"
                  :key="m.id"
                  class="bubble"
                  :class="{ me: m.is_me, user: !m.is_me }"
                >
                  <div class="bubble-meta">
                    <span>{{ m.is_me ? '管理员' : `用户 #${m.user_id}` }}</span>
                    <span>{{ fmtTime(m.created_at) }}</span>
                  </div>
                  <div class="bubble-text">{{ m.message }}</div>
                </div>
              </div>

              <div v-if="detail.status === 0" class="reply-box">
                <textarea
                  v-model="replyText"
                  class="reply-input"
                  rows="3"
                  placeholder="输入回复内容…"
                  @keydown.meta.enter="sendReply"
                  @keydown.ctrl.enter="sendReply"
                />
                <div class="reply-actions">
                  <button type="button" class="btn" :disabled="closing" @click="doClose">
                    {{ closing ? '关闭中…' : '关闭工单' }}
                  </button>
                  <button type="button" class="btn primary" :disabled="replying || !replyText.trim()" @click="sendReply">
                    {{ replying ? '发送中…' : '发送回复' }}
                  </button>
                </div>
              </div>
              <div v-else class="closed-tip">该工单已关闭，无法继续回复。</div>
            </template>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="toastMessage" class="toast" :class="{ error: toastError }">{{ toastMessage }}</div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import {
  closeAdminTicket,
  fetchAdminTicketDetail,
  fetchAdminTickets,
  replyAdminTicket,
  type AdminTicket,
  type PageResult
} from '../../api/admin'

const LEVEL_LABELS = ['低', '中', '高']

const rows = ref<AdminTicket[]>([])
const total = ref(0)
const loading = ref(true)
const currentPage = ref(1)
const pageSize = ref(10)
const emailQuery = ref('')
const statusQuick = ref<'all' | 0 | 1>('all')
const replyQuick = ref<'all' | 0 | 1>('all')

const showDetail = ref(false)
const detail = ref<AdminTicket | null>(null)
const detailLoading = ref(false)
const replyText = ref('')
const replying = ref(false)
const closing = ref(false)
const chatEl = ref<HTMLElement | null>(null)

const toastMessage = ref('')
const toastError = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | null = null

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const pageOpen = computed(() => rows.value.filter((t) => t.status === 0).length)
const pageClosed = computed(() => rows.value.filter((t) => t.status === 1).length)
const pageNeedReply = computed(() => rows.value.filter((t) => t.status === 0 && t.reply_status === 0).length)

const statusTabs = [
  { value: 'all' as const, label: '全部状态' },
  { value: 0 as const, label: '开启中' },
  { value: 1 as const, label: '已关闭' }
]
const replyTabs = [
  { value: 'all' as const, label: '全部回复' },
  { value: 0 as const, label: '待回复' },
  { value: 1 as const, label: '已回复' }
]

function showToast(msg: string, error = false) {
  toastMessage.value = msg
  toastError.value = error
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    if (toastMessage.value === msg) toastMessage.value = ''
  }, 2600)
}

function levelLabel(level: number) {
  return LEVEL_LABELS[level] ?? `级别${level}`
}
function statusLabel(status: number) {
  return status === 0 ? '开启中' : '已关闭'
}
function replyLabel(status: number) {
  return status === 0 ? '待回复' : '已回复'
}
function fmtTime(ts: number | null | undefined) {
  if (!ts) return '—'
  const d = new Date(ts * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function load() {
  loading.value = true
  try {
    const res: PageResult<AdminTicket> = await fetchAdminTickets(currentPage.value, pageSize.value, {
      status: statusQuick.value === 'all' ? null : statusQuick.value,
      reply_status: replyQuick.value === 'all' ? null : [replyQuick.value],
      email: emailQuery.value.trim() || null
    })
    rows.value = res.data || []
    total.value = Number(res.total) || 0
  } catch (e) {
    showToast(e instanceof Error ? e.message : '加载失败', true)
  } finally {
    loading.value = false
  }
}

function doSearch() {
  currentPage.value = 1
  load()
}

function clearSearch() {
  emailQuery.value = ''
  statusQuick.value = 'all'
  replyQuick.value = 'all'
  currentPage.value = 1
  load()
}

function goPage(p: number) {
  currentPage.value = p
  load()
}

async function openDetail(t: AdminTicket) {
  showDetail.value = true
  detailLoading.value = true
  detail.value = null
  replyText.value = ''
  try {
    detail.value = await fetchAdminTicketDetail(t.id)
    await nextTick()
    scrollChat()
  } catch (e) {
    showToast(e instanceof Error ? e.message : '加载详情失败', true)
    showDetail.value = false
  } finally {
    detailLoading.value = false
  }
}

function scrollChat() {
  const el = chatEl.value
  if (el) el.scrollTop = el.scrollHeight
}

async function sendReply() {
  if (!detail.value || !replyText.value.trim() || detail.value.status !== 0) return
  replying.value = true
  try {
    await replyAdminTicket(detail.value.id, replyText.value.trim())
    replyText.value = ''
    showToast('回复已发送')
    detail.value = await fetchAdminTicketDetail(detail.value.id)
    await nextTick()
    scrollChat()
    await load()
  } catch (e) {
    showToast(e instanceof Error ? e.message : '回复失败', true)
  } finally {
    replying.value = false
  }
}

async function doClose() {
  if (!detail.value) return
  closing.value = true
  try {
    await closeAdminTicket(detail.value.id)
    showToast('工单已关闭')
    detail.value = await fetchAdminTicketDetail(detail.value.id)
    await load()
  } catch (e) {
    showToast(e instanceof Error ? e.message : '关闭失败', true)
  } finally {
    closing.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && showDetail.value) showDetail.value = false
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  load()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  if (toastTimer) clearTimeout(toastTimer)
})
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-title { margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
.page-subtitle { margin: 4px 0 0; font-size: 13px; color: #64748b; }
.header-actions { display: flex; gap: 8px; }

.stat-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.stat-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px 16px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04); display: flex; flex-direction: column; gap: 6px;
}
.stat-label { font-size: 12px; font-weight: 700; color: #94a3b8; }
.stat-value { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.03em; }
.stat-value.accent { color: #2563eb; }
.stat-value.warn { color: #d97706; }
.stat-value.muted { color: #94a3b8; }

.toolbar-card {
  display: flex; flex-direction: column; gap: 12px; padding: 14px;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.search-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.search-field {
  display: flex; align-items: center; gap: 8px; flex: 1 1 280px; min-width: 220px;
  height: 38px; padding: 0 12px; border: 1px solid #e2e8f0; border-radius: 12px;
  background: #f8fafc; color: #94a3b8;
}
.search-field:focus-within { border-color: #93c5fd; background: #fff; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }
.search-text { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; font-size: 13px; color: #0f172a; }
.toolbar-bottom { display: flex; flex-wrap: wrap; gap: 12px; }
.filters { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.filter-sep { width: 1px; height: 20px; background: #e2e8f0; }
.filter-btn {
  padding: 7px 12px; border: 1px solid #e2e8f0; border-radius: 999px; background: #fff;
  color: #64748b; cursor: pointer; font-size: 13px; font-weight: 600;
}
.filter-btn.active { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }

.panel {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: visible;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.state-box {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; padding: 48px 20px; text-align: center; color: #64748b;
}
.state-box.compact { padding: 28px; }
.state-box h3 { margin: 0; font-size: 16px; font-weight: 800; color: #0f172a; }
.state-box p { margin: 0; font-size: 13px; color: #94a3b8; }
.spinner {
  width: 28px; height: 28px; border: 3px solid #e2e8f0; border-top-color: #2563eb;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 0.8s linear infinite; }

.table-wrap { overflow-x: auto; border-radius: 16px 16px 0 0; }
.table { width: max-content; min-width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
.table th, .table td {
  padding: 12px 14px; border-bottom: 1px solid #f1f5f9; text-align: left; vertical-align: middle; white-space: nowrap;
}
.table th { font-size: 12px; font-weight: 700; color: #94a3b8; background: #f8fafc; }
.click-row { cursor: pointer; }
.click-row:hover { background: #f8fafc; }
.id-cell { color: #94a3b8; font-weight: 700; }
.name-cell .name { font-weight: 700; color: #0f172a; }
.time-cell { color: #64748b; }

.level, .status, .reply {
  display: inline-flex; padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: 800;
}
.lv-0 { background: #f1f5f9; color: #64748b; }
.lv-1 { background: #fffbeb; color: #d97706; }
.lv-2 { background: #fef2f2; color: #dc2626; }
.status.open { background: #eff6ff; color: #2563eb; }
.status.closed { background: #f1f5f9; color: #64748b; }
.reply.rs-0 { background: #fffbeb; color: #d97706; }
.reply.rs-1 { background: #ecfdf5; color: #059669; }

.col-actions, .actions-td.sticky-right {
  position: sticky; right: 0; background: #fff; z-index: 2;
  box-shadow: -8px 0 12px -10px rgba(15, 23, 42, 0.18);
}
.table thead .col-actions { background: #f8fafc; z-index: 3; }
.menu-trigger {
  display: inline-flex; padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 10px;
  background: #fff; color: #334155; font-size: 13px; font-weight: 600; cursor: pointer;
}
.menu-trigger:hover { border-color: #bfdbfe; color: #1d4ed8; }

.pagination {
  display: flex; align-items: center; gap: 10px; padding: 12px 16px;
  border-top: 1px solid #f1f5f9; flex-wrap: wrap;
}
.page-info { font-size: 12px; color: #94a3b8; font-weight: 600; margin-right: auto; }
.page-num { font-size: 13px; font-weight: 700; }
.btn-page {
  padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff;
  font-size: 13px; font-weight: 600; cursor: pointer;
}
.btn-page:disabled { opacity: 0.45; cursor: not-allowed; }
.page-size { width: 110px; height: 32px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0 8px; font-size: 12px; }

.btn {
  display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px;
  border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; color: #334155;
  font-size: 13px; font-weight: 700; cursor: pointer;
}
.btn:disabled { opacity: 0.55; cursor: not-allowed; }
.btn.primary { background: #2563eb; border-color: #2563eb; color: #fff; }

@media (max-width: 900px) {
  .stat-row { grid-template-columns: 1fr 1fr; }
  .page-header { flex-direction: column; }
}
</style>

<style>
.modal-mask {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45);
  display: grid; place-items: center; z-index: 3500; padding: 20px;
}
.modal.modal-ticket {
  width: min(720px, 100%); background: #fff; border-radius: 18px;
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.22); overflow: hidden;
  max-height: 90vh; display: flex; flex-direction: column;
}
.modal-header {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  padding: 18px 20px 14px; border-bottom: 1px solid #f1f5f9; flex-shrink: 0;
}
.modal-header h2 { margin: 0; font-size: 17px; font-weight: 800; color: #0f172a; }
.detail-title-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.modal-sub { margin: 6px 0 0; font-size: 12px; color: #94a3b8; }
.modal-close {
  border: 0; background: #f1f5f9; width: 32px; height: 32px; border-radius: 10px;
  font-size: 20px; line-height: 1; cursor: pointer; color: #64748b; flex-shrink: 0;
}
.ticket-body {
  padding: 0; display: flex; flex-direction: column; min-height: 0; flex: 1; overflow: hidden;
}
.chat {
  flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 12px;
  background: #f8fafc; min-height: 280px; max-height: 420px;
}
.chat-empty { text-align: center; color: #94a3b8; font-size: 13px; padding: 40px 0; }
.bubble {
  max-width: 78%; padding: 10px 12px; border-radius: 14px; background: #fff;
  border: 1px solid #e2e8f0; align-self: flex-start;
}
.bubble.me {
  align-self: flex-end; background: #eff6ff; border-color: #bfdbfe;
}
.bubble-meta {
  display: flex; justify-content: space-between; gap: 12px;
  font-size: 11px; font-weight: 700; color: #94a3b8; margin-bottom: 4px;
}
.bubble-text {
  font-size: 13px; color: #0f172a; line-height: 1.55; white-space: pre-wrap; word-break: break-word;
}
.reply-box {
  padding: 14px 20px 18px; border-top: 1px solid #e2e8f0; background: #fff; flex-shrink: 0;
}
.reply-input {
  width: 100%; box-sizing: border-box; border: 1px solid #e2e8f0; border-radius: 12px;
  padding: 10px 12px; font-size: 13px; resize: vertical; min-height: 72px; color: #0f172a;
  font-family: inherit;
}
.reply-input:focus { outline: none; border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }
.reply-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px; }
.closed-tip {
  padding: 14px 20px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 13px; font-weight: 600;
}
.toast {
  position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%);
  background: #0f172a; color: #fff; padding: 10px 16px; border-radius: 12px;
  font-size: 13px; font-weight: 600; z-index: 5000; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.25);
}
.toast.error { background: #b91c1c; }
</style>
