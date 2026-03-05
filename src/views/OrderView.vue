<template>
  <div class="order-page">
    <div class="header-section animate-fade-in">
      <div class="header-main">
        <h1 class="page-title">我的订单</h1>
        <p class="page-subtitle">管理您的历史账单，查看订阅续费与充值记录。</p>
      </div>
      <div class="header-actions">
        <button class="btn-refresh-premium" :disabled="loading" @click="load">
          <svg :class="{ 'spin': loading }" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
          {{ loading ? '加载中' : '刷新列表' }}
        </button>
      </div>
    </div>

    <!-- 过滤器集成在卡片外 -->
    <div class="filter-bar animate-fade-in delay-100">
      <div class="segment-control">
        <button 
          v-for="f in (['all', 'pending', 'finished'] as StatusFilter[])" 
          :key="f"
          class="segment-item"
          :class="{ active: statusFilter === f }"
          @click="setStatusFilter(f)"
        >
          {{ f === 'all' ? '全部项目' : f === 'pending' ? '待支付' : '已完成' }}
        </button>
      </div>
    </div>

    <div v-if="loading && !orders.length" class="loading-state">
      <div class="spinner"></div>
      <p>为您调取账单记录...</p>
    </div>

    <div v-else-if="displayOrders.length" class="orders-list animate-fade-in delay-200">
      <div v-for="o in displayOrders" :key="o.trade_no" class="order-item-card">
         <div class="order-main">
            <div class="order-info">
               <div class="order-no code-font" @click="openDetail(o.trade_no)">{{ o.trade_no }}</div>
               <div class="order-meta">
                  <span class="period">{{ periodLabel(o.period) }}</span>
                  <span class="dot">·</span>
                  <span class="time">{{ formatTime(o.created_at) }}</span>
               </div>
            </div>
            
            <div class="order-status-box">
               <div class="status-badge" :class="statusBadgeClass(o.status)">
                  {{ statusLabel(o.status) }}
               </div>
            </div>

            <div class="order-amount">
               <span class="currency">¥</span>
               <span class="amount">{{ (o.total_amount / 100).toFixed(2) }}</span>
            </div>

            <div class="order-actions">
               <button class="btn-action-view" @click="openDetail(o.trade_no)">
                  {{ o.status === 0 ? '完成支付' : '详情' }}
               </button>
               <button v-if="o.status === 0" class="btn-action-cancel" @click="cancel(o.trade_no)" :disabled="cancelling === o.trade_no">
                  <svg v-if="cancelling !== o.trade_no" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  {{ cancelling === o.trade_no ? '取消中' : '取消' }}
               </button>
            </div>
         </div>
      </div>
    </div>

    <div v-else class="empty-state">
       <div class="empty-icon">💸</div>
       <h3>暂无账单记录</h3>
       <p>目前没有符合条件的订单，快去开启您的第一份订阅吧。</p>
       <button class="btn-primary-mini" @click="$router.push('/plan')">选购订阅计划</button>
    </div>

    <p v-if="message" class="toast" :class="{ error: isError }">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { cancelOrder, fetchOrders, type OrderListItem } from '../api/order'

type StatusFilter = 'all' | 'pending' | 'finished'
const router = useRouter()
const orders = ref<OrderListItem[]>([])
const loading = ref(false)
const statusFilter = ref<StatusFilter>('all')
const cancelling = ref<string | null>(null)
const message = ref('')
const isError = ref(false)

const displayOrders = computed(() => {
  if (statusFilter.value === 'pending') return orders.value.filter(o => o.status === 0)
  if (statusFilter.value === 'finished') return orders.value.filter(o => o.status === 3)
  return orders.value
})

async function load() {
  loading.value = true
  try { orders.value = await fetchOrders() }
  catch (e) { orders.value = [] }
  finally { loading.value = false }
}

function setStatusFilter(f: StatusFilter) { statusFilter.value = f }

function formatTime(ts: number) {
  const d = new Date(ts * 1000)
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function periodLabel(p: string | null) {
  const map: any = { month_price: '月付', quarter_price: '季付', half_year_price: '半年付', year_price: '年付', two_year_price: '两年付', three_year_price: '三年付', onetime_price: '一次性', reset_price: '流量包', deposit: '钱包充值' }
  return map[p || ''] || p || '-'
}

function statusLabel(s: number) {
  return ['待支付', '开通中', '已取消', '已完成'][s] || '未知'
}

function statusBadgeClass(s: number) {
  return ['badge-pending', 'badge-processing', 'badge-cancelled', 'badge-success'][s] || ''
}

const openDetail = (no: string) => router.push(`/order/${no}`)

async function cancel(no: string) {
  if (!confirm('确认取消该订单？')) return
  cancelling.value = no
  try {
    await cancelOrder(no)
    await load()
    message.value = '订单已撤销'; isError.value = false
  } catch (e: any) {
    message.value = e.message || '取消失败'; isError.value = true
  } finally {
    cancelling.value = null
    setTimeout(() => message.value = '', 3000)
  }
}

onMounted(load)
</script>

<style scoped>
.order-page { max-width: 1000px; margin: 0 auto; }
.header-section { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
.page-title { font-size: 32px; font-weight: 800; color: var(--text-main); margin-bottom: 8px; }
.page-subtitle { font-size: 16px; color: var(--text-muted); margin: 0; }

.btn-refresh-premium {
  display: flex; align-items: center; gap: 8px; padding: 10px 20px;
  background: white; border: 1px solid var(--border-color); border-radius: 12px;
  font-size: 14px; font-weight: 700; color: var(--text-main); cursor: pointer;
}
.btn-refresh-premium:hover { background: #f8fafc; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.filter-bar { margin-bottom: 24px; }
.segment-control {
  display: inline-flex; background: #f1f5f9; padding: 4px; border-radius: 14px;
}
.segment-item {
  padding: 8px 24px; border: none; border-radius: 10px; background: none;
  font-size: 14px; font-weight: 700; color: #64748b; cursor: pointer; transition: all 0.2s;
}
.segment-item.active { background: white; color: var(--text-main); box-shadow: var(--shadow-sm); }

.orders-list { display: flex; flex-direction: column; gap: 16px; }

.order-item-card {
  background: white; border-radius: 20px; border: 1px solid var(--border-color);
  padding: 24px; box-shadow: var(--shadow-sm); transition: transform 0.2s, box-shadow 0.2s;
}
.order-item-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: #cbd5e1; }

.order-main { display: flex; align-items: center; gap: 24px; }

.order-info { flex: 1; min-width: 0; }
.order-no { font-size: 14px; font-weight: 700; color: var(--text-main); cursor: pointer; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; }
.order-no:hover { color: var(--primary-color); }
.order-meta { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-muted); font-weight: 600; }
.dot { opacity: 0.3; }

.order-status-box { width: 100px; text-align: center; }
.status-badge {
  display: inline-block; padding: 4px 12px; border-radius: 8px; font-size: 12px; font-weight: 800;
}
.badge-pending { background: #fef3c7; color: #d97706; }
.badge-processing { background: #eff6ff; color: #2563eb; }
.badge-success { background: #ecfdf5; color: #10b981; }
.badge-cancelled { background: #f1f5f9; color: #94a3b8; }

.order-amount { width: 140px; text-align: right; }
.currency { font-size: 15px; font-weight: 700; color: var(--text-main); margin-right: 4px; }
.amount { font-size: 24px; font-weight: 800; color: var(--text-main); letter-spacing: -1px; }

.order-actions { display: flex; gap: 8px; margin-left: 20px; }
.btn-action-view {
  padding: 8px 16px; background: #eff6ff; color: var(--primary-color);
  border: none; border-radius: 10px; font-size: 13px; font-weight: 800; cursor: pointer;
}
.btn-action-cancel {
  display: flex; align-items: center; gap: 4px; padding: 8px 16px; background: #fff1f2; color: #ef4444;
  border: none; border-radius: 10px; font-size: 13px; font-weight: 800; cursor: pointer;
}

.toast { position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%); background: #1e293b; color: white; padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 700; z-index: 3000; }
.toast.error { background: #ef4444; }

.loading-state { padding: 100px 0; text-align: center; color: var(--text-muted); }
.spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }

.empty-state { padding: 80px 40px; text-align: center; background: white; border-radius: 24px; border: 2px dashed var(--border-color); }
.empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
.btn-primary-mini { margin-top: 16px; padding: 10px 24px; background: var(--text-main); color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; }

.code-font { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; opacity: 0; }
.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 800px) {
  .order-main { flex-direction: column; align-items: flex-start; gap: 16px; }
  .order-status-box, .order-amount { width: auto; text-align: left; }
  .order-actions { margin-left: 0; }
}
</style>
