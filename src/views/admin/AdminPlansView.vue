<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">订阅管理</h1>
        <p class="page-subtitle">管理订阅套餐的销售状态、售价、流量与权限组；拖拽左侧手柄可调整排序。</p>
      </div>
      <div class="header-actions">
        <button class="btn" :disabled="loading" @click="load" title="刷新列表">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :class="{ spinning: loading }"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
          刷新
        </button>
        <button class="btn primary" @click="openAdd">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          添加订阅
        </button>
      </div>
    </div>

    <div class="stat-row" v-if="!loading && plans.length">
      <div class="stat-card">
        <span class="stat-label">订阅数</span>
        <strong class="stat-value">{{ plans.length }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">销售中</span>
        <strong class="stat-value accent">{{ visibleCount }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">订阅用户</span>
        <strong class="stat-value">{{ totalUsers }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">已停售</span>
        <strong class="stat-value muted">{{ plans.length - visibleCount }}</strong>
      </div>
    </div>

    <div class="toolbar" v-if="!loading && plans.length">
      <div class="search-box">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input v-model="query" class="search-input" placeholder="搜索名称 / ID / 权限组" />
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
        <p>加载订阅…</p>
      </div>
      <div v-else-if="!plans.length" class="state-box empty">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/></svg>
        </div>
        <h3>暂无订阅</h3>
        <p>添加订阅并设置售价与流量后，用户即可在前台购买。</p>
        <button class="btn primary" @click="openAdd">添加第一个订阅</button>
      </div>
      <div v-else-if="!filtered.length" class="state-box empty compact">
        <h3>没有匹配的订阅</h3>
        <p>试试调整搜索词或筛选条件。</p>
        <button class="btn" @click="resetFilters">清除筛选</button>
      </div>
      <div v-else class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th class="col-drag"></th>
              <th>销售状态</th>
              <th>
                <span class="th-with-tip">
                  续费
                  <span class="tip" title="关闭后，已购用户将无法续费该订阅">ⓘ</span>
                </span>
              </th>
              <th>名称</th>
              <th>排序</th>
              <th>流量</th>
              <th>设备数限制</th>
              <th>月付</th>
              <th>季付</th>
              <th>半年付</th>
              <th>年付</th>
              <th>两年付</th>
              <th>三年付</th>
              <th>一次性</th>
              <th>重置包</th>
              <th>权限组</th>
              <th>用户</th>
              <th class="col-actions sticky-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(p, index) in filtered"
              :key="p.id"
              :class="{ dragging: dragId === p.id, 'drag-over': dragOverId === p.id }"
              draggable="true"
              @dragstart="onDragStart(p, $event)"
              @dragover.prevent="onDragOver(p)"
              @dragleave="onDragLeave(p)"
              @drop.prevent="onDropRow(p)"
              @dragend="onDragEnd"
            >
              <td class="col-drag">
                <span class="drag-handle" title="拖拽排序">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
                </span>
              </td>
              <td>
                <button
                  type="button"
                  class="switch"
                  :class="{ on: p.show === 1 }"
                  :disabled="togglingId === p.id"
                  title="销售状态"
                  @click="toggleFlag(p, 'show')"
                >
                  <i class="knob"></i>
                </button>
              </td>
              <td>
                <button
                  type="button"
                  class="switch"
                  :class="{ on: p.renew === 1 }"
                  :disabled="togglingId === p.id"
                  title="允许续费"
                  @click="toggleFlag(p, 'renew')"
                >
                  <i class="knob"></i>
                </button>
              </td>
              <td>
                <div class="name-cell">
                  <span class="name">{{ p.name }}</span>
                  <span v-if="p.content" class="meta" :title="stripHtml(p.content)">{{ stripHtml(p.content) }}</span>
                </div>
              </td>
              <td class="num-cell">{{ p.sort ?? index + 1 }}</td>
              <td class="num-cell strong">{{ formatTraffic(p.transfer_enable) }}</td>
              <td class="num-cell">{{ p.device_limit ?? '—' }}</td>
              <td class="price-col">{{ formatPrice(p.month_price) }}</td>
              <td class="price-col">{{ formatPrice(p.quarter_price) }}</td>
              <td class="price-col">{{ formatPrice(p.half_year_price) }}</td>
              <td class="price-col">{{ formatPrice(p.year_price) }}</td>
              <td class="price-col">{{ formatPrice(p.two_year_price) }}</td>
              <td class="price-col">{{ formatPrice(p.three_year_price) }}</td>
              <td class="price-col">{{ formatPrice(p.onetime_price) }}</td>
              <td class="price-col">{{ formatPrice(p.reset_price, true) }}</td>
              <td>
                <span class="group-tag">{{ groupName(p.group_id) }}</span>
              </td>
              <td>
                <span class="metric" :class="{ zero: !(p.count) }">{{ p.count ?? 0 }}</span>
              </td>
              <td class="actions-td sticky-right" @click.stop>
                <button
                  type="button"
                  class="menu-trigger"
                  :ref="(el) => setMenuTrigger(p.id!, el)"
                  @click="toggleMenu(p)"
                >
                  操作
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="sorting" class="sort-hint">正在保存排序…</p>
      </div>
    </div>

    <!-- 操作菜单挂到 body，避免被表格 overflow 裁切 -->
    <Teleport to="body">
      <div
        v-if="menuPlan"
        class="plan-action-menu"
        :style="menuStyle"
        @click.stop
      >
        <button type="button" @click="openEdit(menuPlan); closeMenu()">编辑</button>
        <button
          type="button"
          class="danger"
          :disabled="(menuPlan.count ?? 0) > 0"
          :title="(menuPlan.count ?? 0) > 0 ? '该订阅下仍有用户或订单，无法删除' : ''"
          @click="askDrop(menuPlan); closeMenu()"
        >
          删除
        </button>
      </div>
    </Teleport>

    <!-- 新建 / 编辑：布局对齐原版「编辑订阅」 -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-mask" @click.self="closeModal">
        <div class="modal edit-modal" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h2>{{ form.id ? '编辑订阅' : '添加订阅' }}</h2>
            <button type="button" class="modal-close" @click="closeModal">&times;</button>
          </div>
          <form class="edit-form" @submit.prevent="doSave">
            <div class="form-row">
              <label>套餐名称</label>
              <input v-model="form.name" class="input" placeholder="请输入套餐名称" required maxlength="64" />
            </div>

            <div class="form-row">
              <label>套餐描述</label>
              <textarea
                v-model="form.content"
                class="input textarea"
                rows="4"
                placeholder="请输入套餐描述，支持HTML"
              />
            </div>

            <div class="section-divider">
              <span>售价设置</span>
              <span class="tip" title="金额单位为元；留空则不出售该周期">ⓘ</span>
            </div>

            <div class="price-cycle-grid">
              <div class="form-row" v-for="f in cyclePriceFields" :key="f.key">
                <label>{{ f.label }}</label>
                <input
                  v-model.number="form[f.key]"
                  class="input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder=""
                />
              </div>
            </div>

            <div class="price-extra-grid">
              <div class="form-row">
                <label>一次性</label>
                <div class="affix-input">
                  <input v-model.number="form.onetime_price" class="input" type="number" min="0" step="0.01" />
                  <em>¥</em>
                </div>
              </div>
              <div class="form-row">
                <label>重置包</label>
                <div class="affix-input">
                  <input v-model.number="form.reset_price" class="input" type="number" min="0" step="0.01" />
                  <em>¥</em>
                </div>
              </div>
            </div>

            <div class="form-row">
              <label>套餐流量</label>
              <div class="affix-input">
                <input v-model.number="form.transfer_enable" class="input" type="number" min="0" step="1" required />
                <em>GB</em>
              </div>
            </div>

            <div class="form-row">
              <label>设备数限制</label>
              <input
                v-model.number="form.device_limit"
                class="input"
                type="number"
                min="0"
                step="1"
                placeholder="留空则不限制"
              />
            </div>

            <div class="form-row">
              <div class="label-row">
                <label>权限组</label>
                <RouterLink class="link-btn" :to="adminUrl('/servers/groups')" target="_blank">添加权限组</RouterLink>
              </div>
              <select v-model.number="form.group_id" class="input" required>
                <option :value="0" disabled>请选择权限组</option>
                <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
              </select>
            </div>

            <div class="form-row">
              <label>流量重置方式</label>
              <select v-model.number="form.reset_traffic_method" class="input">
                <option v-for="m in resetMethods" :key="m.value" :value="m.value">{{ m.label }}</option>
              </select>
            </div>

            <div class="form-row">
              <label>最大容纳用户量</label>
              <input
                v-model.number="form.capacity_limit"
                class="input"
                type="number"
                min="0"
                step="1"
                placeholder="留空则不限制"
              />
            </div>

            <div class="form-row">
              <label>限速</label>
              <div class="affix-input">
                <input
                  v-model.number="form.speed_limit"
                  class="input"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="留空则不限制"
                />
                <em>Mbps</em>
              </div>
            </div>

            <p v-if="formError" class="field-error">{{ formError }}</p>

            <div class="edit-footer">
              <label v-if="form.id" class="force-check">
                <input v-model="form.force_update" type="checkbox" />
                <span>强制更新到用户</span>
              </label>
              <span v-else class="force-check-placeholder"></span>
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

    <!-- 删除确认 -->
    <Teleport to="body">
      <div v-if="dropTarget" class="modal-mask" @click.self="dropTarget = null">
        <div class="modal confirm-modal" role="dialog" aria-modal="true">
          <div class="modal-header">
            <div>
              <h2>删除订阅</h2>
              <p class="modal-sub">此操作不可恢复</p>
            </div>
            <button type="button" class="modal-close" @click="dropTarget = null">&times;</button>
          </div>
          <div class="modal-body">
            <p class="confirm-text">
              确定删除订阅「<strong>{{ dropTarget.name }}</strong>」吗？
            </p>
            <p v-if="(dropTarget.count ?? 0) > 0" class="confirm-warn">
              该订阅下仍有 {{ dropTarget.count }} 个用户，无法删除。
            </p>
            <div class="modal-footer">
              <button type="button" class="btn" @click="dropTarget = null">取消</button>
              <button
                type="button"
                class="btn danger-solid"
                :disabled="dropping || (dropTarget.count ?? 0) > 0"
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
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  fetchAdminPlans,
  saveAdminPlan,
  dropAdminPlan,
  sortAdminPlans,
  updateAdminPlanFlags,
  type AdminPlan
} from '../../api/admin'
import { fetchGroups, type ServerGroup } from '../../api/admin/group'
import { adminUrl } from '../../siteBrand'

type FilterKey = 'all' | 'show' | 'hide' | 'renew'

type PriceKey =
  | 'month_price'
  | 'quarter_price'
  | 'half_year_price'
  | 'year_price'
  | 'two_year_price'
  | 'three_year_price'
  | 'onetime_price'
  | 'reset_price'

interface PlanForm {
  id?: number
  name: string
  group_id: number
  transfer_enable: number
  device_limit: number | null
  speed_limit: number | null
  capacity_limit: number | null
  sort: number | null
  content: string
  month_price: number | null
  quarter_price: number | null
  half_year_price: number | null
  year_price: number | null
  two_year_price: number | null
  three_year_price: number | null
  onetime_price: number | null
  reset_price: number | null
  reset_traffic_method: number
  show: boolean
  renew: boolean
  force_update: boolean
}

const cyclePriceFields: { key: PriceKey; label: string }[] = [
  { key: 'month_price', label: '月付' },
  { key: 'quarter_price', label: '季付' },
  { key: 'half_year_price', label: '半年' },
  { key: 'year_price', label: '年付' },
  { key: 'two_year_price', label: '两年付' },
  { key: 'three_year_price', label: '三年付' }
]

const resetMethods = [
  { value: 0, label: '跟随系统设置' },
  { value: 1, label: '每月1号' },
  { value: 2, label: '按月重置' },
  { value: 3, label: '不重置' },
  { value: 4, label: '每年1月1日' }
]

const plans = ref<AdminPlan[]>([])
const groups = ref<ServerGroup[]>([])
const loading = ref(true)
const saving = ref(false)
const sorting = ref(false)
const dropping = ref(false)
const showModal = ref(false)
const formError = ref('')
const query = ref('')
const filter = ref<FilterKey>('all')
const dropTarget = ref<AdminPlan | null>(null)
const togglingId = ref<number | null>(null)
const menuPlan = ref<AdminPlan | null>(null)
const menuStyle = ref<Record<string, string>>({})
const menuTriggers = new Map<number, HTMLElement>()
const form = ref<PlanForm>(emptyForm())

const dragId = ref<number | null>(null)
const dragOverId = ref<number | null>(null)

const toastMessage = ref('')
const toastError = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | null = null

function emptyForm(): PlanForm {
  return {
    name: '',
    group_id: 0,
    transfer_enable: 100,
    device_limit: null,
    speed_limit: null,
    capacity_limit: null,
    sort: null,
    content: '',
    month_price: null,
    quarter_price: null,
    half_year_price: null,
    year_price: null,
    two_year_price: null,
    three_year_price: null,
    onetime_price: null,
    reset_price: null,
    reset_traffic_method: 0,
    show: true,
    renew: true,
    force_update: false
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

const visibleCount = computed(() => plans.value.filter((p) => p.show === 1).length)
const totalUsers = computed(() => plans.value.reduce((n, p) => n + (p.count ?? 0), 0))

const filterTabs = computed(() => [
  { value: 'all' as const, label: '全部', count: plans.value.length },
  { value: 'show' as const, label: '销售中', count: visibleCount.value },
  { value: 'hide' as const, label: '已停售', count: plans.value.length - visibleCount.value },
  { value: 'renew' as const, label: '可续费', count: plans.value.filter((p) => p.renew === 1).length }
])

const groupMap = computed(() => {
  const m = new Map<number, string>()
  for (const g of groups.value) m.set(g.id, g.name)
  return m
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return plans.value.filter((p) => {
    if (filter.value === 'show' && p.show !== 1) return false
    if (filter.value === 'hide' && p.show === 1) return false
    if (filter.value === 'renew' && p.renew !== 1) return false
    if (!q) return true
    const gname = groupName(p.group_id).toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      String(p.id).includes(q) ||
      gname.includes(q) ||
      stripHtml(p.content || '').toLowerCase().includes(q)
    )
  })
})

function groupName(id?: number | null) {
  if (id == null) return '—'
  return groupMap.value.get(id) || `组 #${id}`
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

/** 套餐 transfer_enable 存的是 GB */
function formatTraffic(gb?: number | null) {
  if (gb == null || Number.isNaN(Number(gb))) return '—'
  return `${Number(gb)} GB`
}

/** 金额为分；null 显示 -；0 显示 0.00（对齐原版重置包） */
function formatPrice(fen?: number | null, showZero = false) {
  if (fen == null) return '—'
  if (fen === 0) return showZero ? '0.00' : '—'
  return (fen / 100).toFixed(2)
}

function yuanToFen(yuan: number | null | undefined): number | null {
  if (yuan == null || yuan === ('' as any) || Number.isNaN(Number(yuan))) return null
  const n = Number(yuan)
  if (n < 0) return null
  if (n === 0) return 0
  return Math.round(n * 100)
}

function resetFilters() {
  query.value = ''
  filter.value = 'all'
}

function setMenuTrigger(id: number, el: unknown) {
  if (el instanceof HTMLElement) menuTriggers.set(id, el)
  else menuTriggers.delete(id)
}

function closeMenu() {
  menuPlan.value = null
}

function positionMenu(plan: AdminPlan) {
  if (!plan.id) return
  const trigger = menuTriggers.get(plan.id)
  if (!trigger) return
  const rect = trigger.getBoundingClientRect()
  const menuWidth = 120
  const menuHeight = 88
  const pad = 8
  let left = rect.right - menuWidth
  let top = rect.bottom + 4
  if (left < pad) left = pad
  if (left + menuWidth > window.innerWidth - pad) {
    left = window.innerWidth - menuWidth - pad
  }
  if (top + menuHeight > window.innerHeight - pad) {
    top = Math.max(pad, rect.top - menuHeight - 4)
  }
  menuStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    zIndex: '4000'
  }
}

function toggleMenu(plan: AdminPlan) {
  if (menuPlan.value?.id === plan.id) {
    closeMenu()
    return
  }
  menuPlan.value = plan
  requestAnimationFrame(() => positionMenu(plan))
}

async function loadGroups() {
  try {
    groups.value = await fetchGroups()
  } catch {
    groups.value = []
  }
}

async function load() {
  loading.value = true
  try {
    const list = await fetchAdminPlans()
    plans.value = list.slice().sort((a, b) => (a.sort ?? 9999) - (b.sort ?? 9999) || (a.id ?? 0) - (b.id ?? 0))
  } catch (e: any) {
    showToast(e?.message || '加载失败', true)
  } finally {
    loading.value = false
  }
}

function openAdd() {
  form.value = emptyForm()
  if (groups.value.length) form.value.group_id = groups.value[0].id
  formError.value = ''
  showModal.value = true
}

function openEdit(p: AdminPlan) {
  form.value = {
    id: p.id,
    name: p.name,
    group_id: p.group_id ?? 0,
    transfer_enable: p.transfer_enable ?? 0,
    device_limit: p.device_limit ?? null,
    speed_limit: p.speed_limit ?? null,
    capacity_limit: p.capacity_limit ?? null,
    sort: p.sort ?? null,
    content: p.content || '',
    month_price: p.month_price != null ? p.month_price / 100 : null,
    quarter_price: p.quarter_price != null ? p.quarter_price / 100 : null,
    half_year_price: p.half_year_price != null ? p.half_year_price / 100 : null,
    year_price: p.year_price != null ? p.year_price / 100 : null,
    two_year_price: p.two_year_price != null ? p.two_year_price / 100 : null,
    three_year_price: p.three_year_price != null ? p.three_year_price / 100 : null,
    onetime_price: p.onetime_price != null ? p.onetime_price / 100 : null,
    reset_price: p.reset_price != null ? p.reset_price / 100 : null,
    reset_traffic_method: p.reset_traffic_method ?? 0,
    show: p.show === 1,
    renew: p.renew === 1,
    force_update: false
  }
  formError.value = ''
  showModal.value = true
}

function closeModal() {
  if (saving.value) return
  showModal.value = false
}

function optionalInt(v: number | null | undefined): number | null {
  if (v == null || v === ('' as any) || Number.isNaN(Number(v))) return null
  const n = Number(v)
  return n > 0 ? Math.round(n) : null
}

function validate(): boolean {
  if (!form.value.name.trim()) {
    formError.value = '订阅名称不能为空'
    return false
  }
  if (!form.value.group_id) {
    formError.value = '请选择权限组'
    return false
  }
  if (form.value.transfer_enable == null || form.value.transfer_enable < 0) {
    formError.value = '流量不能为空'
    return false
  }
  formError.value = ''
  return true
}

async function doSave() {
  if (!validate()) return
  saving.value = true
  try {
    const payload: AdminPlan = {
      id: form.value.id,
      name: form.value.name.trim(),
      group_id: form.value.group_id,
      transfer_enable: Math.round(Number(form.value.transfer_enable)),
      device_limit: optionalInt(form.value.device_limit),
      speed_limit: optionalInt(form.value.speed_limit),
      capacity_limit: optionalInt(form.value.capacity_limit),
      sort: form.value.sort == null || Number.isNaN(Number(form.value.sort)) ? null : Math.round(Number(form.value.sort)),
      content: form.value.content.trim() || null,
      month_price: yuanToFen(form.value.month_price),
      quarter_price: yuanToFen(form.value.quarter_price),
      half_year_price: yuanToFen(form.value.half_year_price),
      year_price: yuanToFen(form.value.year_price),
      two_year_price: yuanToFen(form.value.two_year_price),
      three_year_price: yuanToFen(form.value.three_year_price),
      onetime_price: yuanToFen(form.value.onetime_price),
      reset_price: yuanToFen(form.value.reset_price),
      reset_traffic_method: form.value.reset_traffic_method,
      show: form.value.show ? 1 : 0,
      renew: form.value.renew ? 1 : 0
    }
    await saveAdminPlan(payload, form.value.force_update)
    showModal.value = false
    showToast(form.value.id ? '订阅已更新' : '订阅已创建')
    await load()
  } catch (e: any) {
    formError.value = e?.message || '保存失败'
    showToast(e?.message || '保存失败', true)
  } finally {
    saving.value = false
  }
}

function askDrop(p: AdminPlan) {
  if ((p.count ?? 0) > 0) {
    showToast('该订阅下仍有用户，无法删除', true)
    return
  }
  dropTarget.value = p
}

async function doDrop() {
  const p = dropTarget.value
  if (!p?.id) return
  dropping.value = true
  try {
    await dropAdminPlan(p.id)
    dropTarget.value = null
    showToast(`已删除「${p.name}」`)
    await load()
  } catch (e: any) {
    showToast(e?.message || '删除失败', true)
  } finally {
    dropping.value = false
  }
}

async function toggleFlag(p: AdminPlan, key: 'show' | 'renew') {
  if (!p.id) return
  togglingId.value = p.id
  try {
    const next = p[key] === 1 ? 0 : 1
    await updateAdminPlanFlags(p.id, { [key]: next })
    p[key] = next
    showToast(
      key === 'show'
        ? next
          ? '已开启销售'
          : '已关闭销售'
        : next
          ? '已允许续费'
          : '已禁止续费'
    )
  } catch (e: any) {
    showToast(e?.message || '更新失败', true)
  } finally {
    togglingId.value = null
  }
}

function onDragStart(p: AdminPlan, e: DragEvent) {
  if (filter.value !== 'all' || query.value.trim()) {
    e.preventDefault()
    showToast('请先清除筛选后再拖拽排序', true)
    return
  }
  dragId.value = p.id ?? null
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(p.id))
  }
}

function onDragOver(p: AdminPlan) {
  if (dragId.value == null || dragId.value === p.id) return
  dragOverId.value = p.id ?? null
}

function onDragLeave(p: AdminPlan) {
  if (dragOverId.value === p.id) dragOverId.value = null
}

async function onDropRow(target: AdminPlan) {
  const fromId = dragId.value
  dragOverId.value = null
  if (fromId == null || fromId === target.id) return
  const fromIdx = plans.value.findIndex((x) => x.id === fromId)
  const toIdx = plans.value.findIndex((x) => x.id === target.id)
  if (fromIdx < 0 || toIdx < 0) return
  const arr = plans.value.slice()
  const [item] = arr.splice(fromIdx, 1)
  arr.splice(toIdx, 0, item)
  arr.forEach((p, i) => {
    p.sort = i + 1
  })
  plans.value = arr
  sorting.value = true
  try {
    await sortAdminPlans(arr.map((p) => p.id!).filter(Boolean))
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

function onDocClick(e: MouseEvent) {
  const t = e.target as HTMLElement
  if (t.closest('.menu-trigger') || t.closest('.plan-action-menu')) return
  closeMenu()
}

function onViewportChange() {
  if (menuPlan.value) positionMenu(menuPlan.value)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  closeMenu()
  if (dropTarget.value) {
    dropTarget.value = null
    return
  }
  if (showModal.value) closeModal()
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', onViewportChange)
  document.addEventListener('click', onDocClick)
  document.addEventListener('scroll', onViewportChange, true)
  await Promise.all([loadGroups(), load()])
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

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
  flex-wrap: wrap;
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

.stat-label { font-size: 12px; font-weight: 700; color: #94a3b8; }
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
  overflow-y: visible;
  border-radius: 16px;
  -webkit-overflow-scrolling: touch;
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
  border-bottom: 1px solid #f1f5f9;
  padding: 12px 10px;
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
  background: #fff;
}

.table th {
  background: #f8fafc;
  color: #64748b;
  font-weight: 700;
  font-size: 12px;
  position: sticky;
  top: 0;
  z-index: 2;
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

.table th.sticky-right {
  z-index: 4;
  background: #f8fafc;
}

.table td.sticky-right {
  background: #fff;
}

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

.th-with-tip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.tip {
  color: #94a3b8;
  font-size: 11px;
  cursor: help;
}

/* 开关：对齐原版蓝色 toggle */
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

.name-cell { display: flex; flex-direction: column; gap: 2px; min-width: 100px; }
.name { font-weight: 700; color: #0f172a; }
.meta {
  font-size: 11px;
  color: #94a3b8;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.num-cell {
  color: #334155;
  font-variant-numeric: tabular-nums;
}
.num-cell.strong { font-weight: 800; color: #0f172a; }

.price-col {
  font-variant-numeric: tabular-nums;
  color: #334155;
  font-weight: 600;
}

.group-tag {
  display: inline-flex;
  padding: 3px 10px;
  border-radius: 6px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
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
}
.metric.zero { background: #f1f5f9; color: #94a3b8; }

.actions-td {
  width: 88px;
  min-width: 88px;
  text-align: right;
}

.menu-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.menu-trigger:hover { background: #f8fafc; }

.plan-action-menu {
  min-width: 112px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.16);
  padding: 4px;
  display: flex;
  flex-direction: column;
}

.plan-action-menu button {
  border: none;
  background: transparent;
  text-align: left;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
}
.plan-action-menu button:hover { background: #f1f5f9; }
.plan-action-menu button.danger { color: #dc2626; }
.plan-action-menu button:disabled { opacity: 0.4; cursor: not-allowed; }

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
  width: 520px;
  max-width: 96vw;
  max-height: 92vh;
  overflow: auto;
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
  animation: modalIn 0.16s ease;
}

.edit-modal { width: min(860px, 96vw); }
.confirm-modal { width: 420px; }

.edit-form {
  padding: 8px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-divider {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0 0;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
}

.section-divider .tip {
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  cursor: help;
}

.price-cycle-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}

.price-extra-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.affix-input {
  position: relative;
  display: flex;
  align-items: center;
}

.affix-input .input {
  padding-right: 48px;
}

.affix-input em {
  position: absolute;
  right: 12px;
  font-style: normal;
  font-size: 13px;
  font-weight: 700;
  color: #94a3b8;
  pointer-events: none;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.link-btn {
  font-size: 12px;
  font-weight: 700;
  color: #2563eb;
  text-decoration: none;
}

.link-btn:hover { text-decoration: underline; }

.edit-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 4px;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
}

.force-check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
}

.force-check-placeholder { flex: 1; }

.footer-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
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

.modal-body {
  padding: 16px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-section {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px 14px 16px;
  background: #fafbfc;
}

.section-head { margin-bottom: 12px; }
.section-head h3 { margin: 0; font-size: 14px; font-weight: 800; color: #0f172a; }
.section-head p { margin: 2px 0 0; font-size: 12px; color: #94a3b8; }

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.form-grid.prices { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.form-row { display: flex; flex-direction: column; gap: 6px; }
.form-row.full { grid-column: 1 / -1; }
.form-row.switches {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 12px 18px;
}

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
.textarea { resize: vertical; min-height: 72px; line-height: 1.5; }

.price-input {
  display: flex;
  align-items: center;
  gap: 6px;
}
.price-input > span {
  color: #94a3b8;
  font-weight: 700;
  font-size: 13px;
}

.switch-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #334155;
  font-weight: 600;
  cursor: pointer;
}
.switch-row.warn { color: #b45309; }

.field-error { margin: 0; font-size: 12px; color: #dc2626; font-weight: 600; }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
}
.modal-footer.sticky {
  position: sticky;
  bottom: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.7), #fff 40%);
  padding: 12px 0 0;
}

.confirm-text { margin: 0; font-size: 14px; color: #334155; line-height: 1.6; }
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
.toast.error { background: #dc2626; }

@media (max-width: 900px) {
  .stat-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .price-cycle-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 640px) {
  .page-header { flex-direction: column; }
  .header-actions { width: 100%; }
  .price-cycle-grid,
  .price-extra-grid { grid-template-columns: 1fr 1fr; }
  .edit-footer { flex-direction: column; align-items: stretch; }
  .footer-actions { margin-left: 0; }
  .footer-actions .btn { flex: 1; justify-content: center; }
}
</style>
