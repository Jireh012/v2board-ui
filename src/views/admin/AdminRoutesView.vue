<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">路由管理</h1>
        <p class="page-subtitle">创建路由规则后，需在节点中勾选绑定才会生效。</p>
      </div>
      <div class="header-actions">
        <button class="btn" :disabled="loading" @click="load" title="刷新列表">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :class="{ spinning: loading }"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
          刷新
        </button>
        <button class="btn primary" @click="openAdd">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          创建路由
        </button>
      </div>
    </div>

    <div class="stat-row" v-if="!loading && rows.length">
      <div class="stat-card">
        <span class="stat-label">路由规则</span>
        <strong class="stat-value">{{ rows.length }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">阻断类</span>
        <strong class="stat-value muted">{{ blockCount }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">DNS / 出站</span>
        <strong class="stat-value accent">{{ routeCount }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">动作类型</span>
        <strong class="stat-value">{{ actionTypeCount }}</strong>
      </div>
    </div>

    <div class="toolbar" v-if="!loading && rows.length">
      <div class="search-box">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input v-model="query" class="search-input" placeholder="搜索备注 / 动作 / 匹配值" />
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
        <p>加载路由…</p>
      </div>
      <div v-else-if="!rows.length" class="state-box empty">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
        </div>
        <h3>暂无路由规则</h3>
        <p>匹配指定规则后执行阻断、DNS 或指定出站等动作。</p>
        <button class="btn primary" @click="openAdd">创建第一个路由</button>
      </div>
      <div v-else-if="!filtered.length" class="state-box empty compact">
        <h3>没有匹配的路由</h3>
        <p>试试调整搜索词或筛选条件。</p>
        <button class="btn" @click="resetFilters">清除筛选</button>
      </div>
      <div v-else class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th style="width:56px">#</th>
              <th>备注</th>
              <th>动作</th>
              <th>动作值</th>
              <th>匹配值</th>
              <th style="width:160px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in filtered" :key="r.id">
              <td class="id-cell">{{ r.id }}</td>
              <td>
                <div class="name-cell">
                  <span class="name">{{ r.remarks }}</span>
                </div>
              </td>
              <td>
                <span class="tag" :class="'tag-' + actionTone(r.action)">{{ routeActionLabel(r.action) }}</span>
              </td>
              <td>
                <code v-if="r.action_value" class="value-chip" :title="r.action_value">{{ shortValue(r.action_value) }}</code>
                <span v-else class="muted">—</span>
              </td>
              <td>
                <div class="match-cell" :title="fmtMatch(r.match)">
                  <span v-if="!matchList(r.match).length" class="muted">—</span>
                  <template v-else>
                    <span class="match-chip" v-for="(m, i) in matchPreview(r.match)" :key="i">{{ m }}</span>
                    <span v-if="matchList(r.match).length > 2" class="match-more">+{{ matchList(r.match).length - 2 }}</span>
                  </template>
                </div>
              </td>
              <td>
                <div class="actions-cell">
                  <button type="button" class="btn-sm edit" @click="openEdit(r)">编辑</button>
                  <button type="button" class="btn-sm danger" @click="askDrop(r)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 创建 / 编辑：字段顺序对齐原版 -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-mask" @click.self="closeModal">
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h2>{{ editId ? '编辑路由' : '创建路由' }}</h2>
            <button type="button" class="modal-close" @click="closeModal">&times;</button>
          </div>
          <form class="modal-body" @submit.prevent="doSave">
            <div class="form-row">
              <label>备注</label>
              <input
                ref="remarksInput"
                v-model="form.remarks"
                class="input"
                placeholder="请输入备注"
                maxlength="64"
                required
              />
            </div>

            <div v-if="currentAction?.needsMatch !== false" class="form-row">
              <div class="label-row">
                <label>匹配值</label>
                <button type="button" class="link-btn" @click="showMatchHelp = true">填写参考</button>
              </div>
              <textarea
                v-model="matchText"
                class="input textarea"
                rows="5"
                :placeholder="matchPlaceholder"
                :required="needsMatch"
              />
              <p class="field-hint">{{ currentAction?.matchHint || '每行一条匹配规则' }}</p>
            </div>

            <div class="form-row">
              <label>动作</label>
              <select v-model="form.action" class="input" required>
                <option value="" disabled>请选择动作</option>
                <option v-for="a in ROUTE_ACTION_OPTIONS" :key="a.value" :value="a.value">
                  {{ a.label }}
                </option>
              </select>
            </div>

            <div v-if="currentAction?.needsActionValue" class="form-row">
              <label>{{ currentAction.valueLabel }} <span class="req">*</span></label>
              <textarea
                v-if="form.action === 'route' || form.action === 'route_ip' || form.action === 'default_out'"
                v-model="form.action_value"
                class="input textarea mono"
                rows="6"
                :placeholder="currentAction.valuePlaceholder"
                required
              />
              <input
                v-else
                v-model="form.action_value"
                class="input"
                :placeholder="currentAction.valuePlaceholder"
                required
              />
            </div>

            <p v-if="formError" class="field-error">{{ formError }}</p>

            <div class="modal-footer">
              <button type="button" class="btn" @click="closeModal">取消</button>
              <button type="submit" class="btn primary" :disabled="saving">
                {{ saving ? '保存中…' : '确定' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- 填写参考 -->
    <Teleport to="body">
      <div v-if="showMatchHelp" class="modal-mask" @click.self="showMatchHelp = false">
        <div class="modal help-modal" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h2>匹配值填写参考</h2>
            <button type="button" class="modal-close" @click="showMatchHelp = false">&times;</button>
          </div>
          <div class="modal-body">
            <p class="help-intro">每行填写一条规则，常见写法如下：</p>
            <div class="help-list">
              <div class="help-item" v-for="item in matchHelpItems" :key="item.example">
                <code>{{ item.example }}</code>
                <span>{{ item.desc }}</span>
              </div>
            </div>
            <p class="help-note">
              不同动作对应不同匹配类型：域名 / IP / 端口 / 协议。创建后请到节点编辑中勾选该路由。
            </p>
            <div class="modal-footer">
              <a class="btn" href="https://v2board.com/use/node" target="_blank" rel="noopener">查看文档</a>
              <button type="button" class="btn primary" @click="showMatchHelp = false">知道了</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 删除确认 -->
    <Teleport to="body">
      <div v-if="dropTarget" class="modal-mask" @click.self="dropTarget = null">
        <div class="modal confirm-modal" role="dialog" aria-modal="true">
          <div class="modal-header">
            <div>
              <h2>删除路由</h2>
              <p class="modal-sub">此操作不可恢复</p>
            </div>
            <button type="button" class="modal-close" @click="dropTarget = null">&times;</button>
          </div>
          <div class="modal-body">
            <p class="confirm-text">
              确定删除路由「<strong>{{ dropTarget.remarks }}</strong>」吗？已绑定该路由的节点将不再应用此规则。
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
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import {
  fetchRoutes,
  saveRoute,
  dropRoute,
  routeActionLabel,
  routeActionOption,
  ROUTE_ACTION_OPTIONS,
  type ServerRoute
} from '../../api/admin/route'

type FilterKey = 'all' | 'block' | 'dns' | 'route'

const rows = ref<ServerRoute[]>([])
const loading = ref(true)
const showModal = ref(false)
const showMatchHelp = ref(false)
const saving = ref(false)
const dropping = ref(false)
const editId = ref<number | null>(null)
const form = ref({ remarks: '', action: '', action_value: '' })
const matchText = ref('')
const formError = ref('')
const query = ref('')
const filter = ref<FilterKey>('all')
const dropTarget = ref<ServerRoute | null>(null)
const remarksInput = ref<HTMLInputElement | null>(null)

const toastMessage = ref('')
const toastError = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | null = null

const matchHelpItems = [
  { example: 'example.com', desc: '关键字匹配' },
  { example: 'domain:example.com', desc: '子域名匹配' },
  { example: 'full:www.example.com', desc: '完整域名匹配' },
  { example: 'geosite:netflix', desc: '预定义域名列表' },
  { example: 'geoip:cn', desc: '预定义 IP 列表（IP 类动作）' },
  { example: '1.1.1.1/32', desc: 'CIDR（IP 类动作）' },
  { example: '443', desc: '端口（端口类动作）' },
  { example: 'bittorrent', desc: '协议（协议类动作）' }
]

const matchPlaceholder = [
  'example.com(关键字匹配)',
  'domain:example.com(子域名匹配)',
  'geosite:netflix(预定义域名列表)'
].join('\n')

const currentAction = computed(() => routeActionOption(form.value.action))
const needsMatch = computed(() => currentAction.value?.needsMatch !== false)

function showToast(msg: string, error = false) {
  toastMessage.value = msg
  toastError.value = error
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    if (toastMessage.value === msg) toastMessage.value = ''
  }, 2600)
}

function isBlockAction(action: string) {
  return ['block', 'block_ip', 'block_port', 'protocol'].includes(action)
}

function isRouteAction(action: string) {
  return ['dns', 'route', 'route_ip', 'default_out'].includes(action)
}

const blockCount = computed(() => rows.value.filter((r) => isBlockAction(r.action)).length)
const routeCount = computed(() => rows.value.filter((r) => isRouteAction(r.action)).length)
const actionTypeCount = computed(() => new Set(rows.value.map((r) => r.action)).size)

const filterTabs = computed(() => [
  { value: 'all' as const, label: '全部', count: rows.value.length },
  { value: 'block' as const, label: '阻断', count: blockCount.value },
  { value: 'dns' as const, label: 'DNS', count: rows.value.filter((r) => r.action === 'dns').length },
  { value: 'route' as const, label: '出站', count: rows.value.filter((r) => ['route', 'route_ip', 'default_out'].includes(r.action)).length }
])

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return rows.value.filter((r) => {
    if (filter.value === 'block' && !isBlockAction(r.action)) return false
    if (filter.value === 'dns' && r.action !== 'dns') return false
    if (filter.value === 'route' && !['route', 'route_ip', 'default_out'].includes(r.action)) return false
    if (!q) return true
    const matchStr = matchList(r.match).join(' ').toLowerCase()
    return (
      r.remarks.toLowerCase().includes(q) ||
      r.action.toLowerCase().includes(q) ||
      routeActionLabel(r.action).toLowerCase().includes(q) ||
      matchStr.includes(q) ||
      String(r.id).includes(q)
    )
  })
})

function matchList(match: string[] | string | null | undefined): string[] {
  if (!match) return []
  if (Array.isArray(match)) return match.map(String).filter(Boolean)
  try {
    const parsed = JSON.parse(match)
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : []
  } catch {
    return String(match).split('\n').map((s) => s.trim()).filter(Boolean)
  }
}

function matchPreview(match: string[] | string | null | undefined) {
  return matchList(match).slice(0, 2)
}

function fmtMatch(match: string[] | string | null | undefined) {
  const list = matchList(match)
  return list.length ? list.join('\n') : ''
}

function shortValue(v: string) {
  const s = v.replace(/\s+/g, ' ').trim()
  return s.length > 36 ? `${s.slice(0, 36)}…` : s
}

function actionTone(action: string) {
  if (isBlockAction(action)) return 'block'
  if (action === 'dns') return 'dns'
  return 'route'
}

function resetFilters() {
  query.value = ''
  filter.value = 'all'
}

async function load() {
  loading.value = true
  try {
    const list = await fetchRoutes()
    rows.value = list.slice().sort((a, b) => a.id - b.id)
  } catch (e: any) {
    showToast(e?.message || '加载失败', true)
  } finally {
    loading.value = false
  }
}

async function openAdd() {
  editId.value = null
  form.value = { remarks: '', action: '', action_value: '' }
  matchText.value = ''
  formError.value = ''
  showModal.value = true
  await nextTick()
  remarksInput.value?.focus()
}

async function openEdit(r: ServerRoute) {
  editId.value = r.id
  form.value = {
    remarks: r.remarks,
    action: r.action,
    action_value: r.action_value || ''
  }
  matchText.value = matchList(r.match).join('\n')
  formError.value = ''
  showModal.value = true
  await nextTick()
  remarksInput.value?.focus()
}

function closeModal() {
  if (saving.value) return
  showModal.value = false
}

function validate(): boolean {
  const remarks = form.value.remarks.trim()
  if (!remarks) {
    formError.value = '备注不能为空'
    return false
  }
  if (!form.value.action) {
    formError.value = '请选择动作'
    return false
  }
  const opt = routeActionOption(form.value.action)
  if (!opt) {
    formError.value = '动作类型参数有误'
    return false
  }
  const matches = matchText.value.split('\n').map((s) => s.trim()).filter(Boolean)
  if (opt.needsMatch && matches.length === 0) {
    formError.value = '匹配值不能为空'
    return false
  }
  if (opt.needsActionValue && !form.value.action_value.trim()) {
    formError.value = `${opt.valueLabel}不能为空`
    return false
  }
  formError.value = ''
  return true
}

async function doSave() {
  if (!validate()) return
  saving.value = true
  try {
    const opt = routeActionOption(form.value.action)!
    const matchArr = opt.needsMatch
      ? matchText.value.split('\n').map((s) => s.trim()).filter(Boolean)
      : []
    await saveRoute({
      id: editId.value ?? undefined,
      remarks: form.value.remarks.trim(),
      match: matchArr,
      action: form.value.action,
      action_value: opt.needsActionValue ? form.value.action_value.trim() : null
    })
    showModal.value = false
    showToast(editId.value ? '路由已更新' : '路由已创建')
    await load()
  } catch (e: any) {
    formError.value = e?.message || '保存失败'
    showToast(e?.message || '保存失败', true)
  } finally {
    saving.value = false
  }
}

function askDrop(r: ServerRoute) {
  dropTarget.value = r
}

async function doDrop() {
  const r = dropTarget.value
  if (!r) return
  dropping.value = true
  try {
    await dropRoute(r.id)
    dropTarget.value = null
    showToast(`已删除「${r.remarks}」`)
    await load()
  } catch (e: any) {
    showToast(e?.message || '删除失败', true)
  } finally {
    dropping.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (showMatchHelp.value) {
    showMatchHelp.value = false
    return
  }
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
  overflow: hidden;
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

.table-wrap { overflow-x: auto; }

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

.table tbody tr:hover { background: #f8fafc; }

.id-cell {
  color: #94a3b8;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.name { font-weight: 700; color: #0f172a; }

.tag {
  display: inline-flex;
  max-width: 220px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
}

.tag-block { background: #fef2f2; color: #dc2626; }
.tag-dns { background: #eff6ff; color: #2563eb; }
.tag-route { background: #ecfdf5; color: #059669; }

.value-chip,
.match-chip {
  display: inline-block;
  max-width: 220px;
  padding: 2px 8px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #334155;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.match-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  max-width: 280px;
}

.match-more {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
}

.muted { color: #94a3b8; }

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
  text-decoration: none;
}

.btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn:disabled { opacity: 0.55; cursor: not-allowed; }

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

.btn-sm {
  padding: 5px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  background: #fff;
  color: #334155;
  white-space: nowrap;
}

.btn-sm.edit {
  color: #2563eb;
  border-color: #bfdbfe;
  background: #eff6ff;
}

.btn-sm.danger {
  color: #dc2626;
  border-color: #fecaca;
  background: #fef2f2;
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
  width: 520px;
  max-width: 94vw;
  max-height: 90vh;
  overflow: auto;
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
  animation: modalIn 0.16s ease;
}

.help-modal,
.confirm-modal { width: 460px; }

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

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.form-row label {
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
}

.link-btn {
  border: none;
  background: none;
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}

.link-btn:hover { color: #1d4ed8; text-decoration: underline; }

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

.textarea {
  resize: vertical;
  min-height: 110px;
  line-height: 1.5;
}

.textarea.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
}

select.input {
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, #94a3b8 50%),
    linear-gradient(135deg, #94a3b8 50%, transparent 50%);
  background-position: calc(100% - 16px) calc(50% - 3px), calc(100% - 11px) calc(50% - 3px);
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
  padding-right: 28px;
}

.field-hint {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
}

.field-error {
  margin: 0;
  font-size: 12px;
  color: #dc2626;
  font-weight: 600;
}

.help-intro,
.help-note,
.confirm-text {
  margin: 0;
  font-size: 13px;
  color: #334155;
  line-height: 1.6;
}

.help-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.help-item {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  font-size: 13px;
}

.help-item code {
  padding: 4px 8px;
  border-radius: 6px;
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #1d4ed8;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.help-item span { color: #64748b; }

.help-note { color: #94a3b8; }

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

@media (max-width: 900px) {
  .stat-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 640px) {
  .page-header { flex-direction: column; }
  .header-actions { width: 100%; }
  .header-actions .btn { flex: 1; justify-content: center; }
  .toolbar { flex-direction: column; align-items: stretch; }
  .help-item { grid-template-columns: 1fr; }
}
</style>
