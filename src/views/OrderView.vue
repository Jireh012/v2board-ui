<template>
  <div class="order-page">
    <h1 class="page-title">我的订单</h1>
    <p class="hint">最近订阅与充值订单记录。</p>

    <div class="toolbar">
      <button
        type="button"
        class="status-tab"
        :class="{ active: statusFilter === 'all' }"
        @click="setStatusFilter('all')"
      >
        全部
      </button>
      <button
        type="button"
        class="status-tab"
        :class="{ active: statusFilter === 'pending' }"
        @click="setStatusFilter('pending')"
      >
        待支付
      </button>
      <button
        type="button"
        class="status-tab"
        :class="{ active: statusFilter === 'finished' }"
        @click="setStatusFilter('finished')"
      >
        已完成
      </button>
      <button class="btn-refresh" type="button" @click="load">
        刷新
      </button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="orders.length" class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th style="width: 26%"># 订单号</th>
            <th style="width: 18%">周期</th>
            <th style="width: 16%">订单金额</th>
            <th style="width: 16%">订单状态</th>
            <th style="width: 24%">创建时间</th>
            <th style="width: 14%">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in displayOrders" :key="o.trade_no">
            <td>
              <button type="button" class="link-trade" @click="openDetail(o.trade_no)">
                {{ o.trade_no }}
              </button>
            </td>
            <td>{{ periodLabel(o.period) }}</td>
            <td>¥ {{ formatAmount(o.total_amount) }}</td>
            <td>
              <span class="status-chip">
                <span class="status-dot" :class="statusClass(o.status)" />
                {{ statusLabel(o.status) }}
              </span>
            </td>
            <td>{{ formatTime(o.created_at) }}</td>
            <td>
              <div class="action-group">
                <button
                  type="button"
                  class="link-action"
                  @click="openDetail(o.trade_no)"
                >
                  查看详细
                </button>
                <span v-if="o.status === 0" class="action-divider">|</span>
                <button
                  v-if="o.status === 0"
                  type="button"
                  class="link-action danger"
                  :disabled="cancelling === o.trade_no"
                  @click="cancel(o.trade_no)"
                >
                  {{ cancelling === o.trade_no ? '取消中...' : '取消' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="empty">暂无订单。</p>

    <!-- 订单详情侧拉面板 -->
    <div v-if="detailVisible" class="detail-mask" @click.self="closeDetail">
      <div class="detail-panel">
        <div class="detail-header">
          <div>
            <div class="detail-title">订单详情</div>
            <div class="detail-subtitle">{{ detail?.trade_no }}</div>
          </div>
          <button class="detail-close" type="button" @click="closeDetail">×</button>
        </div>
        <div class="detail-body" v-if="detail && !detailLoading">
          <dl class="detail-list">
            <div class="detail-row">
              <dt>订阅</dt>
              <dd>{{ detail.plan?.name || '-' }}</dd>
            </div>
            <div class="detail-row">
              <dt>周期</dt>
              <dd>{{ periodLabel(detail.period) }}</dd>
            </div>
            <div class="detail-row">
              <dt>订单金额</dt>
              <dd>¥ {{ formatAmount(detail.total_amount) }}</dd>
            </div>
            <div class="detail-row">
              <dt>状态</dt>
              <dd>{{ statusLabel(detail.status) }}</dd>
            </div>
          </dl>
        </div>
        <div v-else class="detail-loading">正在加载订单详情...</div>
      </div>
    </div>

    <p v-if="message" class="message">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  cancelOrder,
  fetchOrderDetail,
  fetchOrders,
  type OrderDetail,
  type OrderListItem
} from '../api/order'

const router = useRouter()
const orders = ref<OrderListItem[]>([])
const loading = ref(false)
const message = ref('')

type StatusFilter = 'all' | 'pending' | 'finished'
const statusFilter = ref<StatusFilter>('all')

const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref<OrderDetail | null>(null)
const cancelling = ref<string | null>(null)

const displayOrders = computed(() => {
  if (statusFilter.value === 'pending') {
    return orders.value.filter((o) => o.status === 0)
  }
  if (statusFilter.value === 'finished') {
    return orders.value.filter((o) => o.status === 3)
  }
  return orders.value
})

function setStatusFilter(f: StatusFilter) {
  statusFilter.value = f
}

async function load() {
  loading.value = true
  message.value = ''
  try {
    orders.value = await fetchOrders()
  } catch (e) {
    orders.value = []
    message.value = e instanceof Error ? e.message : '加载订单失败'
  } finally {
    loading.value = false
  }
}

function formatAmount(cents: number | null | undefined): string {
  if (!cents) return '0.00'
  return (cents / 100).toFixed(2)
}

function formatTime(ts: number | null | undefined): string {
  if (!ts) return '-'
  const d = new Date(ts * 1000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}/${m}/${day} ${hh}:${mm}`
}

function periodLabel(period: string | null | undefined): string {
  switch (period) {
    case 'month_price':
      return '月付'
    case 'quarter_price':
      return '季付'
    case 'half_year_price':
      return '半年付'
    case 'year_price':
      return '年付'
    case 'two_year_price':
      return '两年付'
    case 'three_year_price':
      return '三年付'
    case 'onetime_price':
      return '一次性'
    case 'reset_price':
      return '重置流量'
    case 'deposit':
      return '充值'
    default:
      return period || '-'
  }
}

function statusLabel(status: number | null | undefined): string {
  switch (status) {
    case 0:
      return '待支付'
    case 1:
      return '开通中'
    case 2:
      return '已取消'
    case 3:
      return '已完成'
    default:
      return '未知'
  }
}

function statusClass(status: number | null | undefined): string {
  switch (status) {
    case 0:
      return 'status-pending'
    case 1:
      return 'status-processing'
    case 3:
      return 'status-success'
    case 2:
    default:
      return 'status-cancelled'
  }
}

async function openDetail(tradeNo: string) {
  await router.push(`/order/${encodeURIComponent(tradeNo)}`)
}

function closeDetail() {
  detailVisible.value = false
}

async function cancel(tradeNo: string) {
  if (!confirm('确认取消该待支付订单吗？')) return
  cancelling.value = tradeNo
  message.value = ''
  try {
    await cancelOrder(tradeNo)
    await load()
  } catch (e) {
    message.value = e instanceof Error ? e.message : '取消订单失败'
  } finally {
    cancelling.value = null
  }
}

onMounted(load)
</script>

<style scoped>
.order-page {
  width: 100%;
  padding: 24px 16px;
  background: #f8fafd;
  box-sizing: border-box;
}

.page-title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.hint {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.status-tab {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #374151;
  font-size: 13px;
  cursor: pointer;
}

.status-tab.active {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
}

.btn-refresh {
  margin-left: auto;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  cursor: pointer;
  font-size: 13px;
}

.loading {
  font-size: 14px;
  color: #6b7280;
  padding: 20px 0;
}

.table-wrapper {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  background: #ffffff;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table th,
.table td {
  padding: 8px 10px;
  border-bottom: 1px solid #e5e7eb;
}

.table th {
  background: #f3f4f6;
  text-align: left;
  font-weight: 500;
  color: #4b5563;
}

.table tbody tr:nth-child(even) {
  background: #f9fafb;
}

.link-trade {
  border: none;
  background: transparent;
  padding: 0;
  color: #2563eb;
  font-size: 13px;
  cursor: pointer;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.status-pending {
  background: #f97316;
}
.status-processing {
  background: #3b82f6;
}
.status-success {
  background: #22c55e;
}
.status-cancelled {
  background: #9ca3af;
}

.action-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.action-divider {
  font-size: 12px;
  color: #d1d5db;
}

.link-action {
  border: none;
  background: transparent;
  padding: 0;
  font-size: 13px;
  color: #2563eb;
  cursor: pointer;
}

.link-action.danger {
  color: #dc2626;
}

.empty {
  font-size: 14px;
  color: #6b7280;
  padding: 40px 0;
}

.message {
  margin-top: 12px;
  font-size: 13px;
  color: #374151;
}

.detail-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  justify-content: flex-end;
  z-index: 1200;
}

.detail-panel {
  width: 360px;
  max-width: 100%;
  background: #ffffff;
  box-shadow: -10px 0 30px rgba(15, 23, 42, 0.3);
  display: flex;
  flex-direction: column;
}

.detail-header {
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.detail-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.detail-subtitle {
  font-size: 12px;
  color: #6b7280;
}

.detail-close {
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  color: #6b7280;
}

.detail-body {
  padding: 14px 16px 18px;
  flex: 1;
  overflow: auto;
}

.detail-loading {
  padding: 18px 16px;
  font-size: 13px;
  color: #6b7280;
}

.detail-list {
  margin: 0;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 6px 0;
}

.detail-row dt {
  color: #6b7280;
}

.detail-row dd {
  margin: 0;
  color: #111827;
}
</style>
