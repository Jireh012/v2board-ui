<template>
  <div class="order-detail-page">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>正在获取订单详情...</p>
    </div>
    <div v-else-if="order" class="layout animate-fade-in">
      <div class="left-content">
        <!-- 核心状态卡片 -->
        <div class="status-hero-card" :class="statusClass(order.status)">
           <div class="hero-icon">
              <svg v-if="order.status === 0" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <svg v-else-if="order.status === 3" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
           </div>
           <div class="hero-text">
              <div class="h-status">{{ statusLabel(order.status) }}</div>
              <div class="h-order-no code-font">{{ order.trade_no }}</div>
           </div>
           <div class="hero-action" v-if="order.status === 0">
              <button class="btn-cancel-light" :disabled="cancelling" @click="cancel">
                 {{ cancelling ? '撤销中' : '撤销订单' }}
              </button>
           </div>
        </div>

        <!-- 详细信息板块 -->
        <div class="info-sections">
           <section class="info-card">
              <h3 class="section-title">所购服务内容</h3>
              <div class="product-info-box">
                 <div class="p-main">
                    <div class="p-name">{{ order.plan?.name || '基础订阅' }}</div>
                    <div class="p-details">
                       <span>{{ periodLabel(order.period) }}</span>
                       <span class="dot">·</span>
                       <span>包含 {{ formatTraffic(order.plan?.transfer_enable) }} 流量</span>
                    </div>
                 </div>
                 <div class="p-price">
                    <span class="p-cur">¥</span>{{ (order.total_amount / 100).toFixed(2) }}
                 </div>
              </div>
           </section>

           <section class="info-card" v-if="order.status === 0">
              <h3 class="section-title">结算与支付方式</h3>
              <div class="payment-methods-grid">
                 <div 
                   v-for="m in methods" 
                   :key="m.id" 
                   class="method-item"
                   :class="{ active: selectedMethodId === m.id }"
                   @click="selectedMethodId = m.id"
                 >
                    <div class="method-radio"></div>
                    <div class="method-name">{{ m.name }}</div>
                 </div>
              </div>
           </section>

           <section class="info-card">
              <h3 class="section-title">存证记录</h3>
              <div class="record-grid">
                 <div class="record-item">
                    <div class="r-label">创建时间</div>
                    <div class="r-value">{{ formatTime(order.created_at) }}</div>
                 </div>
                 <div class="record-item">
                    <div class="r-label">支付单号</div>
                    <div class="r-value code-font">{{ order.trade_no }}</div>
                 </div>
                 <div class="record-item" v-if="order.status === 3">
                    <div class="r-label">生效状态</div>
                    <div class="r-value success-text">已扣款并开通</div>
                 </div>
              </div>
           </section>
        </div>
      </div>

      <div class="right-sidebar">
         <div class="sticky-bill">
            <div class="bill-header">账单结算</div>
            <div class="bill-content">
               <div class="bill-row">
                  <span>{{ order.plan?.name || '订阅服务' }}</span>
                  <span>¥ {{ (order.total_amount / 100).toFixed(2) }}</span>
               </div>
               <div class="bill-row sub">
                  <span>周期: {{ periodLabel(order.period) }}</span>
                  <span>-</span>
               </div>
               <div class="bill-divider"></div>
               <div class="bill-total">
                  <div class="total-label">实付总额</div>
                  <div class="total-amount">
                     <span class="cur">¥</span>{{ (order.total_amount / 100).toFixed(2) }}
                  </div>
               </div>
            </div>
            
            <button
              v-if="order.status === 0"
              class="btn-checkout-primary"
              :disabled="payDisabled"
              @click="pay"
            >
              {{ payButtonText }}
            </button>
            <div v-else class="order-final-status" :class="statusClass(order.status)">
               {{ order.status === 3 ? '订单已结算' : '订单已失效' }}
            </div>
            
            <div class="bill-footer">
               <p>订单有效期内未支付将自动关闭。如有疑问请咨询在线客服。</p>
            </div>
         </div>
         <p v-if="message" class="error-tip">{{ message }}</p>
      </div>
    </div>
    <div v-else class="empty-state">
       <div class="empty-icon">🏮</div>
       <h3>找不到该订单</h3>
       <p>该订单可能不存在或已被归档，请返回列表查看。</p>
       <button class="btn-primary-mini" @click="$router.push('/order')">返回订单列表</button>
    </div>

    <!-- 支付弹窗 -->
    <transition name="fade">
      <div v-if="qrcodeVisible" class="pay-modal-mask" @click.self="closeQrcode">
        <div class="pay-modal">
          <div class="pay-modal-header">
             <h4>扫码完成支付</h4>
             <button class="p-close" @click="closeQrcode">×</button>
          </div>
          <div class="qr-box">
             <img :src="qrcodeUrl!" alt="QR" />
             <div class="qr-status">
                <div class="qr-spinner"></div>
                等待支付确认...
             </div>
          </div>
          <div class="pay-modal-footer">
             <p>请使用对应支付 App 扫描上方二维码</p>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  cancelOrder, checkout, checkOrderStatus, fetchOrderDetail, getPaymentMethods,
  type OrderDetail, type PaymentMethod
} from '../api/order'

const route = useRoute()
const order = ref<OrderDetail | null>(null), methods = ref<PaymentMethod[]>([])
const selectedMethodId = ref<number | null>(null), loading = ref(false), cancelling = ref(false)
const paying = ref(false), message = ref(''), qrcodeVisible = ref(false), qrcodeUrl = ref<string | null>(null)
let checkTimer: number | null = null

const payDisabled = computed(() => !order.value || order.value.status !== 0 || !selectedMethodId.value || paying.value)
const payButtonText = computed(() => paying.value ? '订单处理中...' : '提交订单支付')

const formatTime = (ts?: number | null) => ts ? new Date(ts * 1000).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'
const formatTraffic = (gb?: number | null) => gb ? `${gb.toFixed(0)} GB` : '-'

const periodLabel = (p?: string | null) => {
  const map: any = { month_price: '月付', quarter_price: '季付', half_year_price: '半年付', year_price: '年付', two_year_price: '两年付', three_year_price: '三年付', onetime_price: '一次性', reset_price: '流量包', deposit: '充值' }
  return map[p || ''] || p || '-'
}

const statusLabel = (s?: number) => ['等待支付', '系统开通中', '已撤销订单', '交易已完成'][s!] || '未知'
const statusClass = (s?: number) => ['s-pending', 's-processing', 's-cancelled', 's-success'][s!] || ''

async function loadAll() {
  const tradeNo = route.params.tradeNo as string
  if (!tradeNo) { message.value = '无效订单号'; return }
  loading.value = true; try {
    order.value = await fetchOrderDetail(tradeNo); methods.value = await getPaymentMethods()
    if (methods.value.length) selectedMethodId.value = methods.value[0].id
  } catch (e: any) { message.value = e.message || '加载失败' } finally { loading.value = false }
}

async function cancel() {
  if (!order.value || !confirm('确认撤销？')) return
  cancelling.value = true; try { await cancelOrder(order.value.trade_no); await loadAll() }
  finally { cancelling.value = false }
}

async function pay() {
  if (!order.value || !selectedMethodId.value) return
  paying.value = true; message.value = ''
  try {
    const res = await checkout(order.value.trade_no, selectedMethodId.value) as any
    if (res.type === 0) {
      const content = typeof res.data === 'string' ? res.data : JSON.stringify(res.data?.payload ?? res.data)
      qrcodeUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(content)}`
      qrcodeVisible.value = true; startCheck()
    } else if (res.type === 1 && typeof res.data === 'string') { window.location.href = res.data }
  } catch (e: any) { message.value = e.message || '支付失败' } finally { paying.value = false }
}

function startCheck() {
  stopCheck(); if (!order.value) return
  const tradeNo = order.value.trade_no
  const loop = async () => {
    try { const status = await checkOrderStatus(tradeNo); if (status !== 0) { stopCheck(); qrcodeVisible.value = false; await loadAll(); return } } catch {}
    checkTimer = window.setTimeout(loop, 3000)
  }
  checkTimer = window.setTimeout(loop, 3000)
}
function stopCheck() { if (checkTimer) { clearTimeout(checkTimer); checkTimer = null } }
function closeQrcode() { qrcodeVisible.value = false; stopCheck() }

onMounted(loadAll); onUnmounted(stopCheck)
</script>

<style scoped>
.order-detail-page { max-width: 1100px; margin: 0 auto; }
.layout { display: grid; grid-template-columns: 1fr 340px; gap: 32px; }

.status-hero-card {
  background: white; border-radius: 24px; padding: 32px; border: 1px solid var(--border-color);
  display: flex; align-items: center; gap: 24px; margin-bottom: 32px; box-shadow: var(--shadow-sm);
}
.hero-icon { width: 64px; height: 64px; border-radius: 20px; display: flex; align-items: center; justify-content: center; }
.s-pending .hero-icon { background: #fff7ed; color: #f97316; }
.s-success .hero-icon { background: #ecfdf5; color: #10b981; }
.s-cancelled .hero-icon { background: #f1f5f9; color: #94a3b8; }

.hero-text { flex: 1; }
.h-status { font-size: 24px; font-weight: 800; color: var(--text-main); margin-bottom: 4px; }
.h-order-no { font-size: 13px; font-weight: 700; color: var(--text-muted); opacity: 0.7; }

.btn-cancel-light { padding: 8px 16px; background: #fff1f2; color: #ef4444; border: none; border-radius: 10px; font-size: 13px; font-weight: 800; cursor: pointer; }

.info-sections { display: flex; flex-direction: column; gap: 24px; }
.info-card { background: white; border-radius: 20px; padding: 24px; border: 1px solid var(--border-color); }
.section-title { font-size: 14px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 20px; }

.product-info-box { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 20px; border-radius: 16px; }
.p-name { font-size: 18px; font-weight: 800; color: var(--text-main); margin-bottom: 4px; }
.p-details { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--text-muted); }
.p-price { font-size: 24px; font-weight: 800; color: var(--text-main); }
.p-cur { font-size: 14px; margin-right: 2px; }

.payment-methods-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.method-item {
  display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: 1px solid var(--border-color); border-radius: 12px; cursor: pointer; transition: all 0.2s;
}
.method-item:hover { border-color: #cbd5e1; }
.method-item.active { border-color: var(--primary-color); background: #eff6ff; }
.method-radio { width: 14px; height: 14px; border: 2px solid var(--border-color); border-radius: 50%; }
.method-item.active .method-radio { border-color: var(--primary-color); background: var(--primary-color); box-shadow: inset 0 0 0 3px white; }
.method-name { font-size: 14px; font-weight: 700; color: var(--text-main); }

.record-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
.r-label { font-size: 12px; font-weight: 700; color: var(--text-muted); margin-bottom: 4px; }
.r-value { font-size: 14px; font-weight: 700; color: var(--text-main); }
.success-text { color: #10b981; }

.right-sidebar { position: sticky; top: 24px; }
.sticky-bill { background: #1e293b; color: white; border-radius: 24px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2); }
.bill-header { font-size: 18px; font-weight: 800; margin-bottom: 24px; }
.bill-content { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
.bill-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: 600; }
.bill-row.sub { font-size: 12px; color: #94a3b8; }
.bill-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 8px 0; }
.bill-total { display: flex; justify-content: space-between; align-items: flex-end; }
.total-label { font-size: 13px; color: #94a3b8; font-weight: 700; margin-bottom: 4px; }
.total-amount { font-size: 32px; font-weight: 800; letter-spacing: -1px; }
.total-amount .cur { font-size: 16px; margin-right: 2px; }

.btn-checkout-primary {
  width: 100%; padding: 14px; background: var(--primary-color); color: white; border: none; border-radius: 14px;
  font-size: 15px; font-weight: 700; cursor: pointer; transition: transform 0.2s;
}
.btn-checkout-primary:hover { transform: translateY(-2px); }
.btn-checkout-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.order-final-status { text-align: center; padding: 12px; border-radius: 12px; font-weight: 800; font-size: 14px; }
.order-final-status.s-success { background: rgba(16, 185, 129, 0.15); color: #10b981; }
.order-final-status.s-cancelled { background: rgba(241, 245, 249, 0.15); color: #94a3b8; }

.bill-footer { font-size: 11px; color: #64748b; margin-top: 20px; line-height: 1.6; }
.error-tip { margin-top: 12px; font-size: 13px; color: #ef4444; font-weight: 700; text-align: center; }

/* Pay Modal */
.pay-modal-mask { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 3000; }
.pay-modal { background: white; border-radius: 24px; padding: 32px; width: 320px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
.pay-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.pay-modal-header h4 { margin: 0; font-size: 18px; font-weight: 800; color: var(--text-main); }
.p-close { background: none; border: none; font-size: 24px; color: #94a3b8; cursor: pointer; }

.qr-box { margin-bottom: 24px; }
.qr-box img { width: 220px; height: 220px; border-radius: 12px; border: 1px solid #f1f5f9; padding: 10px; margin-bottom: 16px; }
.qr-status { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; font-weight: 700; color: #64748b; }
.qr-spinner { width: 14px; height: 14px; border: 2px solid #e2e8f0; border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; }

.pay-modal-footer p { font-size: 12px; color: #94a3b8; font-weight: 600; }

.loading-state { padding: 100px 0; text-align: center; }
.spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
@keyframes spin { to { transform: rotate(360deg); } }

.code-font { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; opacity: 0; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 900px) { .layout { grid-template-columns: 1fr; } .right-sidebar { position: static; } }
</style>
