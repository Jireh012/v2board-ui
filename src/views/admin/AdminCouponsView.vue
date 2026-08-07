<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">优惠券管理</h1>
        <p class="page-subtitle">创建金额或比例优惠券，限制适用套餐、周期与使用次数。</p>
      </div>
      <div class="header-actions">
        <button class="btn" :disabled="loading" @click="load" title="刷新">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :class="{ spinning: loading }"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
          刷新
        </button>
        <button class="btn primary" @click="openAdd">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          生成优惠券
        </button>
      </div>
    </div>

    <div class="stat-row" v-if="!loading">
      <div class="stat-card">
        <span class="stat-label">优惠券总数</span>
        <strong class="stat-value">{{ total }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">本页启用</span>
        <strong class="stat-value accent">{{ pageShowing }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">本页有效</span>
        <strong class="stat-value ok">{{ pageActive }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">本页已过期</span>
        <strong class="stat-value muted">{{ pageExpired }}</strong>
      </div>
    </div>

    <div class="toolbar">
      <div class="search-box">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input v-model="query" class="search-input" placeholder="搜索名称 / 优惠码 / ID" />
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
        <p>加载优惠券…</p>
      </div>
      <div v-else-if="!rows.length" class="state-box empty">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" x2="7.01" y1="7" y2="7"/></svg>
        </div>
        <h3>暂无优惠券</h3>
        <p>生成后可在用户下单时抵扣金额或按比例优惠。</p>
        <button class="btn primary" @click="openAdd">生成第一张优惠券</button>
      </div>
      <div v-else-if="!filtered.length" class="state-box empty compact">
        <h3>没有匹配的优惠券</h3>
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
                <th>优惠码</th>
                <th>优惠</th>
                <th>使用限制</th>
                <th>适用</th>
                <th>有效期</th>
                <th>启用</th>
                <th class="col-actions sticky-right">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in filtered" :key="c.id">
                <td class="id-cell">{{ c.id }}</td>
                <td>
                  <div class="name-cell">
                    <span class="name">{{ c.name || '—' }}</span>
                    <span class="meta" :class="lifeClass(c)">{{ lifeLabel(c) }}</span>
                  </div>
                </td>
                <td>
                  <button type="button" class="code-btn" :title="c.code" @click="copyCode(c.code || '')">
                    <code>{{ c.code || '—' }}</code>
                    <span>复制</span>
                  </button>
                </td>
                <td>
                  <span class="value-tag" :class="c.type === 2 ? 'pct' : 'amt'">{{ valueText(c) }}</span>
                </td>
                <td class="limit-cell">
                  <div>总量 {{ limitText(c.limit_use) }}</div>
                  <div class="sub">每用户 {{ limitText(c.limit_use_with_user) }}</div>
                </td>
                <td class="scope-cell">
                  <div>{{ planScopeText(c) }}</div>
                  <div class="sub">{{ periodScopeText(c) }}</div>
                </td>
                <td class="time-cell">
                  <div>{{ fmtTime(c.started_at) }}</div>
                  <div class="sub">至 {{ fmtTime(c.ended_at) }}</div>
                </td>
                <td>
                  <button
                    type="button"
                    class="switch"
                    :class="{ on: c.show === 1 }"
                    :disabled="togglingId === c.id"
                    @click="toggleShow(c)"
                    :title="c.show === 1 ? '点击停用' : '点击启用'"
                  >
                    <i />
                  </button>
                </td>
                <td class="actions-td sticky-right" @click.stop>
                  <button
                    type="button"
                    class="menu-trigger"
                    :ref="(el) => setMenuTrigger(c.id!, el)"
                    @click="toggleMenu(c)"
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
      <div v-if="menuCoupon" class="coupon-action-menu" :style="menuStyle" @click.stop>
        <button type="button" @click="openEdit(menuCoupon); closeMenu()">编辑</button>
        <button type="button" @click="copyCode(menuCoupon.code || ''); closeMenu()">复制优惠码</button>
        <button type="button" class="danger" @click="askDrop(menuCoupon); closeMenu()">删除</button>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showForm" class="modal-mask" @click.self="showForm = false">
        <div class="modal modal-wide">
          <div class="modal-header">
            <div>
              <h2>{{ form.id ? '编辑优惠券' : '生成优惠券' }}</h2>
              <p class="modal-sub">金额优惠单位为元；比例优惠为百分比（如 10 表示 10%）。</p>
            </div>
            <button class="modal-close" @click="showForm = false">&times;</button>
          </div>
          <form class="modal-body" @submit.prevent="save">
            <div class="form-grid">
              <label class="field">
                <span>名称 <em>*</em></span>
                <input v-model="form.name" class="input" required maxlength="64" placeholder="如：新春优惠" />
              </label>
              <label class="field">
                <span>优惠码</span>
                <div class="code-row">
                  <input v-model="form.code" class="input" maxlength="32" placeholder="留空则自动生成" />
                  <button type="button" class="btn" @click="form.code = randomCode()">随机</button>
                </div>
              </label>
              <label class="field">
                <span>类型 <em>*</em></span>
                <select v-model.number="form.type" class="input" required>
                  <option :value="1">按金额</option>
                  <option :value="2">按比例</option>
                </select>
              </label>
              <label class="field">
                <span>优惠值 <em>*</em></span>
                <div class="suffix-input">
                  <input
                    v-model.number="form.valueDisplay"
                    class="input"
                    type="number"
                    :min="form.type === 2 ? 1 : 0.01"
                    :max="form.type === 2 ? 100 : 999999"
                    :step="form.type === 2 ? 1 : 0.01"
                    required
                    :placeholder="form.type === 2 ? '如 10' : '如 5.00'"
                  />
                  <em>{{ form.type === 2 ? '%' : '元' }}</em>
                </div>
              </label>
              <label class="field">
                <span>总可用次数</span>
                <input v-model.number="form.limit_use" class="input" type="number" min="1" placeholder="不填则不限制" />
              </label>
              <label class="field">
                <span>每用户可用次数</span>
                <input v-model.number="form.limit_use_with_user" class="input" type="number" min="1" placeholder="不填则不限制" />
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

            <div class="field block">
              <span>指定订阅 <small>不选表示全部套餐可用</small></span>
              <div class="chip-list" v-if="plans.length">
                <label v-for="p in plans" :key="p.id" class="chip">
                  <input type="checkbox" :value="p.id" v-model="form.plan_ids" />
                  <span>{{ p.name }}</span>
                </label>
              </div>
              <p v-else class="field-hint">暂无套餐可选</p>
            </div>

            <div class="field block">
              <span>指定周期 <small>不选表示全部周期可用</small></span>
              <div class="chip-list">
                <label v-for="p in PERIOD_OPTIONS" :key="p.value" class="chip">
                  <input type="checkbox" :value="p.value" v-model="form.periods" />
                  <span>{{ p.label }}</span>
                </label>
              </div>
            </div>

            <label class="check-row">
              <input type="checkbox" v-model="form.showEnabled" />
              <span>启用优惠券</span>
            </label>

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
            <h2>删除优惠券</h2>
            <button class="modal-close" @click="dropTarget = null">&times;</button>
          </div>
          <div class="modal-body">
            <p class="confirm-text">
              确认删除「{{ dropTarget.name }}」？优惠码 <code>{{ dropTarget.code }}</code> 将立即失效。
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
  dropAdminCoupon,
  fetchAdminCoupons,
  fetchAdminPlans,
  generateAdminCoupon,
  showAdminCoupon,
  type AdminCoupon,
  type AdminPlan,
  type PageResult
} from '../../api/admin'

const PERIOD_OPTIONS = [
  { value: 'month_price', label: '月付' },
  { value: 'quarter_price', label: '季付' },
  { value: 'half_year_price', label: '半年付' },
  { value: 'year_price', label: '年付' },
  { value: 'two_year_price', label: '两年付' },
  { value: 'three_year_price', label: '三年付' },
  { value: 'onetime_price', label: '一次性' },
  { value: 'reset_price', label: '流量重置' }
]

const PERIOD_LABELS: Record<string, string> = Object.fromEntries(
  PERIOD_OPTIONS.map((p) => [p.value, p.label])
)

const rows = ref<AdminCoupon[]>([])
const plans = ref<AdminPlan[]>([])
const total = ref(0)
const loading = ref(true)
const currentPage = ref(1)
const pageSize = ref(10)
const query = ref('')
const filter = ref<'all' | 'show' | 'hide' | 'active' | 'expired'>('all')

const showForm = ref(false)
const saving = ref(false)
const formErr = ref('')
const form = reactive({
  id: undefined as number | undefined,
  name: '',
  code: '',
  type: 1,
  valueDisplay: 5 as number | '',
  limit_use: undefined as number | undefined,
  limit_use_with_user: undefined as number | undefined,
  started_local: '',
  ended_local: '',
  plan_ids: [] as number[],
  periods: [] as string[],
  showEnabled: true
})

const menuCoupon = ref<AdminCoupon | null>(null)
const menuStyle = ref<Record<string, string>>({})
const menuTriggers = new Map<number, HTMLElement>()

const dropTarget = ref<AdminCoupon | null>(null)
const dropping = ref(false)
const togglingId = ref<number | null>(null)

const toastMessage = ref('')
const toastError = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | null = null

const nowSec = () => Math.floor(Date.now() / 1000)

function parseIdArray(raw: string | number[] | null | undefined): number[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map(Number).filter((n) => !Number.isNaN(n))
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map(Number).filter((n) => !Number.isNaN(n))
  } catch {
    /* ignore */
  }
  return []
}

function parseStrArray(raw: string | string[] | null | undefined): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map(String)
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map(String)
  } catch {
    /* ignore */
  }
  return []
}

function isExpired(c: AdminCoupon) {
  return !!(c.ended_at && c.ended_at < nowSec())
}
function isNotStarted(c: AdminCoupon) {
  return !!(c.started_at && c.started_at > nowSec())
}
function isActive(c: AdminCoupon) {
  return c.show === 1 && !isExpired(c) && !isNotStarted(c)
}

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return rows.value.filter((c) => {
    if (filter.value === 'show' && c.show !== 1) return false
    if (filter.value === 'hide' && c.show === 1) return false
    if (filter.value === 'active' && !isActive(c)) return false
    if (filter.value === 'expired' && !isExpired(c)) return false
    if (!q) return true
    return (
      String(c.id || '').includes(q) ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.code || '').toLowerCase().includes(q)
    )
  })
})

const filterTabs = computed(() => [
  { value: 'all' as const, label: '全部', count: rows.value.length },
  { value: 'show' as const, label: '已启用', count: rows.value.filter((c) => c.show === 1).length },
  { value: 'active' as const, label: '有效期内', count: rows.value.filter((c) => isActive(c)).length },
  { value: 'expired' as const, label: '已过期', count: rows.value.filter((c) => isExpired(c)).length },
  { value: 'hide' as const, label: '已停用', count: rows.value.filter((c) => c.show !== 1).length }
])

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const pageShowing = computed(() => rows.value.filter((c) => c.show === 1).length)
const pageActive = computed(() => rows.value.filter((c) => isActive(c)).length)
const pageExpired = computed(() => rows.value.filter((c) => isExpired(c)).length)

function showToast(msg: string, error = false) {
  toastMessage.value = msg
  toastError.value = error
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    if (toastMessage.value === msg) toastMessage.value = ''
  }, 2600)
}

function valueText(c: AdminCoupon) {
  if (c.type === 2) return `${c.value ?? 0}%`
  return `¥${((c.value || 0) / 100).toFixed(2)}`
}

function limitText(v: number | null | undefined) {
  return v == null || v === 0 ? '不限' : `${v} 次`
}

function planScopeText(c: AdminCoupon) {
  const ids = parseIdArray(c.limit_plan_ids as string | number[] | null | undefined)
  if (!ids.length) return '全部套餐'
  const names = ids.map((id) => plans.value.find((p) => p.id === id)?.name || `#${id}`)
  return names.length <= 2 ? names.join('、') : `${names.slice(0, 2).join('、')} 等${names.length}个`
}

function periodScopeText(c: AdminCoupon) {
  const periods = parseStrArray(c.limit_period as string | string[] | null | undefined)
  if (!periods.length) return '全部周期'
  const labels = periods.map((p) => PERIOD_LABELS[p] || p)
  return labels.length <= 2 ? labels.join('、') : `${labels.slice(0, 2).join('、')} 等`
}

function lifeLabel(c: AdminCoupon) {
  if (isExpired(c)) return '已过期'
  if (isNotStarted(c)) return '未开始'
  if (c.show !== 1) return '已停用'
  return '有效'
}

function lifeClass(c: AdminCoupon) {
  if (isExpired(c)) return 'bad'
  if (isNotStarted(c)) return 'warn'
  if (c.show !== 1) return 'idle'
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

function randomCode(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

async function copyCode(code: string) {
  if (!code) return
  try {
    await navigator.clipboard.writeText(code)
    showToast('优惠码已复制')
  } catch {
    showToast('复制失败', true)
  }
}

async function load() {
  loading.value = true
  try {
    const [res, planList]: [PageResult<AdminCoupon>, AdminPlan[]] = await Promise.all([
      fetchAdminCoupons(currentPage.value, pageSize.value),
      plans.value.length ? Promise.resolve(plans.value) : fetchAdminPlans()
    ])
    rows.value = res.data || []
    total.value = res.total || 0
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

function resetForm() {
  const start = new Date()
  const end = new Date(start.getTime() + 30 * 24 * 3600 * 1000)
  form.id = undefined
  form.name = ''
  form.code = ''
  form.type = 1
  form.valueDisplay = 5
  form.limit_use = undefined
  form.limit_use_with_user = undefined
  form.started_local = toLocalInput(Math.floor(start.getTime() / 1000))
  form.ended_local = toLocalInput(Math.floor(end.getTime() / 1000))
  form.plan_ids = []
  form.periods = []
  form.showEnabled = true
  formErr.value = ''
}

function openAdd() {
  resetForm()
  showForm.value = true
}

function openEdit(c: AdminCoupon) {
  form.id = c.id
  form.name = c.name || ''
  form.code = c.code || ''
  form.type = c.type === 2 ? 2 : 1
  form.valueDisplay =
    c.type === 2 ? (c.value ?? 10) : Number(((c.value || 0) / 100).toFixed(2))
  form.limit_use = c.limit_use ?? undefined
  form.limit_use_with_user = c.limit_use_with_user ?? undefined
  form.started_local = toLocalInput(c.started_at)
  form.ended_local = toLocalInput(c.ended_at)
  form.plan_ids = parseIdArray(c.limit_plan_ids as string | number[] | null | undefined)
  form.periods = parseStrArray(c.limit_period as string | string[] | null | undefined)
  form.showEnabled = c.show === 1
  formErr.value = ''
  showForm.value = true
}

async function save() {
  formErr.value = ''
  if (!form.name.trim()) {
    formErr.value = '请填写名称'
    return
  }
  if (form.valueDisplay === '' || Number(form.valueDisplay) <= 0) {
    formErr.value = '请填写有效的优惠值'
    return
  }
  if (form.type === 2 && Number(form.valueDisplay) > 100) {
    formErr.value = '比例优惠不能超过 100%'
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

  const payload: AdminCoupon = {
    id: form.id,
    name: form.name.trim(),
    code: form.code.trim() || undefined,
    type: form.type,
    value: form.type === 2 ? Math.round(Number(form.valueDisplay)) : Math.round(Number(form.valueDisplay) * 100),
    show: form.showEnabled ? 1 : 0,
    limit_use: form.limit_use || null,
    limit_use_with_user: form.limit_use_with_user || null,
    limit_plan_ids: form.plan_ids.length ? JSON.stringify(form.plan_ids) : null,
    limit_period: form.periods.length ? JSON.stringify(form.periods) : null,
    started_at: started,
    ended_at: ended
  }

  saving.value = true
  try {
    await generateAdminCoupon(payload)
    showForm.value = false
    showToast(form.id ? '优惠券已保存' : '优惠券已生成')
    await load()
  } catch (e) {
    formErr.value = e instanceof Error ? e.message : '保存失败'
  } finally {
    saving.value = false
  }
}

async function toggleShow(c: AdminCoupon) {
  if (!c.id) return
  togglingId.value = c.id
  try {
    await showAdminCoupon(c.id)
    c.show = c.show === 1 ? 0 : 1
    showToast(c.show === 1 ? '已启用' : '已停用')
  } catch (e) {
    showToast(e instanceof Error ? e.message : '操作失败', true)
  } finally {
    togglingId.value = null
  }
}

function askDrop(c: AdminCoupon) {
  dropTarget.value = c
}

async function doDrop() {
  if (!dropTarget.value?.id) return
  dropping.value = true
  try {
    await dropAdminCoupon(dropTarget.value.id)
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

function positionMenu(c: AdminCoupon) {
  const trigger = menuTriggers.get(c.id!)
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

function toggleMenu(c: AdminCoupon) {
  if (menuCoupon.value?.id === c.id) {
    menuCoupon.value = null
    return
  }
  menuCoupon.value = c
  positionMenu(c)
}

function closeMenu() {
  menuCoupon.value = null
}

function onDocClick(e: MouseEvent) {
  const t = e.target as HTMLElement
  if (t.closest('.menu-trigger') || t.closest('.coupon-action-menu')) return
  closeMenu()
}

function onViewportChange() {
  if (menuCoupon.value) positionMenu(menuCoupon.value)
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
.stat-value.ok { color: #059669; }
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
.meta.idle { color: #94a3b8; }

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

.value-tag {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.value-tag.amt { background: #eff6ff; color: #1d4ed8; }
.value-tag.pct { background: #ecfdf5; color: #047857; }

.limit-cell .sub,
.scope-cell .sub,
.time-cell .sub {
  margin-top: 2px;
  font-size: 11px;
  color: #94a3b8;
}

.scope-cell,
.limit-cell,
.time-cell { color: #475569; }

.switch {
  width: 42px;
  height: 24px;
  border-radius: 999px;
  border: 0;
  background: #cbd5e1;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
  padding: 0;
}

.switch.on { background: #2563eb; }
.switch i {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.2);
}
.switch.on i { transform: translateX(18px); }
.switch:disabled { opacity: 0.6; cursor: wait; }

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
.coupon-action-menu {
  min-width: 148px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.14);
  padding: 6px;
  display: flex;
  flex-direction: column;
}

.coupon-action-menu button {
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

.coupon-action-menu button:hover { background: #f1f5f9; }
.coupon-action-menu button.danger { color: #dc2626; }
.coupon-action-menu button.danger:hover { background: #fef2f2; }

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

.modal.modal-wide { width: min(760px, 100%); }
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
.field.block { margin-top: 14px; }
.field small {
  margin-left: 6px;
  font-weight: 500;
  color: #94a3b8;
}

.field-hint { margin: 0; font-size: 12px; color: #94a3b8; font-weight: 500; }

.code-row { display: flex; gap: 8px; }
.code-row .input { flex: 1; }

.suffix-input {
  position: relative;
}

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

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #f8fafc;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
}

.chip:has(input:checked) {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.chip input { margin: 0; }

.check-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
}

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
