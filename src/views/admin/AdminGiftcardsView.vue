<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">礼品卡管理</h1>
        <p class="page-subtitle">生成余额、时长、流量或套餐礼品卡，用户可在个人中心兑换。</p>
      </div>
      <div class="header-actions">
        <button class="btn" :disabled="loading" @click="load" title="刷新">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :class="{ spinning: loading }"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
          刷新
        </button>
        <button class="btn primary" @click="openAdd">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          生成礼品卡
        </button>
      </div>
    </div>

    <div class="stat-row" v-if="!loading">
      <div class="stat-card">
        <span class="stat-label">礼品卡总数</span>
        <strong class="stat-value">{{ total }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">可用</span>
        <strong class="stat-value accent">{{ statsAvailable }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">已兑完</span>
        <strong class="stat-value warn">{{ statsUsedUp }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">已过期</span>
        <strong class="stat-value muted">{{ statsExpired }}</strong>
      </div>
    </div>

    <div class="toolbar">
      <div class="search-box">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input v-model="query" class="search-input" placeholder="搜索名称 / 卡密 / ID" />
      </div>
      <div class="filters">
        <button
          v-for="ft in filterTabs"
          :key="String(ft.value)"
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
        <p>加载礼品卡…</p>
      </div>
      <div v-else-if="!rows.length" class="state-box empty">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="14" x="3" y="5" rx="2"/><path d="M3 10h18"/><path d="M7 15h2"/><path d="M11 15h4"/></svg>
        </div>
        <h3>暂无礼品卡</h3>
        <p>生成后可将卡密发给用户兑换余额、时长或流量。</p>
        <button class="btn primary" @click="openAdd">生成第一张礼品卡</button>
      </div>
      <div v-else-if="!filtered.length" class="state-box empty compact">
        <h3>没有匹配的礼品卡</h3>
        <p>试试调整搜索词或筛选条件。</p>
        <button class="btn" @click="resetFilters">清除筛选</button>
      </div>
      <template v-else>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th style="width:56px">#</th>
                <th>名称</th>
                <th>卡密</th>
                <th>类型 / 面值</th>
                <th>剩余次数</th>
                <th>已兑换</th>
                <th>有效期</th>
                <th class="col-actions sticky-right">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="g in filtered" :key="g.id">
                <td class="id-cell">{{ g.id }}</td>
                <td>
                  <div class="name-cell">
                    <span class="name">{{ g.name || '—' }}</span>
                    <span class="meta" :class="lifeClass(g)">{{ lifeLabel(g) }}</span>
                  </div>
                </td>
                <td>
                  <button type="button" class="code-btn" :title="g.code" @click="copyCode(g.code || '')">
                    <code>{{ shortCode(g.code) }}</code>
                    <span>复制</span>
                  </button>
                </td>
                <td>
                  <div class="type-cell">
                    <span class="type-tag" :class="'t' + g.type">{{ typeLabel(g.type) }}</span>
                    <span class="value-text">{{ valueText(g) }}</span>
                  </div>
                </td>
                <td>{{ limitText(g.limit_use) }}</td>
                <td>{{ usedCount(g) }} 人</td>
                <td class="time-cell">
                  <div>{{ fmtTime(g.started_at) }}</div>
                  <div class="sub">至 {{ fmtTime(g.ended_at) }}</div>
                </td>
                <td class="actions-td sticky-right" @click.stop>
                  <button
                    type="button"
                    class="menu-trigger"
                    :ref="(el) => setMenuTrigger(g.id!, el)"
                    @click="toggleMenu(g)"
                  >
                    操作
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <span class="page-info">共 {{ total }} 条 · 本页 {{ filtered.length }} 条</span>
          <button class="btn-page" :disabled="currentPage <= 1" @click="goPage(currentPage - 1)">上一页</button>
          <span class="page-num">{{ currentPage }} / {{ totalPages }}</span>
          <button class="btn-page" :disabled="currentPage >= totalPages" @click="goPage(currentPage + 1)">下一页</button>
          <select v-model.number="pageSize" class="input page-size" @change="onPageSizeChange">
            <option :value="10">10 条/页</option>
            <option :value="20">20 条/页</option>
            <option :value="50">50 条/页</option>
          </select>
        </div>
      </template>
    </div>

    <Teleport to="body">
      <div v-if="menuCard" class="gift-action-menu" :style="menuStyle" @click.stop>
        <button type="button" @click="openEdit(menuCard); closeMenu()">编辑</button>
        <button type="button" @click="copyCode(menuCard.code || ''); closeMenu()">复制卡密</button>
        <button type="button" class="danger" @click="askDrop(menuCard); closeMenu()">删除</button>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showForm" class="modal-mask" @click.self="showForm = false">
        <div class="modal modal-wide">
          <div class="modal-header">
            <div>
              <h2>{{ form.id ? '编辑礼品卡' : '生成礼品卡' }}</h2>
              <p class="modal-sub">余额单位为元；时长单位为天；流量单位为 GB。</p>
            </div>
            <button class="modal-close" @click="showForm = false">&times;</button>
          </div>
          <form class="modal-body" @submit.prevent="save">
            <div class="form-grid">
              <label class="field">
                <span>名称 <em>*</em></span>
                <input v-model="form.name" class="input" required maxlength="64" placeholder="如：新用户礼包" />
              </label>
              <label class="field">
                <span>卡密</span>
                <div class="code-row">
                  <input v-model="form.code" class="input" maxlength="64" placeholder="留空则自动生成" />
                  <button type="button" class="btn" @click="form.code = randomCode()">随机</button>
                </div>
              </label>
              <label class="field">
                <span>类型 <em>*</em></span>
                <select v-model.number="form.type" class="input" required @change="onTypeChange">
                  <option v-for="t in TYPE_OPTIONS" :key="t.value" :value="t.value">{{ t.label }}</option>
                </select>
              </label>
              <label class="field" v-if="form.type !== 4">
                <span>{{ valueLabel }} <em>*</em></span>
                <div class="suffix-input">
                  <input
                    v-model.number="form.valueDisplay"
                    class="input"
                    type="number"
                    :min="form.type === 5 ? 0 : 0.01"
                    :step="form.type === 1 ? 0.01 : 1"
                    required
                    :placeholder="valuePlaceholder"
                  />
                  <em>{{ valueSuffix }}</em>
                </div>
              </label>
              <label class="field" v-if="form.type === 5">
                <span>指定套餐 <em>*</em></span>
                <select v-model.number="form.plan_id" class="input" required>
                  <option disabled :value="''">请选择套餐</option>
                  <option v-for="p in plans" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
              </label>
              <label class="field">
                <span>可用次数</span>
                <input v-model.number="form.limit_use" class="input" type="number" min="1" placeholder="不填则不限制" />
              </label>
              <label class="field">
                <span>开始时间 <em>*</em></span>
                <input v-model="form.started_local" class="input" type="datetime-local" required />
              </label>
              <label class="field">
                <span>结束时间 <em>*</em></span>
                <input v-model="form.ended_local" class="input" type="datetime-local" required />
              </label>
            </div>

            <div class="type-hint">
              <strong>{{ typeLabel(form.type) }}：</strong>{{ typeHint(form.type) }}
            </div>

            <p v-if="formErr" class="form-error">{{ formErr }}</p>

            <div class="modal-footer">
              <button type="button" class="btn" @click="showForm = false">取消</button>
              <button type="submit" class="btn primary" :disabled="saving">
                {{ saving ? '提交中…' : '提交' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="dropTarget" class="modal-mask" @click.self="dropTarget = null">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h2>删除礼品卡</h2>
            <button class="modal-close" @click="dropTarget = null">&times;</button>
          </div>
          <div class="modal-body">
            <p class="confirm-text">
              确认删除「{{ dropTarget.name }}」？卡密 <code>{{ dropTarget.code }}</code> 将立即失效。
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

    <Teleport to="body">
      <div v-if="toastMessage" class="toast" :class="{ error: toastError }">{{ toastMessage }}</div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, type ComponentPublicInstance } from 'vue'
import {
  dropAdminGiftcard,
  fetchAdminGiftcards,
  fetchAdminPlans,
  generateAdminGiftcard,
  type AdminGiftcard,
  type AdminPlan,
  type PageResult
} from '../../api/admin'

const TYPE_OPTIONS = [
  { value: 1, label: '余额' },
  { value: 2, label: '延长有效期' },
  { value: 3, label: '增加流量' },
  { value: 4, label: '清空已用流量' },
  { value: 5, label: '指定套餐' }
]

const rows = ref<AdminGiftcard[]>([])
const plans = ref<AdminPlan[]>([])
const total = ref(0)
const statsAvailable = ref(0)
const statsUsedUp = ref(0)
const statsExpired = ref(0)
const loading = ref(true)
const currentPage = ref(1)
const pageSize = ref(10)
const query = ref('')
const filter = ref<'all' | 'available' | 'usedup' | 'expired' | number>('all')

const showForm = ref(false)
const saving = ref(false)
const formErr = ref('')
const form = reactive({
  id: undefined as number | undefined,
  name: '',
  code: '',
  type: 1,
  valueDisplay: 10 as number | '',
  plan_id: '' as number | '',
  limit_use: undefined as number | undefined,
  started_local: '',
  ended_local: ''
})

const menuCard = ref<AdminGiftcard | null>(null)
const menuStyle = ref<Record<string, string>>({})
const menuTriggers = new Map<number, HTMLElement>()

const dropTarget = ref<AdminGiftcard | null>(null)
const dropping = ref(false)

const toastMessage = ref('')
const toastError = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | null = null

const nowSec = () => Math.floor(Date.now() / 1000)

function usedIds(g: AdminGiftcard): number[] {
  const raw = g.used_user_ids
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map(Number).filter((n) => !Number.isNaN(n))
  } catch {
    /* ignore */
  }
  return raw
    .replace(/[\[\]]/g, '')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n))
}

function usedCount(g: AdminGiftcard) {
  return usedIds(g).length
}

function isExpired(g: AdminGiftcard) {
  return !!(g.ended_at && g.ended_at < nowSec())
}
function isNotStarted(g: AdminGiftcard) {
  return !!(g.started_at && g.started_at > nowSec())
}
function isUsedUp(g: AdminGiftcard) {
  return g.limit_use != null && g.limit_use <= 0
}
function isAvailable(g: AdminGiftcard) {
  return !isExpired(g) && !isNotStarted(g) && !isUsedUp(g)
}

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return rows.value.filter((g) => {
    if (filter.value === 'available' && !isAvailable(g)) return false
    if (filter.value === 'usedup' && !isUsedUp(g)) return false
    if (filter.value === 'expired' && !isExpired(g)) return false
    if (typeof filter.value === 'number' && g.type !== filter.value) return false
    if (!q) return true
    return (
      String(g.id || '').includes(q) ||
      (g.name || '').toLowerCase().includes(q) ||
      (g.code || '').toLowerCase().includes(q)
    )
  })
})

const filterTabs = computed(() => [
  { value: 'all' as const, label: '全部', count: total.value },
  { value: 'available' as const, label: '可用', count: statsAvailable.value },
  { value: 'usedup' as const, label: '已兑完', count: statsUsedUp.value },
  { value: 'expired' as const, label: '已过期', count: statsExpired.value },
  ...TYPE_OPTIONS.map((t) => ({
    value: t.value,
    label: t.label,
    count: rows.value.filter((g) => g.type === t.value).length
  }))
])

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

const valueLabel = computed(() => {
  if (form.type === 1) return '余额'
  if (form.type === 2) return '延长天数'
  if (form.type === 3) return '流量'
  if (form.type === 5) return '套餐天数'
  return '面值'
})
const valueSuffix = computed(() => {
  if (form.type === 1) return '元'
  if (form.type === 2 || form.type === 5) return '天'
  if (form.type === 3) return 'GB'
  return ''
})
const valuePlaceholder = computed(() => {
  if (form.type === 1) return '如 10.00'
  if (form.type === 5) return '0 表示不限时'
  return '如 30'
})

function showToast(msg: string, error = false) {
  toastMessage.value = msg
  toastError.value = error
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    if (toastMessage.value === msg) toastMessage.value = ''
  }, 2600)
}

function typeLabel(type?: number) {
  return TYPE_OPTIONS.find((t) => t.value === type)?.label || `类型${type ?? '?'}`
}

function typeHint(type: number) {
  switch (type) {
    case 1: return '兑换后增加用户钱包余额。'
    case 2: return '在用户当前到期时间上延长指定天数（需已有套餐）。'
    case 3: return '增加用户可用流量额度（GB）。'
    case 4: return '将用户已用上行/下行流量清零，不改动总量。'
    case 5: return '仅适用于无套餐或已过期用户；天数为 0 表示不设到期。'
    default: return ''
  }
}

function valueText(g: AdminGiftcard) {
  if (g.type === 4) return '清零已用'
  if (g.type === 1) return `¥${((g.value || 0) / 100).toFixed(2)}`
  if (g.type === 2) return `${g.value ?? 0} 天`
  if (g.type === 3) return `${g.value ?? 0} GB`
  if (g.type === 5) {
    const planName = plans.value.find((p) => p.id === g.plan_id)?.name || (g.plan_id ? `#${g.plan_id}` : '未指定')
    const days = g.value === 0 ? '不限时' : `${g.value} 天`
    return `${planName} · ${days}`
  }
  return String(g.value ?? '—')
}

function limitText(v: number | null | undefined) {
  if (v == null) return '不限'
  if (v <= 0) return '已兑完'
  return `${v} 次`
}

function lifeLabel(g: AdminGiftcard) {
  if (isExpired(g)) return '已过期'
  if (isNotStarted(g)) return '未开始'
  if (isUsedUp(g)) return '已兑完'
  return '可用'
}

function lifeClass(g: AdminGiftcard) {
  if (isExpired(g) || isUsedUp(g)) return 'bad'
  if (isNotStarted(g)) return 'warn'
  return ''
}

function fmtTime(ts: number | null | undefined) {
  if (!ts) return '—'
  const d = new Date(ts * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function toLocalInput(ts: number | null | undefined) {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInput(v: string) {
  if (!v) return 0
  return Math.floor(new Date(v).getTime() / 1000)
}

function shortCode(code?: string | null) {
  if (!code) return '—'
  if (code.length <= 14) return code
  return `${code.slice(0, 6)}…${code.slice(-4)}`
}

function randomCode(len = 16) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

async function copyCode(code: string) {
  if (!code) return
  try {
    await navigator.clipboard.writeText(code)
    showToast('卡密已复制')
  } catch {
    showToast('复制失败', true)
  }
}

async function load() {
  loading.value = true
  try {
    const [res, planList]: [PageResult<AdminGiftcard>, AdminPlan[]] = await Promise.all([
      fetchAdminGiftcards(currentPage.value, pageSize.value),
      plans.value.length ? Promise.resolve(plans.value) : fetchAdminPlans()
    ])
    rows.value = res.data || []
    total.value = res.total || 0
    statsAvailable.value = Number(res.stats?.available) || 0
    statsUsedUp.value = Number(res.stats?.used_up) || 0
    statsExpired.value = Number(res.stats?.expired) || 0
    plans.value = planList
  } catch (e) {
    showToast(e instanceof Error ? e.message : '加载失败', true)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  query.value = ''
  filter.value = 'all'
}

function goPage(p: number) {
  currentPage.value = p
  load()
}

function onPageSizeChange() {
  currentPage.value = 1
  load()
}

function onTypeChange() {
  if (form.type === 4) form.valueDisplay = 0
  else if (form.type === 5) form.valueDisplay = 30
  else if (form.type === 1) form.valueDisplay = 10
  else form.valueDisplay = 30
  if (form.type !== 5) form.plan_id = ''
}

function resetForm() {
  const start = new Date()
  const end = new Date(start.getTime() + 30 * 24 * 3600 * 1000)
  form.id = undefined
  form.name = ''
  form.code = ''
  form.type = 1
  form.valueDisplay = 10
  form.plan_id = ''
  form.limit_use = undefined
  form.started_local = toLocalInput(Math.floor(start.getTime() / 1000))
  form.ended_local = toLocalInput(Math.floor(end.getTime() / 1000))
  formErr.value = ''
}

function openAdd() {
  resetForm()
  showForm.value = true
}

function openEdit(g: AdminGiftcard) {
  form.id = g.id
  form.name = g.name || ''
  form.code = g.code || ''
  form.type = g.type || 1
  if (g.type === 1) form.valueDisplay = Number(((g.value || 0) / 100).toFixed(2))
  else form.valueDisplay = g.value ?? 0
  form.plan_id = g.plan_id ?? ''
  form.limit_use = g.limit_use ?? undefined
  form.started_local = toLocalInput(g.started_at)
  form.ended_local = toLocalInput(g.ended_at)
  formErr.value = ''
  showForm.value = true
}

async function save() {
  formErr.value = ''
  if (!form.name.trim()) {
    formErr.value = '请填写名称'
    return
  }
  if (form.type !== 4 && (form.valueDisplay === '' || Number(form.valueDisplay) < 0)) {
    formErr.value = '请填写有效面值'
    return
  }
  if (form.type === 5 && !form.plan_id) {
    formErr.value = '请选择指定套餐'
    return
  }
  if (form.type !== 4 && form.type !== 5 && Number(form.valueDisplay) <= 0) {
    formErr.value = '面值必须大于 0'
    return
  }
  const started = fromLocalInput(form.started_local)
  const ended = fromLocalInput(form.ended_local)
  if (!started || !ended) {
    formErr.value = '请设置有效期'
    return
  }
  if (ended <= started) {
    formErr.value = '结束时间必须晚于开始时间'
    return
  }

  let value = 0
  if (form.type === 1) value = Math.round(Number(form.valueDisplay) * 100)
  else if (form.type === 4) value = 0
  else value = Math.round(Number(form.valueDisplay))

  const payload: AdminGiftcard = {
    id: form.id,
    name: form.name.trim(),
    code: form.code.trim() || undefined,
    type: form.type,
    value,
    plan_id: form.type === 5 ? Number(form.plan_id) : null,
    limit_use: form.limit_use || null,
    started_at: started,
    ended_at: ended
  }

  saving.value = true
  try {
    await generateAdminGiftcard(payload)
    showForm.value = false
    showToast(form.id ? '礼品卡已保存' : '礼品卡已生成')
    await load()
  } catch (e) {
    formErr.value = e instanceof Error ? e.message : '保存失败'
  } finally {
    saving.value = false
  }
}

function askDrop(g: AdminGiftcard) {
  dropTarget.value = g
}

async function doDrop() {
  if (!dropTarget.value?.id) return
  dropping.value = true
  try {
    await dropAdminGiftcard(dropTarget.value.id)
    dropTarget.value = null
    showToast('已删除')
    if (rows.value.length === 1 && currentPage.value > 1) currentPage.value -= 1
    await load()
  } catch (e) {
    showToast(e instanceof Error ? e.message : '删除失败', true)
  } finally {
    dropping.value = false
  }
}

function setMenuTrigger(id: number, el: Element | ComponentPublicInstance | null) {
  const node = el && '$el' in (el as ComponentPublicInstance)
    ? ((el as ComponentPublicInstance).$el as HTMLElement | null)
    : (el as HTMLElement | null)
  if (node) menuTriggers.set(id, node)
  else menuTriggers.delete(id)
}

function positionMenu(g: AdminGiftcard) {
  const trigger = menuTriggers.get(g.id!)
  if (!trigger) return
  const rect = trigger.getBoundingClientRect()
  const menuH = 132
  const spaceBelow = window.innerHeight - rect.bottom
  const top = spaceBelow < menuH + 8 ? rect.top - menuH - 6 : rect.bottom + 6
  menuStyle.value = {
    position: 'fixed',
    top: `${Math.max(8, top)}px`,
    left: `${Math.max(8, rect.right - 148)}px`,
    zIndex: '4000'
  }
}

function toggleMenu(g: AdminGiftcard) {
  if (menuCard.value?.id === g.id) {
    menuCard.value = null
    return
  }
  menuCard.value = g
  positionMenu(g)
}

function closeMenu() {
  menuCard.value = null
}

function onDocClick(e: MouseEvent) {
  const t = e.target as HTMLElement
  if (t.closest('.menu-trigger') || t.closest('.gift-action-menu')) return
  closeMenu()
}

function onViewportChange() {
  if (menuCard.value) positionMenu(menuCard.value)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  closeMenu()
  dropTarget.value = null
  if (showForm.value) showForm.value = false
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', onViewportChange)
  document.addEventListener('click', onDocClick)
  document.addEventListener('scroll', onViewportChange, true)
  load()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', onViewportChange)
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('scroll', onViewportChange, true)
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

.header-actions { display: flex; gap: 8px; flex-wrap: wrap; }

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

.stat-label { font-size: 12px; font-weight: 700; color: #94a3b8; }
.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.03em;
}
.stat-value.accent { color: #2563eb; }
.stat-value.warn { color: #d97706; }
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
  padding: 0 12px;
  height: 38px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  color: #94a3b8;
  min-width: 240px;
}

.search-input {
  border: 0;
  outline: none;
  flex: 1;
  height: 100%;
  font-size: 13px;
  background: transparent;
  color: #0f172a;
}

.filters { display: flex; gap: 8px; flex-wrap: wrap; }

.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
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
  font-size: 11px;
  font-weight: 800;
  color: #94a3b8;
  background: #f1f5f9;
  border-radius: 999px;
  padding: 1px 7px;
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
  overflow: visible;
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.04));
}

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 48px 20px;
  text-align: center;
  color: #64748b;
}

.state-box.compact { padding: 28px; }
.state-box h3 { margin: 0; font-size: 16px; font-weight: 800; color: #0f172a; }
.state-box p { margin: 0; font-size: 13px; color: #94a3b8; }

.empty-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #eff6ff;
  color: #2563eb;
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

@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 0.8s linear infinite; }

.table-wrap {
  overflow-x: auto;
  border-radius: 16px 16px 0 0;
}

.table {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
}

.table th,
.table td {
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
}

.table th {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  background: #f8fafc;
  position: sticky;
  top: 0;
  z-index: 1;
}

.table tbody tr:hover { background: #f8fafc; }

.id-cell { color: #94a3b8; font-weight: 700; }

.name-cell { display: flex; flex-direction: column; gap: 2px; }
.name { font-weight: 700; color: #0f172a; }
.meta { font-size: 11px; color: #059669; font-weight: 600; }
.meta.bad { color: #dc2626; }
.meta.warn { color: #d97706; }

.code-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 10px;
  padding: 5px 10px;
  cursor: pointer;
  color: #334155;
}

.code-btn code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  font-weight: 700;
}

.code-btn span { font-size: 11px; color: #94a3b8; font-weight: 600; }
.code-btn:hover { border-color: #bfdbfe; background: #eff6ff; }

.type-cell { display: flex; flex-direction: column; gap: 4px; }
.type-tag {
  display: inline-flex;
  width: fit-content;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  background: #f1f5f9;
  color: #475569;
}
.type-tag.t1 { background: #eff6ff; color: #1d4ed8; }
.type-tag.t2 { background: #ecfdf5; color: #047857; }
.type-tag.t3 { background: #fff7ed; color: #c2410c; }
.type-tag.t4 { background: #fef2f2; color: #b91c1c; }
.type-tag.t5 { background: #f5f3ff; color: #6d28d9; }
.value-text { font-size: 12px; color: #475569; font-weight: 600; }

.time-cell { color: #475569; }
.time-cell .sub { margin-top: 2px; font-size: 11px; color: #94a3b8; }

.col-actions,
.actions-td.sticky-right {
  position: sticky;
  right: 0;
  background: #fff;
  z-index: 2;
  box-shadow: -8px 0 12px -10px rgba(15, 23, 42, 0.18);
}

.table thead .col-actions { background: #f8fafc; z-index: 3; }

.menu-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.menu-trigger:hover { border-color: #bfdbfe; color: #1d4ed8; }

.pagination {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
}

.page-info { font-size: 12px; color: #94a3b8; font-weight: 600; margin-right: auto; }
.page-num { font-size: 13px; font-weight: 700; color: #334155; }

.btn-page {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
}

.btn-page:disabled { opacity: 0.45; cursor: not-allowed; }
.page-size { width: 110px; }

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  color: #334155;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.btn:hover { border-color: #cbd5e1; }
.btn:disabled { opacity: 0.55; cursor: not-allowed; }
.btn.primary {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}
.btn.primary:hover { background: #1d4ed8; }
.btn.danger-solid {
  background: #dc2626;
  border-color: #dc2626;
  color: #fff;
}

.input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 13px;
  color: #0f172a;
  background: #fff;
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}
</style>

<style>
.gift-action-menu {
  min-width: 148px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.14);
  padding: 6px;
  display: flex;
  flex-direction: column;
}

.gift-action-menu button {
  border: 0;
  background: transparent;
  text-align: left;
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
}

.gift-action-menu button:hover { background: #f1f5f9; }
.gift-action-menu button.danger { color: #dc2626; }
.gift-action-menu button.danger:hover { background: #fef2f2; }

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: center;
  z-index: 3500;
  padding: 20px;
}

.modal {
  width: min(560px, 100%);
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.22);
  overflow: hidden;
}

.modal.modal-wide { width: min(720px, 100%); }
.modal.modal-sm { width: min(420px, 100%); }

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}

.modal-sub {
  margin: 4px 0 0;
  font-size: 12px;
  color: #94a3b8;
}

.modal-close {
  border: 0;
  background: #f1f5f9;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  color: #64748b;
}

.modal-body { padding: 16px 20px 20px; }

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}

.field em { color: #ef4444; font-style: normal; }

.code-row { display: flex; gap: 8px; }
.code-row .input { flex: 1; }

.suffix-input { position: relative; }
.suffix-input .input { padding-right: 40px; }
.suffix-input em {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-style: normal;
  font-weight: 700;
  font-size: 12px;
  pointer-events: none;
}

.type-hint {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}

.type-hint strong { color: #334155; }

.form-error {
  margin: 12px 0 0;
  color: #dc2626;
  font-size: 13px;
  font-weight: 600;
}

.confirm-text {
  margin: 0 0 16px;
  font-size: 14px;
  color: #334155;
  line-height: 1.6;
}

.confirm-text code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  background: #f1f5f9;
  padding: 1px 6px;
  border-radius: 6px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 28px;
  transform: translateX(-50%);
  background: #0f172a;
  color: #fff;
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  z-index: 5000;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.25);
}

.toast.error { background: #b91c1c; }

@media (max-width: 720px) {
  .stat-row { grid-template-columns: 1fr 1fr; }
  .form-grid { grid-template-columns: 1fr; }
  .page-header { flex-direction: column; }
}
</style>
