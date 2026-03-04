<template>
  <div class="order-detail-page">
    <div v-if="loading" class="loading">正在加载订单...</div>
    <div v-else-if="order" class="layout">
      <div class="left">
        <section class="card">
          <h2 class="card-title">商品信息</h2>
          <div class="card-row">
            <span class="label">订阅名称：</span>
            <span class="value">{{ order.plan?.name || '订阅' }}</span>
          </div>
          <div class="card-row">
            <span class="label">产品流量：</span>
            <span class="value">{{ formatTraffic(order.plan?.transferEnable) }}</span>
          </div>
        </section>

        <section class="card">
          <div class="card-header">
          <h2 class="card-title">订单信息</h2>
          <button
            v-if="order.status === 0"
            type="button"
            class="btn-outline btn-close-order"
            :disabled="cancelling"
            @click="cancel"
          >
            {{ cancelling ? '关闭中...' : '关闭订单' }}
          </button>
          </div>
          <div class="card-row">
            <span class="label">订单号：</span>
            <span class="value">{{ order.trade_no }}</span>
          </div>
          <div class="card-row">
            <span class="label">创建时间：</span>
            <span class="value">{{ formatTime(order.created_at) }}</span>
          </div>
          <div class="card-row">
            <span class="label">状态：</span>
            <span class="value">{{ statusLabel(order.status) }}</span>
          </div>
        </section>

        <section class="card">
          <h2 class="card-title">支付方式</h2>
          <div v-if="methods.length" class="pay-list">
            <button
              v-for="m in methods"
              :key="m.id"
              type="button"
              class="pay-row"
              :class="{ active: selectedMethodId === m.id }"
              @click="selectedMethodId = m.id"
            >
              <span class="radio" />
              <span class="pay-name">{{ m.name }}</span>
            </button>
          </div>
          <p v-else class="empty">暂无可用支付方式。</p>
        </section>
      </div>

      <div class="right">
        <section class="summary-card">
          <div class="summary-title">订单总额</div>
          <div class="summary-line">
            <span>{{ order.plan?.name || '订阅' }} × {{ periodLabel(order.period) }}</span>
            <span>¥ {{ formatAmount(order.total_amount) }}</span>
          </div>
          <div class="summary-divider" />
          <div class="summary-total">
            <span>合计</span>
            <span>¥ {{ formatAmount(order.total_amount) }} CNY</span>
          </div>
          <button
            type="button"
            class="btn-pay"
            :disabled="payDisabled"
            @click="pay"
          >
            {{ payButtonText }}
          </button>
        </section>

        <p v-if="message" class="message">{{ message }}</p>
      </div>
    </div>
    <div v-else class="empty">订单不存在或已被删除。</div>

    <!-- 支付二维码弹窗 -->
    <div
      v-if="qrcodeVisible && qrcodeUrl"
      class="pay-qrcode-mask"
      @click.self="closeQrcode"
    >
      <div class="pay-qrcode-dialog">
        <img :src="qrcodeUrl" alt="支付二维码" class="pay-qrcode-img" />
        <div class="pay-qrcode-footer">等待支付中</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  cancelOrder,
  checkout,
  checkOrderStatus,
  fetchOrderDetail,
  getPaymentMethods,
  type OrderDetail,
  type PaymentMethod
} from '../api/order'

const route = useRoute()
const router = useRouter()

const order = ref<OrderDetail | null>(null)
const methods = ref<PaymentMethod[]>([])
const selectedMethodId = ref<number | null>(null)
const loading = ref(false)
const cancelling = ref(false)
const paying = ref(false)
const message = ref('')
const qrcodeVisible = ref(false)
const qrcodeUrl = ref<string | null>(null)
let checkTimer: number | null = null

const payDisabled = computed(
  () =>
    !order.value ||
    order.value.status !== 0 ||
    !selectedMethodId.value ||
    paying.value
)

const payButtonText = computed(() => {
  if (!order.value) return '结账'
  if (order.value.status === 3) return '已完成'
  if (order.value.status === 2) return '已取消'
  if (order.value.status !== 0) return '不可支付'
  return paying.value ? '处理中...' : '结账'
})

function formatAmount(cents: number | null | undefined): string {
  if (!cents) return '0.00'
  return (cents / 100).toFixed(2)
}

function formatTime(ts?: number | null): string {
  if (!ts) return '-'
  const d = new Date(ts * 1000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}/${m}/${day} ${hh}:${mm}`
}

// 计划里的 transferEnable 与原版一致，单位为 GB，这里直接按 GB 显示
function formatTraffic(transferEnable?: number | null): string {
  if (!transferEnable) return '-'
  return `${transferEnable.toFixed(0)} GB`
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

async function loadAll() {
  const tradeNoParam = route.params.tradeNo
  const tradeNo = Array.isArray(tradeNoParam) ? tradeNoParam[0] : tradeNoParam
  if (!tradeNo) {
    message.value = '无效的订单号'
    return
  }
  loading.value = true
  message.value = ''
  try {
    order.value = await fetchOrderDetail(tradeNo)
    methods.value = await getPaymentMethods()
    if (methods.value.length) {
      selectedMethodId.value = methods.value[0].id
    }
  } catch (e) {
    order.value = null
    message.value = e instanceof Error ? e.message : '加载订单信息失败'
  } finally {
    loading.value = false
  }
}

async function cancel() {
  if (!order.value || order.value.status !== 0) return
  if (!confirm('确认关闭该待支付订单吗？')) return
  cancelling.value = true
  message.value = ''
  try {
    await cancelOrder(order.value.trade_no)
    await loadAll()
  } catch (e) {
    message.value = e instanceof Error ? e.message : '关闭订单失败'
  } finally {
    cancelling.value = false
  }
}

async function pay() {
  if (!order.value || !selectedMethodId.value || order.value.status !== 0) return
  paying.value = true
  message.value = ''
  try {
    const raw = await checkout(order.value.trade_no, selectedMethodId.value)
    const res = raw as { type?: number; data?: any }
    if (!res || typeof res !== 'object') {
      message.value = '支付请求返回格式异常'
      return
    }
    if (res.type === 0) {
      // 二维码支付：使用第三方 QR 生成服务展示二维码，并开始轮询订单状态
      let content: string
      if (typeof res.data === 'string') {
        content = res.data
      } else if (res.data && typeof res.data === 'object') {
        // 优先使用 payload 中的信息
        const payload = (res.data as any).payload ?? res.data
        content = JSON.stringify(payload)
      } else {
        message.value = '支付请求返回格式异常'
        return
      }
      qrcodeUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
        content
      )}`
      qrcodeVisible.value = true
      startCheck()
    } else if (res.type === 1 && typeof res.data === 'string') {
      // 跳转到收银台
      window.location.href = res.data
    } else {
      message.value = '已发起支付：' + JSON.stringify(res.data ?? res)
    }
  } catch (e) {
    message.value = e instanceof Error ? e.message : '支付请求失败'
  } finally {
    paying.value = false
  }
}

function stopCheck() {
  if (checkTimer != null) {
    clearTimeout(checkTimer)
    checkTimer = null
  }
}

function startCheck() {
  stopCheck()
  if (!order.value) return
  const tradeNo = order.value.trade_no
  const loop = async () => {
    try {
      const status = await checkOrderStatus(tradeNo)
      if (status !== 0) {
        stopCheck()
        qrcodeVisible.value = false
        await loadAll()
        return
      }
    } catch {
      // 轮询失败时静默重试
    }
    checkTimer = window.setTimeout(loop, 3000)
  }
  checkTimer = window.setTimeout(loop, 3000)
}

function closeQrcode() {
  qrcodeVisible.value = false
  stopCheck()
}

onMounted(loadAll)
</script>

<style scoped>
.order-detail-page {
  width: 100%;
  padding: 24px 16px;
  background: #f8fafd;
  box-sizing: border-box;
}

.loading {
  font-size: 14px;
  color: #6b7280;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1.1fr);
  gap: 20px;
  align-items: flex-start;
}

.left,
.right {
  min-width: 0;
}

.left {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card {
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  padding: 14px 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.card-title {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.card-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 4px 0;
}

.label {
  color: #6b7280;
}

.value {
  color: #111827;
}

.btn-outline {
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
}

.btn-close-order {
  border-color: #fb923c;
  background: #f97316;
  color: #ffffff;
}

.btn-close-order:disabled {
  background: #fed7aa;
  border-color: #fed7aa;
  color: #9a3412;
}

.btn-outline:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pay-list {
  display: flex;
  flex-direction: column;
}

.pay-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 6px;
  background: #ffffff;
  cursor: pointer;
}

.pay-row.active {
  border-color: #2563eb;
  background: #eff6ff;
}

.radio {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid #2563eb;
}

.pay-row.active .radio {
  background: #2563eb;
}

.pay-name {
  font-size: 13px;
  color: #111827;
}

.empty {
  font-size: 13px;
  color: #6b7280;
}

.right {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.summary-card {
  background: #111827;
  color: #e5e7eb;
  border-radius: 10px;
  padding: 18px 20px;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.4);
}

.summary-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.summary-divider {
  height: 1px;
  background: rgba(148, 163, 184, 0.5);
  margin: 10px 0;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 14px;
}

.summary-total span:first-child {
  font-size: 13px;
  color: #9ca3af;
}

.summary-total span:last-child {
  font-size: 20px;
  font-weight: 700;
}

.btn-pay {
  width: 100%;
  border: none;
  border-radius: 8px;
  padding: 11px 16px;
  background: #2563eb;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-pay:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.message {
  margin-top: 8px;
  font-size: 13px;
  color: #374151;
}

.pay-qrcode-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1300;
}

.pay-qrcode-dialog {
  background: #ffffff;
  border-radius: 10px;
  padding: 16px 16px 12px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pay-qrcode-img {
  width: 220px;
  height: 220px;
}

.pay-qrcode-footer {
  margin-top: 8px;
  font-size: 13px;
  color: #4b5563;
}
</style>

