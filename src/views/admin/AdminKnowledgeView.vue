<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">知识库管理</h1>
        <p class="page-subtitle">管理帮助文章的分类、正文与显隐；拖拽左侧手柄可调整排序。</p>
      </div>
      <div class="header-actions">
        <button class="btn" :disabled="loading" @click="load" title="刷新列表">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :class="{ spinning: loading }"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
          刷新
        </button>
        <button class="btn primary" @click="openAdd">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          新建文章
        </button>
      </div>
    </div>

    <div class="toolbar" v-if="!loading && articles.length">
      <div class="filters">
        <button
          type="button"
          class="filter-btn"
          :class="{ active: categoryFilter === 'all' }"
          @click="categoryFilter = 'all'"
        >
          <span>全部</span>
          <em>{{ articles.length }}</em>
        </button>
        <button
          v-for="cat in categoryOptions"
          :key="cat"
          type="button"
          class="filter-btn"
          :class="{ active: categoryFilter === cat }"
          @click="categoryFilter = cat"
        >
          <span>{{ cat }}</span>
          <em>{{ categoryCounts[cat] || 0 }}</em>
        </button>
      </div>
    </div>

    <div class="panel">
      <div v-if="loading" class="state-box">
        <div class="spinner"></div>
        <p>加载知识库…</p>
      </div>
      <div v-else-if="!articles.length" class="state-box empty">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/></svg>
        </div>
        <h3>暂无文章</h3>
        <p>创建知识库文章后，用户可在「知识库」页面查阅。</p>
        <button class="btn primary" @click="openAdd">新建第一篇文章</button>
      </div>
      <div v-else-if="!filtered.length" class="state-box empty compact">
        <h3>该分类下暂无文章</h3>
        <p>试试切换分类筛选。</p>
        <button class="btn" @click="categoryFilter = 'all'">显示全部</button>
      </div>
      <div v-else class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th class="col-drag"></th>
              <th>分类</th>
              <th>标题</th>
              <th>语言</th>
              <th>状态</th>
              <th>更新时间</th>
              <th class="col-actions sticky-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in filtered"
              :key="item.id"
              :class="{ dragging: dragId === item.id, 'drag-over': dragOverId === item.id }"
              draggable="true"
              @dragstart="onDragStart(item, $event)"
              @dragover.prevent="onDragOver(item)"
              @dragleave="onDragLeave(item)"
              @drop.prevent="onDropRow(item)"
              @dragend="onDragEnd"
            >
              <td class="col-drag">
                <span class="drag-handle" title="拖拽排序">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
                </span>
              </td>
              <td>
                <span class="cat-tag">{{ item.category || '未分类' }}</span>
              </td>
              <td>
                <span class="name">{{ item.title || '—' }}</span>
              </td>
              <td class="lang-cell">{{ item.language || '—' }}</td>
              <td>
                <button
                  type="button"
                  class="switch"
                  :class="{ on: item.show === 1 }"
                  :disabled="togglingId === item.id"
                  :title="item.show === 1 ? '点击隐藏' : '点击显示'"
                  @click="toggleShow(item)"
                >
                  <i class="knob"></i>
                </button>
              </td>
              <td class="time-cell">{{ fmtTime(item.updated_at) }}</td>
              <td class="actions-td sticky-right">
                <button type="button" class="link-btn" :disabled="editingId === item.id" @click="openEdit(item)">
                  {{ editingId === item.id ? '加载中…' : '编辑' }}
                </button>
                <button type="button" class="link-btn danger" @click="askDrop(item)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="sorting" class="sort-hint">正在保存排序…</p>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showModal" class="modal-mask" @click.self="closeModal">
        <div class="modal edit-modal" role="dialog" aria-modal="true" style="width: min(1280px, calc(100vw - 48px)); max-width: calc(100vw - 48px);">
          <div class="modal-header">
            <div>
              <h2>{{ form.id ? '编辑文章' : '新建文章' }}</h2>
              <p class="modal-sub">TinyMCE 可视化编辑；可切换预览。分类可从已有项选择，也可输入新分类。占位符如 <code v-pre>{{subscribeUrl}}</code> 会在用户端替换。</p>
            </div>
            <button type="button" class="modal-close" @click="closeModal">&times;</button>
          </div>
          <form class="edit-form" @submit.prevent="doSave">
            <div class="form-grid">
              <div class="form-row">
                <label>分类</label>
                <input
                  v-model="form.category"
                  class="input"
                  list="knowledge-category-list"
                  maxlength="64"
                  placeholder="如：使用教程"
                />
                <datalist id="knowledge-category-list">
                  <option v-for="c in categoryOptions" :key="c" :value="c" />
                </datalist>
              </div>
              <div class="form-row">
                <label>语言</label>
                <input v-model="form.language" class="input" maxlength="32" placeholder="zh-CN" />
              </div>
            </div>
            <div class="form-row">
              <label>标题 <span class="req">*</span></label>
              <input v-model="form.title" class="input" required maxlength="128" placeholder="文章标题" />
            </div>
            <div class="form-row">
              <label>正文</label>
              <KnowledgeBodyEditor v-model="form.body" />
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
              <h2>删除文章</h2>
              <p class="modal-sub">此操作不可恢复</p>
            </div>
            <button type="button" class="modal-close" @click="dropTarget = null">&times;</button>
          </div>
          <div class="modal-body">
            <p class="confirm-text">
              确定删除文章「<strong>{{ dropTarget.title }}</strong>」吗？
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
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue'
import {
  fetchAdminKnowledge,
  fetchAdminKnowledgeById,
  fetchAdminKnowledgeCategory,
  saveAdminKnowledge,
  showAdminKnowledge,
  sortAdminKnowledge,
  dropAdminKnowledge,
  type AdminKnowledge
} from '../../api/admin'

const KnowledgeBodyEditor = defineAsyncComponent(
  () => import('../../components/admin/KnowledgeBodyEditor.vue')
)

interface KnowledgeForm {
  id?: number
  category: string
  title: string
  language: string
  body: string
  show: boolean
  sort?: number | null
}

const articles = ref<AdminKnowledge[]>([])
const categoryOptions = ref<string[]>([])
const loading = ref(true)
const saving = ref(false)
const sorting = ref(false)
const dropping = ref(false)
const showModal = ref(false)
const formError = ref('')
const categoryFilter = ref<string>('all')
const dropTarget = ref<AdminKnowledge | null>(null)
const togglingId = ref<number | null>(null)
const editingId = ref<number | null>(null)
const form = ref<KnowledgeForm>(emptyForm())

const dragId = ref<number | null>(null)
const dragOverId = ref<number | null>(null)

const toastMessage = ref('')
const toastError = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | null = null

function emptyForm(): KnowledgeForm {
  return {
    category: '',
    title: '',
    language: 'zh-CN',
    body: '',
    show: true,
    sort: null
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

const categoryCounts = computed(() => {
  const m: Record<string, number> = {}
  for (const a of articles.value) {
    const c = a.category || '未分类'
    m[c] = (m[c] || 0) + 1
  }
  return m
})

const filtered = computed(() => {
  if (categoryFilter.value === 'all') return articles.value
  return articles.value.filter((a) => (a.category || '未分类') === categoryFilter.value)
})

function fmtTime(ts?: number | null) {
  if (!ts) return '—'
  const d = new Date(ts * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function loadCategories() {
  try {
    const cats = await fetchAdminKnowledgeCategory()
    categoryOptions.value = (cats || []).slice().sort((a, b) => a.localeCompare(b, 'zh-CN'))
  } catch {
    categoryOptions.value = []
  }
}

async function load() {
  loading.value = true
  try {
    const list = await fetchAdminKnowledge()
    articles.value = list
      .slice()
      .sort((a, b) => (a.sort ?? 9999) - (b.sort ?? 9999) || (a.id ?? 0) - (b.id ?? 0))
    await loadCategories()
  } catch (e: any) {
    showToast(e?.message || '加载失败', true)
  } finally {
    loading.value = false
  }
}

function openAdd() {
  form.value = emptyForm()
  if (categoryFilter.value !== 'all' && categoryFilter.value !== '未分类') {
    form.value.category = categoryFilter.value
  }
  formError.value = ''
  showModal.value = true
}

async function openEdit(item: AdminKnowledge) {
  if (!item.id) return
  editingId.value = item.id
  formError.value = ''
  try {
    const full = await fetchAdminKnowledgeById(item.id)
    form.value = {
      id: full.id,
      category: full.category || '',
      title: full.title || '',
      language: full.language || 'zh-CN',
      body: full.body || '',
      show: full.show === 1,
      sort: full.sort ?? item.sort ?? null
    }
    showModal.value = true
  } catch (e: any) {
    showToast(e?.message || '加载详情失败', true)
  } finally {
    editingId.value = null
  }
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
    const payload: AdminKnowledge = {
      id: form.value.id,
      // Empty string clears category; omit-null would leave old value under MP NOT_NULL
      category: form.value.category.trim(),
      title: form.value.title.trim(),
      language: form.value.language.trim() || 'zh-CN',
      body: form.value.body,
      show: form.value.show ? 1 : 0,
      sort: form.value.sort ?? undefined
    }
    await saveAdminKnowledge(payload)
    showModal.value = false
    showToast(form.value.id ? '文章已更新' : '文章已创建')
    await load()
  } catch (e: any) {
    formError.value = e?.message || '保存失败'
    showToast(e?.message || '保存失败', true)
  } finally {
    saving.value = false
  }
}

function askDrop(item: AdminKnowledge) {
  dropTarget.value = item
}

async function doDrop() {
  const item = dropTarget.value
  if (!item?.id) return
  dropping.value = true
  try {
    await dropAdminKnowledge(item.id)
    dropTarget.value = null
    showToast(`已删除「${item.title}」`)
    await load()
  } catch (e: any) {
    showToast(e?.message || '删除失败', true)
  } finally {
    dropping.value = false
  }
}

async function toggleShow(item: AdminKnowledge) {
  if (!item.id) return
  togglingId.value = item.id
  try {
    await showAdminKnowledge(item.id)
    item.show = item.show === 1 ? 0 : 1
    showToast(item.show === 1 ? '已显示' : '已隐藏')
  } catch (e: any) {
    showToast(e?.message || '更新失败', true)
  } finally {
    togglingId.value = null
  }
}

function onDragStart(item: AdminKnowledge, e: DragEvent) {
  if (categoryFilter.value !== 'all') {
    e.preventDefault()
    showToast('请先切换到「全部」后再拖拽排序', true)
    return
  }
  dragId.value = item.id ?? null
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(item.id))
  }
}

function onDragOver(item: AdminKnowledge) {
  if (dragId.value == null || dragId.value === item.id) return
  dragOverId.value = item.id ?? null
}

function onDragLeave(item: AdminKnowledge) {
  if (dragOverId.value === item.id) dragOverId.value = null
}

async function onDropRow(target: AdminKnowledge) {
  const fromId = dragId.value
  dragOverId.value = null
  if (fromId == null || fromId === target.id) return
  const fromIdx = articles.value.findIndex((x) => x.id === fromId)
  const toIdx = articles.value.findIndex((x) => x.id === target.id)
  if (fromIdx < 0 || toIdx < 0) return
  const arr = articles.value.slice()
  const [moved] = arr.splice(fromIdx, 1)
  arr.splice(toIdx, 0, moved)
  arr.forEach((a, i) => {
    a.sort = i + 1
  })
  articles.value = arr
  sorting.value = true
  try {
    await sortAdminKnowledge(arr.map((a) => a.id!).filter(Boolean))
    showToast('排序已保存')
  } catch (e: any) {
    showToast(e?.message || '保存排序失败', true)
    await load()
  } finally {
    sorting.value = false
  }
}

function onDragEnd() {
  dragId.value = null
  dragOverId.value = null
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
  white-space: nowrap;
}

.table th {
  background: #f8fafc;
  color: #64748b;
  font-weight: 700;
  font-size: 12px;
}

.table tbody tr:hover td { background: #f8fafc; }
.table tbody tr.dragging { opacity: 0.5; }
.table tbody tr.drag-over td { background: #eff6ff; }

.sticky-right {
  position: sticky;
  right: 0;
  z-index: 3;
  box-shadow: -8px 0 12px -8px rgba(15, 23, 42, 0.18);
}

.table th.sticky-right { z-index: 4; background: #f8fafc; }
.table td.sticky-right { background: #fff; }
.table tbody tr:hover td.sticky-right { background: #f8fafc; }
.table tbody tr.drag-over td.sticky-right { background: #eff6ff; }

.col-drag { width: 36px; padding-left: 8px !important; padding-right: 4px !important; }

.drag-handle {
  display: inline-flex;
  color: #cbd5e1;
  cursor: grab;
}
.drag-handle:active { cursor: grabbing; }
.drag-handle:hover { color: #64748b; }

.cat-tag {
  display: inline-flex;
  padding: 3px 10px;
  border-radius: 6px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
}

.name { font-weight: 700; color: #0f172a; }
.lang-cell { color: #64748b; font-variant-numeric: tabular-nums; }
.time-cell {
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
.link-btn:hover:not(:disabled) { text-decoration: underline; }
.link-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.link-btn.danger { color: #dc2626; }

.sort-hint {
  margin: 0;
  padding: 8px 14px;
  font-size: 12px;
  color: #64748b;
  border-top: 1px solid #f1f5f9;
}

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
  padding: 8px 24px 24px;
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
.textarea { resize: vertical; min-height: 280px; line-height: 1.5; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }

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
