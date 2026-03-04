<template>
  <div class="plan-page">
    <h1 v-if="!activePlan" class="page-title">选择最适合您的计划</h1>

    <div v-if="!activePlan" class="filter-tabs">
      <button
        type="button"
        class="tab"
        :class="{ active: filterMode === 'all' }"
        :disabled="loading"
        @click="setFilter('all')"
      >
        全部
      </button>
      <button
        type="button"
        class="tab"
        :class="{ active: filterMode === 'period' }"
        :disabled="loading"
        @click="setFilter('period')"
      >
        按周期
      </button>
      <button
        type="button"
        class="tab"
        :class="{ active: filterMode === 'traffic' }"
        :disabled="loading"
        @click="setFilter('traffic')"
      >
        按流量
      </button>
    </div>

    <p v-if="loading" class="loading">加载中...</p>

    <!-- 选择套餐列表 -->
    <div class="plans" v-else-if="!activePlan && displayPlans.length">
      <div v-for="plan in displayPlans" :key="plan.id" class="plan-card">
        <h2 class="plan-name">{{ plan.name }}</h2>
        <div class="plan-price-block">
          <span class="plan-price">¥ {{ formatPrice(plan.monthPrice) }}</span>
        </div>
        <p class="plan-period">月付</p>
        <button type="button" class="btn-subscribe" @click="onBuy(plan)">
          立即订阅
        </button>
      </div>
    </div>

    <!-- 单个套餐下单详情 -->
    <div v-else-if="activePlan" class="plan-detail-layout">
      <div class="plan-detail-left">
        <div class="plan-detail-header">
          <h2 class="detail-title">{{ activePlan.name }}</h2>
          <button type="button" class="link-back" @click="backToList">
            返回套餐列表
          </button>
        </div>
        <div class="period-card">
          <div class="period-title">付款周期</div>
          <div v-if="periodOptions.length" class="period-list">
            <button
              v-for="item in periodOptions"
              :key="item.key"
              type="button"
              class="period-row"
              :class="{ active: selectedPeriod === item.key }"
              @click="selectPeriod(item.key)"
            >
              <span class="period-label">{{ item.label }}</span>
              <span class="period-price">¥ {{ formatPrice(item.price) }}</span>
            </button>
          </div>
          <p v-else class="empty">该订阅暂无可购买的计费周期。</p>
        </div>
      </div>
      <div class="plan-detail-right">
        <div class="coupon-card">
          <div class="coupon-label">有优惠券？</div>
          <div class="coupon-input-row">
            <input
              v-model="couponCode"
              class="coupon-input"
              type="text"
              placeholder="请输入优惠券码"
              disabled
            />
            <button type="button" class="coupon-btn" disabled>
              验证
            </button>
          </div>
          <p class="coupon-tip">当前版本暂不支持优惠券，仅展示样式。</p>
        </div>

        <div class="summary-card" v-if="activePlan && selectedPeriod">
          <div class="summary-row summary-title">订单总额</div>
          <div class="summary-row">
            <span class="summary-label">
              {{ activePlan.name }} × {{ currentPeriodLabel }}
            </span>
            <span class="summary-value">
              ¥ {{ formatPrice(currentPeriodPrice) }}
            </span>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-row summary-total">
            <span class="summary-total-label">合计</span>
            <span class="summary-total-amount">
              ¥ {{ formatPrice(currentPeriodPrice) }} CNY
            </span>
          </div>
          <button
            type="button"
            class="btn-submit-order"
            :disabled="submittingOrder"
            @click="submitOrder"
          >
            {{ submittingOrder ? '正在提交...' : '下单' }}
          </button>
        </div>
      </div>
    </div>

    <p v-else class="empty">暂无可用套餐。</p>
    <p v-if="message" class="message">{{ message }}</p>

    <!-- 未完成订单提示弹窗 -->
    <div v-if="showUnfinishedOrderDialog" class="dialog-mask">
      <div class="dialog">
        <div class="dialog-header">
          <span class="dialog-title">请求失败</span>
          <button class="dialog-close" type="button" @click="closeUnfinishedDialog">
            ×
          </button>
        </div>
        <div class="dialog-body">
          您有未付款或开通中的订单，请稍后再试或前往「我的订单」取消/完成支付。
        </div>
        <div class="dialog-footer">
          <button type="button" class="dialog-btn secondary" @click="closeUnfinishedDialog">
            关闭
          </button>
          <button type="button" class="dialog-btn primary" @click="goToOrders">
            查看订单
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { fetchPlans, type Plan } from '../api/plan'
import { createOrder } from '../api/order'
import { useRoute, useRouter } from 'vue-router'

interface PeriodOption {
  key: string
  label: string
  price: number
}

const route = useRoute()
const router = useRouter()

const plans = ref<Plan[]>([])
const message = ref('')
const loading = ref(false)
const filterMode = ref<'all' | 'period' | 'traffic'>('all')
const activePlan = ref<Plan | null>(null)
const selectedPeriod = ref<string | null>(null)
const submittingOrder = ref(false)
const couponCode = ref('')
const showUnfinishedOrderDialog = ref(false)

function hasCyclePrice(plan: Plan): boolean {
  return [
    plan.monthPrice,
    plan.quarterPrice,
    plan.halfYearPrice,
    plan.yearPrice,
    plan.twoYearPrice,
    plan.threeYearPrice,
    plan.onetimePrice
  ].some((v) => typeof v === 'number' && v > 0)
}

const planIdFromRoute = computed(() => {
  const raw = route.params.id
  const idStr = Array.isArray(raw) ? raw[0] : raw
  const n = idStr != null ? Number(idStr) : NaN
  return Number.isFinite(n) ? n : null
})

const displayPlans = computed(() => {
  const list = plans.value.slice()
  if (!list.length) return list

  if (filterMode.value === 'period') {
    const periodPlans = list
      .map((p) => ({ plan: p, price: getPeriodPrice(p) }))
      .filter((x) => x.price != null) as { plan: Plan; price: number }[]
    return periodPlans
      .sort((a, b) => a.price - b.price)
      .map((x) => x.plan)
  }

  if (filterMode.value === 'traffic') {
    // 仅显示“按流量”套餐：有 resetPrice 且没有周期价格
    const trafficPlans = list.filter(
      (p) => (p.resetPrice ?? 0) > 0 && !hasCyclePrice(p)
    )
    return trafficPlans
  }

  return list
})

const periodOptions = computed<PeriodOption[]>(() => {
  if (!activePlan.value) return []
  return buildPeriodOptions(activePlan.value)
})

const currentPeriodPrice = computed(() => {
  if (!activePlan.value || !selectedPeriod.value) return 0
  const opt = periodOptions.value.find((o) => o.key === selectedPeriod.value)
  return opt ? opt.price : 0
})

const currentPeriodLabel = computed(() => {
  if (!selectedPeriod.value) return ''
  const opt = periodOptions.value.find((o) => o.key === selectedPeriod.value)
  return opt ? opt.label : ''
})

function getPeriodPrice(plan: Plan): number | null {
  const candidates = [
    plan.monthPrice,
    plan.quarterPrice,
    plan.halfYearPrice,
    plan.yearPrice,
    plan.twoYearPrice,
    plan.threeYearPrice,
    plan.onetimePrice
  ].filter((v): v is number => v != null && v > 0)

  if (!candidates.length) return null
  return Math.min(...candidates)
}

function buildPeriodOptions(plan: Plan): PeriodOption[] {
  const config: Array<{ field: keyof Plan; key: string; label: string }> = [
    { field: 'monthPrice', key: 'month_price', label: '月付' },
    { field: 'quarterPrice', key: 'quarter_price', label: '季付' },
    { field: 'halfYearPrice', key: 'half_year_price', label: '半年付' },
    { field: 'yearPrice', key: 'year_price', label: '年付' },
    { field: 'twoYearPrice', key: 'two_year_price', label: '两年付' },
    { field: 'threeYearPrice', key: 'three_year_price', label: '三年付' },
    { field: 'onetimePrice', key: 'onetime_price', label: '一次性' },
    { field: 'resetPrice', key: 'reset_price', label: '重置流量' }
  ]
  const result: PeriodOption[] = []
  for (const item of config) {
    const val = plan[item.field]
    if (typeof val === 'number' && val > 0) {
      result.push({ key: item.key, label: item.label, price: val })
    }
  }
  return result
}

async function loadPlans() {
  loading.value = true
  message.value = ''
  try {
    plans.value = await fetchPlans()
  } catch (e) {
    message.value = e instanceof Error ? e.message : '加载套餐失败'
    plans.value = []
  } finally {
    loading.value = false
  }
}

function syncActivePlanFromRoute() {
  const id = planIdFromRoute.value
  if (!id || !plans.value.length) return
  const found = plans.value.find((p) => p.id === id)
  if (found) {
    activePlan.value = found
    const options = buildPeriodOptions(found)
    selectedPeriod.value = options.length ? options[0].key : null
  }
}

function setFilter(mode: 'all' | 'period' | 'traffic') {
  filterMode.value = mode
}

function selectPeriod(key: string) {
  selectedPeriod.value = key
}

function backToList() {
  activePlan.value = null
  selectedPeriod.value = null
  submittingOrder.value = false
  couponCode.value = ''
  if (route.params.id) {
    router.replace('/plan')
  }
  if (!plans.value.length) {
    loadPlans()
  }
}

onMounted(async () => {
  await loadPlans()
  syncActivePlanFromRoute()
})

watch(planIdFromRoute, () => {
  syncActivePlanFromRoute()
})

/** 价格：后端为分，转为元显示；兼容 undefined/null */
function formatPrice(cents: number | undefined | null): string {
  if (cents == null) return '0.00'
  return (Number(cents) / 100).toFixed(2)
}

function onBuy(plan: Plan) {
  if (!route.params.id) {
    router.push(`/plan/${plan.id}`)
  }
  activePlan.value = plan
  const options = buildPeriodOptions(plan)
  selectedPeriod.value = options.length ? options[0].key : null
  message.value = ''
}

async function submitOrder() {
  if (!activePlan.value || !selectedPeriod.value) {
    message.value = '请选择计费周期后再下单'
    return
  }
  submittingOrder.value = true
  message.value = ''
  try {
    const tradeNo = await createOrder(activePlan.value.id, selectedPeriod.value)
    // 创建订单成功后，跳转到订单详情页让用户选择支付方式并完成支付
    await router.push(`/order/${encodeURIComponent(tradeNo)}`)
  } catch (e) {
    if (
      e instanceof Error &&
      (e.message.includes('You have an unpaid or pending order') ||
        e.message.includes('未付款或开通中的订单'))
    ) {
      showUnfinishedOrderDialog.value = true
      return
    }
    message.value = e instanceof Error ? e.message : '下单失败'
  } finally {
    submittingOrder.value = false
  }
}

function closeUnfinishedDialog() {
  showUnfinishedOrderDialog.value = false
}

function goToOrders() {
  showUnfinishedOrderDialog.value = false
  router.push('/order')
}
</script>

<style scoped>
.plan-page {
  width: 100%;
  padding: 24px 16px;
  background: #f8fafd;
  min-height: 100%;
  box-sizing: border-box;
  text-align: center;
}

.page-title {
  margin: 0 0 24px;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  letter-spacing: 0.02em;
}

.filter-tabs {
  display: inline-flex;
  margin: 0 auto 28px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.tab {
  padding: 10px 24px;
  border: none;
  border-radius: 0;
  border-right: 1px solid #e5e7eb;
  background: #ffffff;
  color: #6b7280;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.tab:last-child {
  border-right: none;
}

.tab:hover:not(.active) {
  background: #f9fafb;
  color: #374151;
}

.tab.active {
  background: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
}

.plans {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
  gap: 20px;
  text-align: left;
}

.plan-detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1.1fr);
  gap: 20px;
  align-items: flex-start;
}

.plan-detail-left,
.plan-detail-right {
  min-width: 0;
}

.plan-detail-left {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
}

.detail-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.link-back {
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 13px;
  cursor: pointer;
}

.period-card {
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  padding: 12px 0;
}

.period-title {
  padding: 0 16px 8px;
  font-size: 13px;
  color: #6b7280;
}

.period-list {
  display: flex;
  flex-direction: column;
}

.period-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border: none;
  border-radius: 0;
  background: #ffffff;
  cursor: pointer;
  font-size: 14px;
  color: #111827;
  border-top: 1px solid #f3f4f6;
}

.period-row:first-of-type {
  border-top: 1px solid #e5e7eb;
}

.period-row:hover:not(.active) {
  background: #f9fafb;
}

.period-row.active {
  background: #eff6ff;
  box-shadow: inset 0 0 0 1px #2563eb;
}

.period-label {
  font-size: 14px;
}

.period-price {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
}

.plan-detail-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.coupon-card {
  padding: 14px 16px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
}

.coupon-label {
  font-size: 13px;
  color: #111827;
  margin-bottom: 8px;
}

.coupon-input-row {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
}

.coupon-input {
  flex: 1;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  font-size: 13px;
  background: #f9fafb;
}

.coupon-btn {
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  background: #2563eb;
  color: #ffffff;
  font-size: 13px;
  cursor: not-allowed;
  opacity: 0.6;
}

.coupon-tip {
  margin: 0;
  font-size: 12px;
  color: #9ca3af;
}

.summary-card {
  padding: 16px 18px;
  border-radius: 10px;
  background: #111827;
  color: #e5e7eb;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.35);
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 6px;
}

.summary-title {
  font-weight: 600;
  margin-bottom: 10px;
}

.summary-divider {
  height: 1px;
  background: rgba(148, 163, 184, 0.5);
  margin: 10px 0;
}

.summary-total {
  margin-bottom: 14px;
}

.summary-total-label {
  font-size: 13px;
  color: #9ca3af;
}

.summary-total-amount {
  font-size: 18px;
  font-weight: 700;
}

.btn-submit-order {
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

.btn-submit-order:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.plan-card {
  background: #ffffff;
  border-radius: 10px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  min-width: 0;
}

.plan-name {
  margin: 0 0 14px;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  text-align: left;
}

.plan-price-block {
  background: #f3f4f6;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 8px;
}

.plan-price {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  display: block;
  text-align: left;
}

.plan-period {
  margin: 0 0 16px;
  font-size: 13px;
  color: #9ca3af;
  text-align: left;
}

.btn-subscribe {
  width: 100%;
  padding: 11px 16px;
  border-radius: 8px;
  border: none;
  background: #2563eb;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-subscribe:hover {
  background: #1d4ed8;
}

.loading {
  font-size: 14px;
  color: #6b7280;
  text-align: center;
  padding: 24px 0;
}

.empty {
  font-size: 14px;
  color: #6b7280;
  text-align: center;
  padding: 40px 0;
}

.message {
  margin-top: 16px;
  font-size: 13px;
  color: #374151;
}

/* 简易弹窗样式 */
.dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}

.dialog {
  width: 340px;
  max-width: 90%;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.25);
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid #e5e7eb;
}

.dialog-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.dialog-close {
  border: none;
  background: transparent;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  color: #6b7280;
}

.dialog-body {
  padding: 12px 14px;
  font-size: 13px;
  color: #4b5563;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 14px 12px;
  border-top: 1px solid #e5e7eb;
}

.dialog-btn {
  min-width: 80px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid transparent;
}

.dialog-btn.secondary {
  background: #ffffff;
  border-color: #e5e7eb;
  color: #374151;
}

.dialog-btn.primary {
  background: #2563eb;
  color: #ffffff;
}
</style>
