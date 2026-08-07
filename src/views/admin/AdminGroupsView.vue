<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">权限组管理</h1>
        <p class="page-subtitle">控制用户可见节点范围；节点、套餐与用户均绑定权限组。</p>
      </div>
      <div class="header-actions">
        <button class="btn" :disabled="loading" @click="load" title="刷新列表">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :class="{ spinning: loading }"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
          刷新
        </button>
        <button class="btn primary" @click="openAdd">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          添加权限组
        </button>
      </div>
    </div>

    <div class="stat-row" v-if="!loading && rows.length">
      <div class="stat-card">
        <span class="stat-label">权限组</span>
        <strong class="stat-value">{{ rows.length }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">关联用户</span>
        <strong class="stat-value accent">{{ totalUsers }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">关联节点</span>
        <strong class="stat-value">{{ totalServers }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">未使用</span>
        <strong class="stat-value muted">{{ unusedCount }}</strong>
      </div>
    </div>

    <div class="toolbar" v-if="!loading && rows.length">
      <div class="search-box">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input v-model="query" class="search-input" placeholder="搜索组名 / ID" />
      </div>
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
        <p>加载权限组…</p>
      </div>
      <div v-else-if="!rows.length" class="state-box empty">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <h3>暂无权限组</h3>
        <p>创建权限组后，可在节点与套餐中勾选可见范围。</p>
        <button class="btn primary" @click="openAdd">添加第一个权限组</button>
      </div>
      <div v-else-if="!filtered.length" class="state-box empty compact">
        <h3>没有匹配的权限组</h3>
        <p>试试调整搜索词或筛选条件。</p>
        <button class="btn" @click="resetFilters">清除筛选</button>
      </div>
      <div v-else class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th style="width:64px">#</th>
              <th>组名</th>
              <th>关联用户</th>
              <th>关联节点</th>
              <th>关联套餐</th>
              <th>更新时间</th>
              <th style="width:168px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="g in filtered" :key="g.id">
              <td class="id-cell">{{ g.id }}</td>
              <td>
                <div class="name-cell">
                  <span class="avatar" :style="{ background: avatarColor(g.id) }">{{ nameInitial(g.name) }}</span>
                  <div class="name-meta">
                    <span class="name">{{ g.name }}</span>
                    <span v-if="isInUse(g)" class="meta">使用中</span>
                    <span v-else class="meta idle">可删除</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="metric" :class="{ zero: !(g.user_count) }">{{ g.user_count ?? 0 }}</span>
              </td>
              <td>
                <span class="metric" :class="{ zero: !(g.server_count) }">{{ g.server_count ?? 0 }}</span>
              </td>
              <td>
                <span class="metric" :class="{ zero: !(g.plan_count) }">{{ g.plan_count ?? 0 }}</span>
              </td>
              <td class="time-cell">{{ fmtTime(g.updated_at) }}</td>
              <td>
                <div class="actions-cell">
                  <button type="button" class="btn-sm edit" @click="openEdit(g)">编辑</button>
                  <button
                    type="button"
                    class="btn-sm danger"
                    :disabled="isInUse(g)"
                    :title="isInUse(g) ? dropBlockedReason(g) : '删除权限组'"
                    @click="askDrop(g)"
                  >
                    删除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 编辑 / 新建 -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-mask" @click.self="closeModal">
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal-header">
            <div>
              <h2>{{ editId ? '编辑权限组' : '添加权限组' }}</h2>
              <p class="modal-sub">组名需唯一，用于节点可见性与套餐绑定。</p>
            </div>
            <button type="button" class="modal-close" @click="closeModal">&times;</button>
          </div>
          <form class="modal-body" @submit.prevent="doSave">
            <div class="form-row">
              <label>组名 <span class="req">*</span></label>
              <input
                ref="nameInput"
                v-model="form.name"
                class="input"
                placeholder="例如：普通、VIP、试用"
                maxlength="32"
                required
              />
              <p v-if="formError" class="field-error">{{ formError }}</p>
            </div>
            <div v-if="editId && editingGroup" class="usage-box">
              <div class="usage-item">
                <span>用户</span>
                <strong>{{ editingGroup.user_count ?? 0 }}</strong>
              </div>
              <div class="usage-item">
                <span>节点</span>
                <strong>{{ editingGroup.server_count ?? 0 }}</strong>
              </div>
              <div class="usage-item">
                <span>套餐</span>
                <strong>{{ editingGroup.plan_count ?? 0 }}</strong>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn" @click="closeModal">取消</button>
              <button type="submit" class="btn primary" :disabled="saving">
                {{ saving ? '保存中…' : '保存' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- 删除确认 -->
    <Teleport to="body">
      <div v-if="dropTarget" class="modal-mask" @click.self="dropTarget = null">
        <div class="modal confirm-modal" role="dialog" aria-modal="true">
          <div class="modal-header">
            <div>
              <h2>删除权限组</h2>
              <p class="modal-sub">此操作不可恢复</p>
            </div>
            <button type="button" class="modal-close" @click="dropTarget = null">&times;</button>
          </div>
          <div class="modal-body">
            <p class="confirm-text">
              确定删除权限组「<strong>{{ dropTarget.name }}</strong>」吗？
            </p>
            <p v-if="isInUse(dropTarget)" class="confirm-warn">{{ dropBlockedReason(dropTarget) }}</p>
            <div class="modal-footer">
              <button type="button" class="btn" @click="dropTarget = null">取消</button>
              <button
                type="button"
                class="btn danger-solid"
                :disabled="dropping || isInUse(dropTarget)"
                @click="doDrop"
              >
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
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { fetchGroups, saveGroup, dropGroup, type ServerGroup } from '../../api/admin/group'

type FilterKey = 'all' | 'users' | 'servers' | 'unused'

const rows = ref<ServerGroup[]>([])
const loading = ref(true)
const showModal = ref(false)
const saving = ref(false)
const dropping = ref(false)
const editId = ref<number | null>(null)
const form = ref({ name: '' })
const formError = ref('')
const query = ref('')
const filter = ref<FilterKey>('all')
const dropTarget = ref<ServerGroup | null>(null)
const nameInput = ref<HTMLInputElement | null>(null)

const toastMessage = ref('')
const toastError = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string, error = false) {
  toastMessage.value = msg
  toastError.value = error
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    if (toastMessage.value === msg) toastMessage.value = ''
  }, 2600)
}

const editingGroup = computed(() =>
  editId.value == null ? null : rows.value.find((g) => g.id === editId.value) ?? null
)

const totalUsers = computed(() => rows.value.reduce((n, g) => n + (g.user_count ?? 0), 0))
const totalServers = computed(() => rows.value.reduce((n, g) => n + (g.server_count ?? 0), 0))
const unusedCount = computed(() => rows.value.filter((g) => !isInUse(g)).length)

const filterTabs = computed(() => [
  { value: 'all' as const, label: '全部', count: rows.value.length },
  { value: 'users' as const, label: '有用户', count: rows.value.filter((g) => (g.user_count ?? 0) > 0).length },
  { value: 'servers' as const, label: '有节点', count: rows.value.filter((g) => (g.server_count ?? 0) > 0).length },
  { value: 'unused' as const, label: '未使用', count: unusedCount.value }
])

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return rows.value.filter((g) => {
    if (filter.value === 'users' && !(g.user_count ?? 0)) return false
    if (filter.value === 'servers' && !(g.server_count ?? 0)) return false
    if (filter.value === 'unused' && isInUse(g)) return false
    if (!q) return true
    return g.name.toLowerCase().includes(q) || String(g.id).includes(q)
  })
})

function isInUse(g: ServerGroup) {
  return (g.user_count ?? 0) > 0 || (g.server_count ?? 0) > 0 || (g.plan_count ?? 0) > 0
}

function dropBlockedReason(g: ServerGroup) {
  const parts: string[] = []
  if ((g.user_count ?? 0) > 0) parts.push(`${g.user_count} 个用户`)
  if ((g.server_count ?? 0) > 0) parts.push(`${g.server_count} 个节点`)
  if ((g.plan_count ?? 0) > 0) parts.push(`${g.plan_count} 个套餐`)
  return parts.length ? `该组仍关联 ${parts.join('、')}，无法删除` : ''
}

function nameInitial(name: string) {
  const t = (name || '').trim()
  return t ? t.slice(0, 1).toUpperCase() : '?'
}

function avatarColor(id: number) {
  const colors = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#65a30d']
  return colors[Math.abs(id) % colors.length]
}

function fmtTime(ts?: number) {
  if (!ts) return '—'
  const d = new Date(ts * 1000)
  if (Number.isNaN(d.getTime())) return '—'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function resetFilters() {
  query.value = ''
  filter.value = 'all'
}

async function load() {
  loading.value = true
  try {
    const list = await fetchGroups()
    rows.value = list.slice().sort((a, b) => a.id - b.id)
  } catch (e: any) {
    showToast(e?.message || '加载失败', true)
  } finally {
    loading.value = false
  }
}

async function openAdd() {
  editId.value = null
  form.value = { name: '' }
  formError.value = ''
  showModal.value = true
  await nextTick()
  nameInput.value?.focus()
}

async function openEdit(g: ServerGroup) {
  editId.value = g.id
  form.value = { name: g.name }
  formError.value = ''
  showModal.value = true
  await nextTick()
  nameInput.value?.focus()
  nameInput.value?.select()
}

function closeModal() {
  if (saving.value) return
  showModal.value = false
}

function validateName(): boolean {
  const name = form.value.name.trim()
  if (!name) {
    formError.value = '组名不能为空'
    return false
  }
  if (name.length > 32) {
    formError.value = '组名最多 32 个字符'
    return false
  }
  const dup = rows.value.find(
    (g) => g.name.trim().toLowerCase() === name.toLowerCase() && g.id !== editId.value
  )
  if (dup) {
    formError.value = `已存在同名权限组「${dup.name}」`
    return false
  }
  formError.value = ''
  return true
}

async function doSave() {
  if (!validateName()) return
  saving.value = true
  try {
    await saveGroup({ id: editId.value ?? undefined, name: form.value.name.trim() })
    showModal.value = false
    showToast(editId.value ? '权限组已更新' : '权限组已创建')
    await load()
  } catch (e: any) {
    formError.value = e?.message || '保存失败'
    showToast(e?.message || '保存失败', true)
  } finally {
    saving.value = false
  }
}

function askDrop(g: ServerGroup) {
  if (isInUse(g)) {
    showToast(dropBlockedReason(g), true)
    return
  }
  dropTarget.value = g
}

async function doDrop() {
  const g = dropTarget.value
  if (!g || isInUse(g)) return
  dropping.value = true
  try {
    await dropGroup(g.id)
    dropTarget.value = null
    showToast(`已删除「${g.name}」`)
    await load()
  } catch (e: any) {
    showToast(e?.message || '删除失败', true)
  } finally {
    dropping.value = false
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
  load()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  if (toastTimer) clearTimeout(toastTimer)
})
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

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
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 14px 16px;
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.04));
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-label {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-main, #0f172a);
  letter-spacing: -0.03em;
}

.stat-value.accent { color: var(--primary-color, #2563eb); }
.stat-value.muted { color: #94a3b8; }

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: min(320px, 100%);
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  color: #94a3b8;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: var(--text-main, #0f172a);
}

.filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

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
  transition: all 0.15s ease;
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

.filter-btn.active em {
  background: #dbeafe;
  color: #1d4ed8;
}

.panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 0;
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.04));
  overflow: hidden;
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

.state-box h3 {
  margin: 4px 0 0;
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
}

.state-box p {
  margin: 0;
  font-size: 13px;
  color: #94a3b8;
}

.state-box.compact {
  padding: 40px 20px;
}

.empty-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #f1f5f9;
  color: #64748b;
  display: grid;
  place-items: center;
  margin-bottom: 4px;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinning {
  animation: spin 0.8s linear infinite;
}

.table-wrap {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.table th,
.table td {
  border-bottom: 1px solid #f1f5f9;
  padding: 12px 14px;
  text-align: left;
  vertical-align: middle;
}

.table th {
  background: #f8fafc;
  color: #64748b;
  font-weight: 700;
  font-size: 12px;
}

.table tbody tr:hover {
  background: #f8fafc;
}

.id-cell {
  color: #94a3b8;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 140px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.name-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.name {
  font-weight: 700;
  color: #0f172a;
}

.meta {
  font-size: 11px;
  font-weight: 700;
  color: #059669;
}

.meta.idle {
  color: #94a3b8;
}

.metric {
  display: inline-flex;
  min-width: 28px;
  justify-content: center;
  padding: 3px 10px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.metric.zero {
  background: #f1f5f9;
  color: #94a3b8;
}

.time-cell {
  color: #64748b;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.actions-cell {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
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

.btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn.primary {
  background: var(--primary-color, #2563eb);
  border-color: var(--primary-color, #2563eb);
  color: #fff;
}

.btn.primary:hover:not(:disabled) {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

.btn.danger-solid {
  background: #dc2626;
  border-color: #dc2626;
  color: #fff;
}

.btn.danger-solid:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-sm {
  padding: 5px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  background: #fff;
  color: #334155;
  line-height: 1.4;
  white-space: nowrap;
}

.btn-sm.edit {
  color: #2563eb;
  border-color: #bfdbfe;
  background: #eff6ff;
}

.btn-sm.edit:hover {
  background: #dbeafe;
}

.btn-sm.danger {
  color: #dc2626;
  border-color: #fecaca;
  background: #fef2f2;
}

.btn-sm.danger:hover:not(:disabled) {
  background: #fee2e2;
}

.btn-sm:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

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
  width: 440px;
  max-width: 94vw;
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
  color: #0f172a;
  animation: modalIn 0.16s ease;
}

.confirm-modal {
  width: 420px;
}

@keyframes modalIn {
  from { transform: translateY(8px); opacity: 0.6; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #f1f5f9;
}

.modal-header h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
}

.modal-sub {
  margin: 4px 0 0;
  font-size: 12px;
  color: #94a3b8;
}

.modal-close {
  border: none;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  color: #94a3b8;
  cursor: pointer;
}

.modal-body {
  padding: 18px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row label {
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
}

.req { color: #ef4444; }

.input {
  width: 100%;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #0f172a;
  font-size: 14px;
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.field-error {
  margin: 0;
  font-size: 12px;
  color: #dc2626;
  font-weight: 600;
}

.usage-box {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.usage-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: center;
}

.usage-item span {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
}

.usage-item strong {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}

.confirm-text {
  margin: 0;
  font-size: 14px;
  color: #334155;
  line-height: 1.6;
}

.confirm-warn {
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: 13px;
  font-weight: 600;
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

.toast.error {
  background: #dc2626;
}

@media (max-width: 900px) {
  .stat-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 640px) {
  .page-header { flex-direction: column; }
  .header-actions { width: 100%; }
  .header-actions .btn { flex: 1; justify-content: center; }
  .toolbar { flex-direction: column; align-items: stretch; }
  .search-box { min-width: 0; }
}
</style>
