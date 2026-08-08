<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">公告管理</h1>
        <p class="page-subtitle">管理站点公告的标题、正文、标签与显隐；显示中的公告会出现在用户仪表盘。</p>
      </div>
      <div class="header-actions">
        <button class="btn" :disabled="loading" @click="load" title="刷新列表">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :class="{ spinning: loading }"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
          刷新
        </button>
        <button class="btn primary" @click="openAdd">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          新建公告
        </button>
      </div>
    </div>

    <div class="toolbar" v-if="!loading && notices.length">
      <div class="filters">
        <button
          v-for="ft in filterTabs"
          :key="ft.value"
          type="button"
          class="filter-btn"
          :class="{ active: filter === ft.value }"
          @click="filter = ft.value"
        >
          <span>{{ ft.label }}</span>
          <em>{{ ft.count }}</em>
        </button>
      </div>
    </div>

    <div class="panel">
      <div v-if="loading" class="state-box">
        <div class="spinner"></div>
        <p>加载公告…</p>
      </div>
      <div v-else-if="!notices.length" class="state-box empty">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
        </div>
        <h3>暂无公告</h3>
        <p>创建公告后，用户可在仪表盘查看最新公告。</p>
        <button class="btn primary" @click="openAdd">新建第一条公告</button>
      </div>
      <div v-else-if="!filtered.length" class="state-box empty compact">
        <h3>没有匹配的公告</h3>
        <p>试试切换显隐筛选。</p>
        <button class="btn" @click="filter = 'all'">显示全部</button>
      </div>
      <div v-else class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>标题</th>
              <th>标签</th>
              <th>图片</th>
              <th>状态</th>
              <th>更新时间</th>
              <th class="col-actions sticky-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="n in filtered" :key="n.id">
              <td>
                <div class="name-cell">
                  <span class="name">{{ n.title || '—' }}</span>
                  <span v-if="n.content" class="meta" :title="stripHtml(n.content)">{{ stripHtml(n.content) }}</span>
                </div>
              </td>
              <td>
                <div class="tags" v-if="tagList(n.tags).length">
                  <span v-for="t in tagList(n.tags)" :key="t" class="tag">{{ t }}</span>
                </div>
                <span v-else class="muted">—</span>
              </td>
              <td>
                <a v-if="n.img_url" class="img-link" :href="n.img_url" target="_blank" rel="noopener" :title="n.img_url">
                  <img v-if="isImageUrl(n.img_url)" :src="n.img_url" alt="" class="thumb" />
                  <span v-else>{{ shortUrl(n.img_url) }}</span>
                </a>
                <span v-else class="muted">—</span>
              </td>
              <td>
                <button
                  type="button"
                  class="switch"
                  :class="{ on: n.show === 1 }"
                  :disabled="togglingId === n.id"
                  :title="n.show === 1 ? '点击隐藏' : '点击显示'"
                  @click="toggleShow(n)"
                >
                  <i class="knob"></i>
                </button>
              </td>
              <td class="time-cell">{{ fmtTime(n.updated_at) }}</td>
              <td class="actions-td sticky-right">
                <button type="button" class="link-btn" @click="openEdit(n)">编辑</button>
                <button type="button" class="link-btn danger" @click="askDrop(n)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showModal" class="modal-mask" @click.self="closeModal">
        <div class="modal edit-modal" role="dialog" aria-modal="true" style="width: min(1280px, calc(100vw - 48px)); max-width: calc(100vw - 48px);">
          <div class="modal-header">
            <div>
              <h2>{{ form.id ? '编辑公告' : '新建公告' }}</h2>
              <p class="modal-sub">正文支持 HTML，将在用户端以富文本渲染。</p>
            </div>
            <button type="button" class="modal-close" @click="closeModal">&times;</button>
          </div>
          <form class="edit-form" @submit.prevent="doSave">
            <div class="form-row">
              <label>标题 <span class="req">*</span></label>
              <input v-model="form.title" class="input" required maxlength="128" placeholder="公告标题" />
            </div>
            <div class="form-row">
              <label>内容（HTML）</label>
              <textarea
                v-model="form.content"
                class="input textarea"
                rows="14"
                placeholder="支持 HTML，如 &lt;p&gt;公告内容&lt;/p&gt;"
              />
            </div>
            <div class="form-grid">
              <div class="form-row">
                <label>图片 URL</label>
                <input v-model="form.img_url" class="input" maxlength="512" placeholder="可选，图片地址" />
              </div>
              <div class="form-row">
                <label>标签</label>
                <input v-model="form.tags" class="input" maxlength="255" placeholder="逗号分隔，如：维护,活动" />
              </div>
            </div>
            <div class="form-row switches">
              <label class="switch-row">
                <button
                  type="button"
                  class="switch"
                  :class="{ on: form.show }"
                  @click="form.show = !form.show"
                >
                  <i class="knob"></i>
                </button>
                <span>{{ form.show ? '显示' : '隐藏' }}</span>
              </label>
            </div>
            <p v-if="formError" class="field-error">{{ formError }}</p>
            <div class="edit-footer">
              <span></span>
              <div class="footer-actions">
                <button type="button" class="btn" @click="closeModal">取消</button>
                <button type="submit" class="btn primary" :disabled="saving">
                  {{ saving ? '提交中…' : '提交' }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="dropTarget" class="modal-mask" @click.self="dropTarget = null">
        <div class="modal confirm-modal" role="dialog" aria-modal="true">
          <div class="modal-header">
            <div>
              <h2>删除公告</h2>
              <p class="modal-sub">此操作不可恢复</p>
            </div>
            <button type="button" class="modal-close" @click="dropTarget = null">&times;</button>
          </div>
          <div class="modal-body">
            <p class="confirm-text">
              确定删除公告「<strong>{{ dropTarget.title }}</strong>」吗？
            </p>
            <div class="modal-footer">
              <button type="button" class="btn" @click="dropTarget = null">取消</button>
              <button type="button" class="btn danger-solid" :disabled="dropping" @click="doDrop">
                {{ dropping ? '删除中…' : '确认删除' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <p v-if="toastMessage" class="toast" :class="{ error: toastError }">{{ toastMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  fetchAdminNotices,
  saveAdminNotice,
  showAdminNotice,
  dropAdminNotice,
  type AdminNotice
} from '../../api/admin'

type FilterKey = 'all' | 'show' | 'hide'

interface NoticeForm {
  id?: number
  title: string
  content: string
  img_url: string
  tags: string
  show: boolean
}

const notices = ref<AdminNotice[]>([])
const loading = ref(true)
const saving = ref(false)
const dropping = ref(false)
const showModal = ref(false)
const formError = ref('')
const filter = ref<FilterKey>('all')
const dropTarget = ref<AdminNotice | null>(null)
const togglingId = ref<number | null>(null)
const form = ref<NoticeForm>(emptyForm())

const toastMessage = ref('')
const toastError = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | null = null

function emptyForm(): NoticeForm {
  return {
    title: '',
    content: '',
    img_url: '',
    tags: '',
    show: true
  }
}

function showToast(msg: string, error = false) {
  toastMessage.value = msg
  toastError.value = error
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    if (toastMessage.value === msg) toastMessage.value = ''
  }, 2600)
}

const visibleCount = computed(() => notices.value.filter((n) => n.show === 1).length)

const filterTabs = computed(() => [
  { value: 'all' as const, label: '全部', count: notices.value.length },
  { value: 'show' as const, label: '显示中', count: visibleCount.value },
  { value: 'hide' as const, label: '已隐藏', count: notices.value.length - visibleCount.value }
])

const filtered = computed(() => {
  return notices.value.filter((n) => {
    if (filter.value === 'show' && n.show !== 1) return false
    if (filter.value === 'hide' && n.show === 1) return false
    return true
  })
})

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function tagList(tags?: string | null) {
  if (!tags) return []
  return tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean)
}

function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url) || url.startsWith('data:image/')
}

function shortUrl(url: string) {
  if (url.length <= 36) return url
  return url.slice(0, 18) + '…' + url.slice(-14)
}

function fmtTime(ts?: number | null) {
  if (!ts) return '—'
  const d = new Date(ts * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function load() {
  loading.value = true
  try {
    notices.value = await fetchAdminNotices()
  } catch (e: any) {
    showToast(e?.message || '加载失败', true)
  } finally {
    loading.value = false
  }
}

function openAdd() {
  form.value = emptyForm()
  formError.value = ''
  showModal.value = true
}

function openEdit(n: AdminNotice) {
  form.value = {
    id: n.id,
    title: n.title || '',
    content: n.content || '',
    img_url: n.img_url || '',
    tags: n.tags || '',
    show: n.show === 1
  }
  formError.value = ''
  showModal.value = true
}

function closeModal() {
  if (saving.value) return
  showModal.value = false
}

async function doSave() {
  if (!form.value.title.trim()) {
    formError.value = '标题不能为空'
    return
  }
  saving.value = true
  formError.value = ''
  try {
    const payload: AdminNotice = {
      id: form.value.id,
      title: form.value.title.trim(),
      content: form.value.content,
      // Always send strings so empty clears optional fields (MP skips null)
      img_url: form.value.img_url.trim(),
      tags: form.value.tags.trim(),
      show: form.value.show ? 1 : 0
    }
    await saveAdminNotice(payload)
    showModal.value = false
    showToast(form.value.id ? '公告已更新' : '公告已创建')
    await load()
  } catch (e: any) {
    formError.value = e?.message || '保存失败'
    showToast(e?.message || '保存失败', true)
  } finally {
    saving.value = false
  }
}

function askDrop(n: AdminNotice) {
  dropTarget.value = n
}

async function doDrop() {
  const n = dropTarget.value
  if (!n?.id) return
  dropping.value = true
  try {
    await dropAdminNotice(n.id)
    dropTarget.value = null
    showToast(`已删除「${n.title}」`)
    await load()
  } catch (e: any) {
    showToast(e?.message || '删除失败', true)
  } finally {
    dropping.value = false
  }
}

async function toggleShow(n: AdminNotice) {
  if (!n.id) return
  togglingId.value = n.id
  try {
    await showAdminNotice(n.id)
    n.show = n.show === 1 ? 0 : 1
    showToast(n.show === 1 ? '已显示' : '已隐藏')
  } catch (e: any) {
    showToast(e?.message || '更新失败', true)
  } finally {
    togglingId.value = null
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (dropTarget.value) {
    dropTarget.value = null
    return
  }
  if (showModal.value) closeModal()
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

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: var(--text-main, #0f172a);
  letter-spacing: -0.02em;
}

.page-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--text-muted, #64748b);
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.toolbar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.filters { display: flex; gap: 8px; flex-wrap: wrap; }

.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px 7px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #fff;
  color: #64748b;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}

.filter-btn em {
  font-style: normal;
  min-width: 22px;
  padding: 1px 7px;
  border-radius: 999px;
  background: #f1f5f9;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

.filter-btn.active {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.filter-btn.active em { background: #dbeafe; color: #1d4ed8; }

.panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: visible;
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.04));
}

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 56px 20px;
  text-align: center;
  color: #64748b;
}

.state-box h3 { margin: 4px 0 0; font-size: 16px; font-weight: 800; color: #0f172a; }
.state-box p { margin: 0; font-size: 13px; color: #94a3b8; }
.state-box.compact { padding: 40px 20px; }

.empty-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #f1f5f9;
  color: #64748b;
  display: grid;
  place-items: center;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 0.8s linear infinite; }

.table-wrap {
  overflow-x: auto;
  border-radius: 16px;
}

.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
}

.table th,
.table td {
  border-bottom: 1px solid #f1f5f9;
  padding: 12px 10px;
  text-align: left;
  vertical-align: middle;
  background: #fff;
}

.table th {
  background: #f8fafc;
  color: #64748b;
  font-weight: 700;
  font-size: 12px;
  white-space: nowrap;
}

.table tbody tr:hover td { background: #f8fafc; }

.sticky-right {
  position: sticky;
  right: 0;
  z-index: 3;
  box-shadow: -8px 0 12px -8px rgba(15, 23, 42, 0.18);
}

.table th.sticky-right { z-index: 4; background: #f8fafc; }
.table td.sticky-right { background: #fff; }
.table tbody tr:hover td.sticky-right { background: #f8fafc; }

.name-cell { display: flex; flex-direction: column; gap: 2px; min-width: 120px; }
.name { font-weight: 700; color: #0f172a; }
.meta {
  font-size: 11px;
  color: #94a3b8;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tags { display: flex; flex-wrap: wrap; gap: 4px; }
.tag {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
}

.muted { color: #94a3b8; }

.img-link {
  display: inline-flex;
  align-items: center;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  max-width: 160px;
}

.img-link:hover { text-decoration: underline; }

.thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.time-cell {
  white-space: nowrap;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}

.switch {
  position: relative;
  width: 40px;
  height: 22px;
  border: none;
  border-radius: 999px;
  background: #cbd5e1;
  cursor: pointer;
  padding: 0;
  transition: background 0.18s ease;
}
.switch.on { background: #2563eb; }
.switch:disabled { opacity: 0.55; cursor: not-allowed; }
.switch .knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.2);
  transition: transform 0.18s ease;
}
.switch.on .knob { transform: translateX(18px); }

.actions-td {
  white-space: nowrap;
  text-align: right;
}

.link-btn {
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 8px;
}
.link-btn:hover { text-decoration: underline; }
.link-btn.danger { color: #dc2626; }

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  color: #0f172a;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}
.btn:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; }
.btn:disabled { opacity: 0.55; cursor: not-allowed; }
.btn.primary {
  background: var(--primary-color, #2563eb);
  border-color: var(--primary-color, #2563eb);
  color: #fff;
}
.btn.primary:hover:not(:disabled) { background: #1d4ed8; border-color: #1d4ed8; }
.btn.danger-solid { background: #dc2626; border-color: #dc2626; color: #fff; }

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal {
  background: #fff;
  border-radius: 16px;
  max-height: 92vh;
  overflow: auto;
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
}

.modal.edit-modal {
  width: min(1280px, calc(100vw - 48px));
  max-width: calc(100vw - 48px);
}
.modal.confirm-modal { width: min(420px, calc(100vw - 48px)); }

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #f1f5f9;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 2;
}

.modal-header h2 { margin: 0; font-size: 17px; font-weight: 800; }
.modal-sub { margin: 4px 0 0; font-size: 12px; color: #94a3b8; }
.modal-close {
  border: none;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  color: #94a3b8;
  cursor: pointer;
}

.edit-form {
  padding: 8px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-body {
  padding: 16px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.form-row { display: flex; flex-direction: column; gap: 6px; }
.form-row.switches { flex-direction: row; align-items: center; }
.form-row label { font-size: 13px; color: #64748b; font-weight: 600; }
.req { color: #ef4444; }

.input {
  width: 100%;
  padding: 9px 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #0f172a;
  font-size: 13px;
  box-sizing: border-box;
}
.input:focus {
  outline: none;
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}
.textarea { resize: vertical; min-height: 240px; line-height: 1.5; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }

.switch-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #334155;
  font-weight: 600;
  cursor: pointer;
}

.field-error { margin: 0; font-size: 12px; color: #dc2626; font-weight: 600; }

.edit-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 4px;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
}

.footer-actions { display: flex; gap: 8px; margin-left: auto; }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
}

.confirm-text { margin: 0; font-size: 14px; color: #334155; line-height: 1.6; }

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

@media (max-width: 640px) {
  .page-header { flex-direction: column; }
  .header-actions { width: 100%; }
  .form-grid { grid-template-columns: 1fr; }
}
</style>
