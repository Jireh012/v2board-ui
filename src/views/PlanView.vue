<template>
  <div class="plan-page">
    <div class="header-section animate-fade-in" v-if="!activePlan">
      <h1 class="page-title">选择连接世界的方案</h1>
      <p class="page-subtitle">多款全球高速订阅计划，满足您的任何设备连接需求</p>
      
      <div class="filter-tabs">
        <button
          v-for="mode in (['all', 'period', 'traffic'] as const)"
          :key="mode"
          class="tab"
          :class="{ active: filterMode === mode }"
          :disabled="loading"
          @click="setFilter(mode)"
        >
          {{ mode === 'all' ? '全部' : mode === 'period' ? '按周期' : '按流量' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>为您加载最新方案...</p>
    </div>

    <!-- 列表展示 -->
    <div class="plans-grid animate-fade-in delay-100" v-else-if="!activePlan && displayPlans.length">
      <div v-for="plan in displayPlans" :key="plan.id" class="plan-card" :class="{ 'featured': plan.name.includes('Pro') || plan.name.includes('高级') }">
        <div v-if="plan.name.includes('Pro') || plan.name.includes('高级')" class="recommended-badge">推荐方案</div>
        <h2 class="plan-name">{{ plan.name }}</h2>
        
        <div class="price-box">
          <span class="currency">¥</span>
          <span class="amount">{{ formatPrice(getPeriodPrice(plan)) }}</span>
          <span class="period">/ 起</span>
        </div>
        
        <div class="plan-features">
          <div class="feature-item">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
             {{ plan.transfer_enable || 0 }}GB 专属流量
          </div>
          <div class="feature-item">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
             多终端同步在线
          </div>
        </div>
        
        <button class="btn-purchase" @click="onBuy(plan)">立即订阅</button>
      </div>
    </div>

    <!-- 订单详情 -->
    <div v-else-if="activePlan" class="checkout animate-fade-in">
      <div class="checkout-layout">
        <!-- 核心商品信息 -->
        <div class="product-selection">
          <div class="selection-card">
            <div class="s-header">
              <button class="btn-back" @click="backToList">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                重新选择方案
              </button>
              <h2 class="s-title">{{ activePlan.name }}</h2>
            </div>
            
            <div class="period-selection shadow-inner">
               <div class="s-label">选择计费周期</div>
               <div class="period-grid">
                  <button 
                    v-for="opt in periodOptions" 
                    :key="opt.key"
                    class="period-item"
                    :class="{ active: selectedPeriod === opt.key }"
                    @click="selectPeriod(opt.key)"
                  >
                    <span class="p-label">{{ opt.label }}</span>
                    <span class="p-price">¥{{ formatPrice(opt.price) }}</span>
                  </button>
               </div>
            </div>
          </div>
        </div>

        <!-- 结算概览 -->
        <div class="order-summary">
          <div class="summary-card">
             <h3 class="sum-title">订单总结</h3>
             
             <div class="sum-item">
                <span class="sum-label">{{ activePlan.name }}</span>
                <span class="sum-val">¥ {{ formatPrice(currentPeriodPrice) }}</span>
             </div>
             <div class="sum-item sub-label">
                <span>周期系数</span>
                <span>{{ currentPeriodLabel }}</span>
             </div>
             
             <div class="sum-divider"></div>
             
             <div class="sum-total">
                <span class="l">实付金额</span>
                <div class="v">
                   <span class="c">¥</span>
                   <span class="a">{{ formatPrice(currentPeriodPrice) }}</span>
                </div>
             </div>
             
             <button class="btn-checkout-submit" @click="submitOrder" :disabled="submittingOrder">
                {{ submittingOrder ? '创建订单中...' : '提交订单' }}
             </button>
             <p class="safe-tip">支付由 SSL 安全加密连接保护</p>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state animate-fade-in">
       <div class="empty-illustration">
          <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="floating-icon"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
       </div>
       <h3>{{ filterMode === 'all' ? '暂无可用的订阅计划' : '当前分类下暂无方案' }}</h3>
       <p>{{ filterMode === 'all' ? '管理员正在准备更优质的连接方案，请稍后再回访。' : '目前没有符合该筛选条件的方案，您可以尝试切换其他分类或查看全部内容。' }}</p>
       <button v-if="filterMode !== 'all'" class="btn-primary-mini-outline" @click="setFilter('all')">返回查看全部方案</button>
    </div>

    <!-- 未完成订单弹窗 -->
    <transition name="modal">
      <div v-if="showUnfinishedOrderDialog" class="modal-mask" @click.self="closeUnfinishedDialog">
        <div class="modal">
          <div class="modal-body">
            <div class="error-icon">️⚠️</div>
            <h3>正在处理未完成的订单</h3>
            <p>您当前有一笔支付中的订单，请先完成操作或前往订单中心取消旧订单后再试。</p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeUnfinishedDialog">返回</button>
            <button class="btn-primary-mini" @click="goToOrders">查看未完成订单</button>
          </div>
        </div>
      </div>
    </transition>

    <p v-if="message" class="toast">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { fetchPlans, type Plan } from '../api/plan'
import { createOrder } from '../api/order'
import { useRoute, useRouter } from 'vue-router'

interface PeriodOption { key: string; label: string; price: number }
const route = useRoute(), router = useRouter()
const plans = ref<Plan[]>([]), message = ref(''), loading = ref(false), submittingOrder = ref(false)
const filterMode = ref<'all' | 'period' | 'traffic'>('all'), activePlan = ref<Plan | null>(null), selectedPeriod = ref<string | null>(null)
const showUnfinishedOrderDialog = ref(false)

const hasCyclePrice = (plan: Plan) => [plan.month_price, plan.quarter_price, plan.half_year_price, plan.year_price, plan.two_year_price, plan.three_year_price, plan.onetime_price].some(v => v != null && v > 0)
const planIdFromRoute = computed(() => {
  const idStr = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
  return idStr ? Number(idStr) : null
})

const displayPlans = computed(() => {
  const list = plans.value.slice()
  if (filterMode.value === 'period') return list.filter(p => hasCyclePrice(p)).sort((a,b) => (getPeriodPrice(a)||0) - (getPeriodPrice(b)||0))
  if (filterMode.value === 'traffic') return list.filter(p => (p.reset_price ?? 0) > 0 && !hasCyclePrice(p))
  return list
})

const periodOptions = computed<PeriodOption[]>(() => activePlan.value ? buildPeriodOptions(activePlan.value) : [])
const currentPeriodPrice = computed(() => (periodOptions.value.find(o => o.key === selectedPeriod.value)?.price || 0))
const currentPeriodLabel = computed(() => (periodOptions.value.find(o => o.key === selectedPeriod.value)?.label || ''))

function getPeriodPrice(plan: Plan): number | null {
  const candidates = [plan.month_price, plan.quarter_price, plan.half_year_price, plan.year_price, plan.two_year_price, plan.three_year_price, plan.onetime_price].filter((v): v is number => v != null && v > 0)
  return candidates.length ? Math.min(...candidates) : (plan.reset_price || null)
}

function buildPeriodOptions(p: Plan): PeriodOption[] {
  const config: { f: keyof Plan; k: string; l: string }[] = [
    { f: 'month_price', k: 'month_price', l: '月付' }, 
    { f: 'quarter_price', k: 'quarter_price', l: '季付' },
    { f: 'half_year_price', k: 'half_year_price', l: '半年付' }, 
    { f: 'year_price', k: 'year_price', l: '年付' },
    { f: 'two_year_price', k: 'two_year_price', l: '两年付' }, 
    { f: 'three_year_price', k: 'three_year_price', l: '三年付' },
    { f: 'onetime_price', k: 'onetime_price', l: '一次性' }, 
    { f: 'reset_price', k: 'reset_price', l: '流量包' }
  ]
  return config.map(c => ({ key: c.k, label: c.l, price: (p[c.f] as number) })).filter(o => o.price != null && o.price > 0)
}

async function loadPlans() {
  loading.value = true; try { plans.value = await fetchPlans() } catch (e) { message.value = '订阅方案同步失败' } finally { loading.value = false }
}

function syncActivePlanFromRoute() {
  const id = planIdFromRoute.value; if (!id || !plans.value.length) return
  const found = plans.value.find(p => p.id === id); if (found) { activePlan.value = found; const opts = buildPeriodOptions(found); selectedPeriod.value = opts.length ? opts[0].key : null }
}

const setFilter = (m: 'all'|'period'|'traffic') => filterMode.value = m
const selectPeriod = (k: string) => selectedPeriod.value = k
const backToList = () => { activePlan.value = null; if (route.params.id) router.replace('/plan') }

onMounted(async () => { await loadPlans(); syncActivePlanFromRoute() })
watch(planIdFromRoute, syncActivePlanFromRoute)
const formatPrice = (cents: number | null | undefined) => cents ? (cents / 100).toFixed(2) : '0.00'
const onBuy = (plan: Plan) => { if (!route.params.id) router.push(`/plan/${plan.id}`); activePlan.value = plan; const opts = buildPeriodOptions(plan); selectedPeriod.value = opts[0]?.key || null }

async function submitOrder() {
  if (!activePlan.value || !selectedPeriod.value) return
  submittingOrder.value = true; message.value = ''
  try { const tradeNo = await createOrder(activePlan.value.id, selectedPeriod.value); router.push(`/order/${tradeNo}`) } 
  catch (e: any) { 
    if (e.message?.includes('You have an unpaid or pending order') || e.message?.includes('未付款')) showUnfinishedOrderDialog.value = true
    else message.value = e.message || '订单创建失败'
  } finally { submittingOrder.value = false }
}

const closeUnfinishedDialog = () => showUnfinishedOrderDialog.value = false
const goToOrders = () => { showUnfinishedOrderDialog.value = false; router.push('/order') }
</script>

<style scoped>
.plan-page { max-width: 1100px; margin: 0 auto; }
.header-section { text-align: center; margin-bottom: 48px; }
.page-title { font-size: 36px; font-weight: 800; color: var(--text-main); margin-bottom: 12px; }
.page-subtitle { font-size: 16px; color: var(--text-muted); margin-bottom: 32px; }

.filter-tabs {
  display: inline-flex; background: white; padding: 6px; border-radius: 14px;
  box-shadow: var(--shadow-sm); border: 1px solid var(--border-color);
}
.tab {
  padding: 8px 20px; border: none; border-radius: 10px; background: none;
  font-size: 14px; font-weight: 700; color: var(--text-muted); cursor: pointer; transition: all 0.2s;
}
.tab.active { background: var(--text-main); color: white; }

.plans-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;
}

.plan-card {
  background: white; padding: 40px 32px; border-radius: 24px; border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm); position: relative; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.plan-card:hover { transform: translateY(-8px); border-color: var(--primary-color); box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.1); }
.plan-card.featured { border: 2px solid var(--primary-color); }

.recommended-badge {
  position: absolute; top: 16px; right: 24px; background: #eff6ff; color: var(--primary-color);
  padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 800;
}

.plan-name { font-size: 20px; font-weight: 800; color: var(--text-main); margin-bottom: 24px; }
.price-box { margin-bottom: 32px; display: flex; align-items: baseline; gap: 4px; }
.currency { font-size: 18px; font-weight: 700; color: var(--text-main); }
.amount { font-size: 44px; font-weight: 800; color: var(--text-main); letter-spacing: -2px; line-height: 1; }
.period { font-size: 14px; color: var(--text-muted); font-weight: 700; }

.plan-features { display: flex; flex-direction: column; gap: 16px; margin-bottom: 40px; }
.feature-item { display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 600; color: #475569; }
.feature-item svg { color: #10b981; }

.btn-purchase {
  width: 100%; padding: 14px; background: var(--text-main); color: white; border: none;
  border-radius: 14px; font-weight: 800; font-size: 15px; cursor: pointer; transition: all 0.2s;
}
.btn-purchase:hover { background: var(--primary-color); transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.4); }

.checkout-layout { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 4fr); gap: 28px; }

.selection-card { background: white; border-radius: 24px; border: 1px solid var(--border-color); padding: 32px; }
.btn-back { display: flex; align-items: center; gap: 6px; background: none; border: none; color: var(--text-muted); font-weight: 700; font-size: 13px; margin-bottom: 12px; }
.s-title { font-size: 24px; font-weight: 800; margin-bottom: 32px; }
.s-label { font-size: 13px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 16px; }

.period-grid { display: grid; gap: 12px; }
.period-item {
  display: flex; justify-content: space-between; align-items: center; padding: 20px 24px;
  border: 1px solid #f1f5f9; border-radius: 16px; background: #fcfdfe; transition: all 0.2s; cursor: pointer;
}
.period-item:hover { border-color: #cbd5e1; }
.period-item.active { border-color: var(--primary-color); background: #eff6ff; }
.p-label { font-weight: 800; color: var(--text-main); }
.p-price { font-weight: 700; color: var(--primary-color); font-size: 15px; }

.summary-card { background: #1e293b; color: #f8fafc; padding: 40px 32px; border-radius: 24px; position: sticky; top: 32px; }
.sum-title { font-size: 18px; font-weight: 800; margin-bottom: 32px; }
.sum-item { display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; margin-bottom: 12px; }
.sum-item.sub-label { color: #94a3b8; font-size: 12px; }
.sum-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 24px 0; }
.sum-total { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
.sum-total .l { font-weight: 800; color: #e2e8f0; }
.sum-total .v { color: #f8fafc; display: flex; align-items: baseline; gap: 4px; }
.sum-total .c { font-size: 18px; font-weight: 700; }
.sum-total .a { font-size: 32px; font-weight: 800; letter-spacing: -1px; }

.btn-checkout-submit {
  width: 100%; padding: 16px; background: var(--primary-color); color: white; border: none;
  border-radius: 16px; font-weight: 800; font-size: 16px; cursor: pointer;
}
.btn-checkout-submit:hover { background: #3b82f6; box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.4); }
.safe-tip { text-align: center; font-size: 12px; color: #64748b; margin-top: 20px; }

.modal-mask { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.modal { width: 400px; background: white; padding: 32px; border-radius: 24px; text-align: center; }
.error-icon { font-size: 40px; margin-bottom: 20px; }
.modal h3 { font-size: 18px; font-weight: 800; margin-bottom: 12px; }
.modal p { color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 32px; }
.modal-footer { display: flex; gap: 12px; }
.btn-secondary { flex: 1; padding: 12px; background: #f1f5f9; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; }
.btn-primary-mini { flex: 1.5; padding: 12px; background: var(--text-main); color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; }

.loading-state { padding: 100px 0; text-align: center; }
.spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
@keyframes spin { to { transform: rotate(360deg); } }

.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; opacity: 0; }
.delay-100 { animation-delay: 0.1s; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.empty-state {
  padding: 100px 40px; text-align: center; background: white; border-radius: 32px;
  border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  margin-top: 20px;
}
.empty-illustration {
  width: 120px; height: 120px; background: #f8fafc; border-radius: 40px;
  display: flex; align-items: center; justify-content: center; margin-bottom: 24px;
  color: #cbd5e1; transform: rotate(-5deg);
}
.empty-state h3 { font-size: 22px; font-weight: 800; color: var(--text-main); margin-bottom: 12px; }
.empty-state p { font-size: 15px; color: var(--text-muted); max-width: 440px; margin: 0 auto 32px; line-height: 1.6; }
.btn-primary-mini-outline { 
  padding: 10px 24px; background: white; border: 1.5px solid var(--border-color); 
  border-radius: 12px; font-weight: 700; color: var(--text-main); cursor: pointer; transition: all 0.2s;
}
.btn-primary-mini-outline:hover { border-color: var(--primary-color); color: var(--primary-color); }

.floating-icon { animation: float 4s ease-in-out infinite; }
@keyframes float { 0% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-15px) rotate(5deg); } 100% { transform: translateY(0px) rotate(0deg); } }

.toast { position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%); background: #1e293b; color: white; padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 700; z-index: 3000; }

@media (max-width: 900px) { .checkout-layout { grid-template-columns: 1fr; } .order-summary { position: static; } }
</style>
