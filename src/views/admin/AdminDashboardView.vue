<template>
  <div class="admin-dashboard admin-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">仪表盘</h1>
        <p class="page-subtitle">运营概览：收入、注册、节点与用户流量。</p>
      </div>
      <button class="btn" type="button" :disabled="refreshing" @click="loadAll">
        {{ refreshing ? '刷新中…' : '刷新' }}
      </button>
    </div>

    <div class="quick-links">
      <RouterLink
        v-for="item in quickLinks"
        :key="item.to"
        :to="item.to"
        class="quick-link"
      >
        <span class="quick-icon" v-html="item.icon" />
        <span class="quick-label">{{ item.label }}</span>
      </RouterLink>
    </div>

    <div class="card metrics-card">
      <div v-if="overrideError" class="block-error">
        概览加载失败：{{ overrideError }}
        <button class="btn" type="button" @click="loadOverride">重试</button>
      </div>
      <template v-else>
        <div class="metrics-primary">
          <div class="metric">
            <span class="metric-label">在线人数</span>
            <strong class="metric-value">{{ overrideLoading ? '…' : fmtInt(override?.online_user) }}</strong>
          </div>
          <div class="metric">
            <span class="metric-label">今日收入</span>
            <strong class="metric-value">{{ overrideLoading ? '…' : fmtMoney(override?.day_income) }}</strong>
          </div>
          <div class="metric">
            <span class="metric-label">实时注册</span>
            <strong class="metric-value">{{ overrideLoading ? '…' : fmtInt(override?.day_register_total) }}</strong>
          </div>
        </div>
        <div class="metrics-secondary">
          <div class="metric-sm">
            <span>本月收入</span>
            <strong>{{ overrideLoading ? '…' : fmtMoney(override?.month_income) }}</strong>
          </div>
          <div class="metric-sm">
            <span>上月收入</span>
            <strong>{{ overrideLoading ? '…' : fmtMoney(override?.last_month_income) }}</strong>
          </div>
          <div class="metric-sm">
            <span>上月佣金支出</span>
            <strong>{{ overrideLoading ? '…' : fmtMoney(override?.commission_last_month_payout) }}</strong>
          </div>
          <div class="metric-sm">
            <span>本月新增用户</span>
            <strong>{{ overrideLoading ? '…' : fmtInt(override?.month_register_total) }}</strong>
          </div>
        </div>
      </template>
    </div>

    <div class="card chart-card">
      <div class="card-head">
        <h2>近 31 日趋势</h2>
      </div>
      <div v-if="orderError" class="block-error">
        趋势加载失败：{{ orderError }}
        <button class="btn" type="button" @click="loadOrder">重试</button>
      </div>
      <div v-else-if="orderEmpty && !orderLoading" class="block-empty">暂无统计数据（依赖日聚合写入 v2_stat）</div>
      <div ref="trendEl" class="chart-box" :class="{ hidden: !!orderError || orderEmpty }" />
    </div>

    <div class="rank-grid">
      <div class="card rank-card">
        <h2>今日节点流量排行</h2>
        <div v-if="serverTodayError" class="block-error">
          {{ serverTodayError }}
          <button class="btn" type="button" @click="loadRanks">重试</button>
        </div>
        <div v-else-if="!serverToday.length && !rankLoading" class="block-empty">暂无数据</div>
        <div
          ref="serverTodayEl"
          class="chart-box rank-box"
          :class="{ hidden: !!serverTodayError || !serverToday.length }"
        />
      </div>
      <div class="card rank-card">
        <h2>昨日节点流量排行</h2>
        <div v-if="serverLastError" class="block-error">
          {{ serverLastError }}
          <button class="btn" type="button" @click="loadRanks">重试</button>
        </div>
        <div v-else-if="!serverLast.length && !rankLoading" class="block-empty">暂无数据</div>
        <div
          ref="serverLastEl"
          class="chart-box rank-box"
          :class="{ hidden: !!serverLastError || !serverLast.length }"
        />
      </div>
      <div class="card rank-card">
        <h2>今日用户流量排行</h2>
        <div v-if="userTodayError" class="block-error">
          {{ userTodayError }}
          <button class="btn" type="button" @click="loadRanks">重试</button>
        </div>
        <div v-else-if="!userToday.length && !rankLoading" class="block-empty">暂无数据</div>
        <div
          ref="userTodayEl"
          class="chart-box rank-box"
          :class="{ hidden: !!userTodayError || !userToday.length }"
        />
      </div>
      <div class="card rank-card">
        <h2>昨日用户流量排行</h2>
        <div v-if="userLastError" class="block-error">
          {{ userLastError }}
          <button class="btn" type="button" @click="loadRanks">重试</button>
        </div>
        <div v-else-if="!userLast.length && !rankLoading" class="block-empty">暂无数据</div>
        <div
          ref="userLastEl"
          class="chart-box rank-box"
          :class="{ hidden: !!userLastError || !userLast.length }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { RouterLink } from 'vue-router'
import * as echarts from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TooltipComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsType } from 'echarts/core'
import {
  fetchStatOverride,
  fetchStatOrder,
  fetchStatServerLastRank,
  fetchStatServerTodayRank,
  fetchStatUserLastRank,
  fetchStatUserTodayRank,
  type StatOrderTrend,
  type StatOverride,
  type StatServerRank,
  type StatUserRank
} from '../../api/admin'
import { adminUrl } from '../../siteBrand'

echarts.use([LineChart, BarChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

const iconGear = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
const iconOrder = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>`
const iconPlan = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>`
const iconUser = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`

const quickLinks = [
  { to: adminUrl('/config/system'), label: '系统设置', icon: iconGear },
  { to: adminUrl('/orders'), label: '订单管理', icon: iconOrder },
  { to: adminUrl('/plans'), label: '订阅管理', icon: iconPlan },
  { to: adminUrl('/users'), label: '用户管理', icon: iconUser }
]

const override = ref<StatOverride | null>(null)
const overrideLoading = ref(false)
const overrideError = ref('')
const orderLoading = ref(false)
const orderError = ref('')
const orderEmpty = ref(false)
const rankLoading = ref(false)
const refreshing = ref(false)

const serverToday = ref<StatServerRank[]>([])
const serverLast = ref<StatServerRank[]>([])
const userToday = ref<StatUserRank[]>([])
const userLast = ref<StatUserRank[]>([])
const serverTodayError = ref('')
const serverLastError = ref('')
const userTodayError = ref('')
const userLastError = ref('')

const trendEl = ref<HTMLElement | null>(null)
const serverTodayEl = ref<HTMLElement | null>(null)
const serverLastEl = ref<HTMLElement | null>(null)
const userTodayEl = ref<HTMLElement | null>(null)
const userLastEl = ref<HTMLElement | null>(null)

const trendChart = shallowRef<EChartsType | null>(null)
const serverTodayChart = shallowRef<EChartsType | null>(null)
const serverLastChart = shallowRef<EChartsType | null>(null)
const userTodayChart = shallowRef<EChartsType | null>(null)
const userLastChart = shallowRef<EChartsType | null>(null)

let resizeObserver: ResizeObserver | null = null

function fmtInt(v: number | null | undefined): string {
  if (v == null || Number.isNaN(Number(v))) return '0'
  return String(Math.trunc(Number(v)))
}

function fmtMoney(cents: number | null | undefined): string {
  const n = cents == null || Number.isNaN(Number(cents)) ? 0 : Number(cents) / 100
  return `${n.toFixed(2)} CNY`
}

function errMsg(e: unknown): string {
  if (e instanceof Error && e.message) return e.message
  return '请求失败'
}

function ensureChart(el: HTMLElement | null, current: EChartsType | null): EChartsType | null {
  if (!el) return current
  if (current) return current
  return echarts.init(el)
}

function disposeAll() {
  for (const c of [
    trendChart.value,
    serverTodayChart.value,
    serverLastChart.value,
    userTodayChart.value,
    userLastChart.value
  ]) {
    c?.dispose()
  }
  trendChart.value = null
  serverTodayChart.value = null
  serverLastChart.value = null
  userTodayChart.value = null
  userLastChart.value = null
}

function renderTrend(rows: StatOrderTrend[]) {
  if (!rows.length) {
    orderEmpty.value = true
    trendChart.value?.clear()
    return
  }
  orderEmpty.value = false
  const dates = [...new Set(rows.map((r) => r.date))]
  const types = [...new Set(rows.map((r) => r.type))]
  const series = types.map((type) => ({
    name: type,
    type: 'line' as const,
    smooth: true,
    showSymbol: false,
    data: dates.map((d) => {
      const hit = rows.find((r) => r.date === d && r.type === type)
      return hit ? Number(hit.value) || 0 : 0
    })
  }))
  trendChart.value = ensureChart(trendEl.value, trendChart.value)
  trendChart.value?.setOption(
    {
      color: ['#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626'],
      tooltip: { trigger: 'axis' },
      legend: { type: 'scroll', top: 0 },
      grid: { left: 48, right: 24, top: 48, bottom: 32 },
      xAxis: { type: 'category', data: dates, boundaryGap: false },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#e2e8f0' } } },
      series
    },
    true
  )
}

function renderBarRank(
  el: HTMLElement | null,
  chartRef: typeof serverTodayChart,
  labels: string[],
  values: number[],
  unit: string
) {
  if (!el || !labels.length) {
    chartRef.value?.clear()
    return
  }
  chartRef.value = ensureChart(el, chartRef.value)
  const revLabels = [...labels].reverse()
  const revValues = [...values].reverse()
  chartRef.value?.setOption(
    {
      color: ['#2563eb'],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const p = Array.isArray(params) ? params[0] as { name?: string; value?: number } : null
          if (!p) return ''
          return `${p.name || ''}<br/>${Number(p.value || 0).toFixed(2)} ${unit}`
        }
      },
      grid: { left: 8, right: 24, top: 8, bottom: 8, containLabel: true },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { formatter: (v: number) => String(v) }
      },
      yAxis: {
        type: 'category',
        data: revLabels,
        axisLabel: {
          width: 120,
          overflow: 'truncate',
          ellipsis: '…'
        }
      },
      series: [
        {
          type: 'bar',
          data: revValues,
          barMaxWidth: 18,
          itemStyle: { borderRadius: [0, 4, 4, 0] }
        }
      ]
    },
    true
  )
}

function renderServerRank(el: HTMLElement | null, chartRef: typeof serverTodayChart, rows: StatServerRank[]) {
  const labels = rows.map((r) => r.server_name || `#${r.server_id}`)
  const values = rows.map((r) => Number(r.total) || 0)
  renderBarRank(el, chartRef, labels, values, 'GB')
}

function renderUserRank(el: HTMLElement | null, chartRef: typeof serverTodayChart, rows: StatUserRank[]) {
  const labels = rows.map((r) => r.email || `user#${r.user_id}`)
  const values = rows.map((r) => Number(r.total) || 0)
  renderBarRank(el, chartRef, labels, values, 'GB')
}

async function loadOverride() {
  overrideLoading.value = true
  overrideError.value = ''
  try {
    override.value = await fetchStatOverride()
  } catch (e) {
    overrideError.value = errMsg(e)
    override.value = null
  } finally {
    overrideLoading.value = false
  }
}

async function loadOrder() {
  orderLoading.value = true
  orderError.value = ''
  try {
    const rows = await fetchStatOrder()
    await nextTick()
    renderTrend(rows || [])
    trendChart.value?.resize()
  } catch (e) {
    orderError.value = errMsg(e)
    orderEmpty.value = false
  } finally {
    orderLoading.value = false
  }
}

async function loadRanks() {
  rankLoading.value = true
  serverTodayError.value = ''
  serverLastError.value = ''
  userTodayError.value = ''
  userLastError.value = ''

  try {
    const settled = await Promise.allSettled([
      fetchStatServerTodayRank(),
      fetchStatServerLastRank(),
      fetchStatUserTodayRank(),
      fetchStatUserLastRank()
    ])

    if (settled[0].status === 'fulfilled') {
      serverToday.value = settled[0].value || []
    } else {
      serverToday.value = []
      serverTodayError.value = errMsg(settled[0].reason)
    }
    if (settled[1].status === 'fulfilled') {
      serverLast.value = settled[1].value || []
    } else {
      serverLast.value = []
      serverLastError.value = errMsg(settled[1].reason)
    }
    if (settled[2].status === 'fulfilled') {
      userToday.value = settled[2].value || []
    } else {
      userToday.value = []
      userTodayError.value = errMsg(settled[2].reason)
    }
    if (settled[3].status === 'fulfilled') {
      userLast.value = settled[3].value || []
    } else {
      userLast.value = []
      userLastError.value = errMsg(settled[3].reason)
    }

    await nextTick()
    renderServerRank(serverTodayEl.value, serverTodayChart, serverToday.value)
    renderServerRank(serverLastEl.value, serverLastChart, serverLast.value)
    renderUserRank(userTodayEl.value, userTodayChart, userToday.value)
    renderUserRank(userLastEl.value, userLastChart, userLast.value)
    resizeAll()
  } finally {
    rankLoading.value = false
  }
}

async function loadAll() {
  refreshing.value = true
  try {
    await Promise.all([loadOverride(), loadOrder(), loadRanks()])
    resizeAll()
  } finally {
    refreshing.value = false
  }
}

function resizeAll() {
  trendChart.value?.resize()
  serverTodayChart.value?.resize()
  serverLastChart.value?.resize()
  userTodayChart.value?.resize()
  userLastChart.value?.resize()
}

onMounted(async () => {
  await loadAll()
  resizeObserver = new ResizeObserver(() => resizeAll())
  const root = trendEl.value?.closest('.admin-dashboard')
  if (root) resizeObserver.observe(root)
  window.addEventListener('resize', resizeAll)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  window.removeEventListener('resize', resizeAll)
  disposeAll()
})
</script>

<style scoped>
.admin-dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.quick-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 96px;
  padding: 16px 12px;
  border-radius: var(--radius-lg, 12px);
  border: 1px solid #e2e8f0;
  background: var(--card-bg, #fff);
  color: var(--text-main);
  text-decoration: none;
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.04));
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.quick-link:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
  transform: translateY(-1px);
}

.quick-icon {
  width: 28px;
  height: 28px;
  color: var(--primary-color, #2563eb);
  display: inline-flex;
}

.quick-icon :deep(svg) {
  width: 28px;
  height: 28px;
}

.quick-label {
  font-size: 14px;
  font-weight: 700;
}

.metrics-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.metrics-primary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-label {
  font-size: 13px;
  color: var(--text-muted);
}

.metric-value {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-main);
}

.metrics-secondary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
}

.metric-sm {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--text-muted);
}

.metric-sm strong {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
}

.chart-card h2,
.rank-card h2 {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 800;
}

.chart-box {
  width: 100%;
  height: 320px;
}

.chart-box.hidden {
  display: none;
}

.rank-box {
  height: 280px;
}

.rank-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.block-error,
.block-empty {
  font-size: 13px;
  color: var(--text-muted);
  padding: 12px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.block-error {
  color: #b91c1c;
}

@media (max-width: 960px) {
  .quick-links,
  .metrics-primary,
  .metrics-secondary,
  .rank-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .quick-links,
  .metrics-primary,
  .metrics-secondary,
  .rank-grid {
    grid-template-columns: 1fr;
  }

  .metric-value {
    font-size: 22px;
  }

  .chart-box {
    height: 260px;
  }
}
</style>
