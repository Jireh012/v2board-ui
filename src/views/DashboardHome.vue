<template>
  <div class="dashboard">
    <div class="dashboard-header animate-fade-in">
      <div class="header-main">
        <h1 class="page-title">仪表盘</h1>
        <p class="page-subtitle">欢迎回来，在这里管理您的节点订阅和连接状态。</p>
      </div>
      <div class="header-actions">
        <button class="btn-primary" @click="oneClickSubscribe">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          一键订阅
        </button>
      </div>
    </div>

    <!-- 公告通知 -->
    <div v-if="currentNotice" class="announce-card animate-fade-in delay-100" @click="openNoticeDetail">
      <div class="announce-icon-box">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      </div>
      <div class="announce-content">
        <span class="announce-tag">最新公告</span>
        <h2 class="announce-title">{{ currentNotice.title }}</h2>
      </div>
      <div class="announce-arrow">
        <span class="date">{{ formatTime(currentNotice.created_at) }}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      </div>
    </div>

    <div class="dashboard-grid animate-fade-in delay-200">
      <!-- 订阅主卡片 -->
      <section class="card sub-card">
        <div class="card-header">
          <h3 class="card-title">我的订阅</h3>
          <div class="status-dot" :class="{ expired: isExpired(subscribe?.expired_at ?? null) }"></div>
        </div>
        
        <div v-if="!subscribe" class="loading-state">
           <div class="spinner"></div>
           <p>同步订阅信息中...</p>
        </div>
        
        <div v-else class="card-body">
          <template v-if="subscribe.plan_id">
            <div class="sub-plan-info">
              <div class="plan-details">
                <div class="plan-name-row">
                  <h2 class="plan-name">{{ subscribe.plan?.name || '基础套餐' }}</h2>
                  <span class="plan-badge" :class="{ 'badge-expired': isExpired(subscribe.expired_at) }">
                    {{ isExpired(subscribe.expired_at) ? '已过期' : '使用中' }}
                  </span>
                </div>
                
                <p class="plan-expiry">
                  <template v-if="subscribe.expired_at === null">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    长期有效，永不过期
                  </template>
                  <template v-else>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                    到期时间：{{ formatDate(subscribe.expired_at) }}
                    <span class="days-pill" v-if="!isExpired(subscribe.expired_at)">
                      剩 {{ daysLeft(subscribe.expired_at) }} 天
                    </span>
                  </template>
                </p>
              </div>
            </div>

            <div class="usage-section">
              <div class="usage-header">
                <span class="usage-label">已用流量</span>
                <span class="usage-value">
                  <strong>{{ usagePercent }}%</strong>
                </span>
              </div>
              <div class="usage-progress-bg">
                <div 
                  class="usage-progress-bar" 
                  :class="progressBarClass"
                  :style="{ width: usagePercent + '%' }"
                ></div>
              </div>
              <div class="usage-footer">
                <div class="data-usage">
                  {{ formatTraffic(subscribe.u + subscribe.d) }} / {{ formatTraffic(subscribe.transfer_enable) }}
                </div>
                <div class="ip-count" v-if="subscribe.alive_ip != null">
                  在线设备: {{ subscribe.alive_ip }} / {{ deviceLimitDisplay }}
                </div>
              </div>
            </div>

            <div class="sub-actions">
              <button v-if="showResetButton" class="btn-sub-outline" @click="goPlan">
                重置流量包
              </button>
              <button class="btn-sub-primary" @click="goPlan">
                {{ isExpired(subscribe.expired_at) ? '立即续费' : '升级订阅' }}
              </button>
            </div>
          </template>
          
          <template v-else>
            <div class="empty-subscription" @click="goPlan">
              <div class="empty-icon-box">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              </div>
              <h3>暂无活跃订阅</h3>
              <p>点击这里选购适合您的流量套餐</p>
            </div>
          </template>
        </div>
      </section>

      <!-- 快捷工具栏 -->
      <section class="card shortcuts-card">
        <div class="card-header">
          <h3 class="card-title">快捷入口</h3>
        </div>
        <div class="card-body shortcuts">
          <div class="shortcut-grid">
            <button class="shortcut-btn" @click="goKnowledge">
              <div class="s-icon icon-blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a4 4 0 0 0-4-4H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a4 4 0 0 1 4-4h6z"/></svg>
              </div>
              <div class="s-content">
                <span class="s-title">查看教程</span>
                <span class="s-desc">帮助您快速上手</span>
              </div>
            </button>
            
            <button class="shortcut-btn" @click="oneClickSubscribe">
              <div class="s-icon icon-purple">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>
              </div>
              <div class="s-content">
                <span class="s-title">一键导入</span>
                <span class="s-desc">同步线路至客户端</span>
              </div>
            </button>

            <button class="shortcut-btn" @click="goPlan">
              <div class="s-icon icon-green">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              </div>
              <div class="s-content">
                <span class="s-title">{{ renewOrBuyText }}</span>
                <span class="s-desc">{{ renewOrBuyDesc }}</span>
              </div>
            </button>

            <button class="shortcut-btn" @click="goTicket">
              <div class="s-icon icon-orange">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
              </div>
              <div class="s-content">
                <span class="s-title">提交工单</span>
                <span class="s-desc">专业客服为您解惑</span>
              </div>
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- 订阅弹窗 -->
    <transition name="modal">
      <div v-if="showSubscribeModal" class="modal-mask" @click.self="closeSubscribeModal">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>快捷同步订阅</h3>
            <button class="close-btn" @click="closeSubscribeModal">×</button>
          </div>
          <div class="modal-body sub-options">
            <div class="sub-method" @click="copySubscribeUrl">
              <div class="m-icon">📋</div>
              <span>复制订阅地址</span>
            </div>
            <div class="sub-method" @click="openSubscribeQr">
              <div class="m-icon">🔳</div>
              <span>扫描二维码</span>
            </div>
            <div class="sub-divider">或一键导入到客户端</div>
            <div class="client-grid">
              <div class="client-item" @click="openClient(hiddifyLink)">
                <span class="c-icon">H</span><span>Hiddify</span>
              </div>
              <div class="client-item" @click="openClient(singboxLink)">
                <span class="c-icon">S</span><span>Sing-box</span>
              </div>
              <div class="client-item" @click="openClient(clashMetaLink)">
                <span class="c-icon">M</span><span>ClashMeta</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 公告弹窗 -->
    <transition name="modal">
      <div v-if="showNoticeDialog" class="modal-mask" @click.self="closeNoticeDialog">
        <div class="modal-dialog notice-modal">
          <div class="modal-header">
            <div class="modal-header-decoration">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
            <div class="modal-title-box">
              <span class="modal-tag">系统通知</span>
              <h3 class="modal-notice-title">{{ noticeDialogTitle }}</h3>
              <div class="notice-meta-line">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                发布于 {{ noticeDialogTime }}
              </div>
            </div>
            <button class="close-btn-round" @click="closeNoticeDialog">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          <div class="modal-body notice-body-scroll">
            <div v-if="loadingNoticeDetail" class="notice-loading">
              <div class="shimmer-line"></div>
              <div class="shimmer-line shorter"></div>
              <div class="shimmer-line"></div>
            </div>
            <div v-else class="notice-content-wrapper">
               <div class="notice-html-body prose" v-html="noticeDialogContent"></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-confirm-full" @click="closeNoticeDialog">已知晓</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getSubscribe, type SubscribeInfo } from '../api/user'
import { fetchNotices, getNoticeDetail, type Notice } from '../api/notice'

const router = useRouter()
const subscribe = ref<SubscribeInfo | null>(null)
const currentNotice = ref<Notice | null>(null)
const noticeDetail = ref<Notice | null>(null)
const showNoticeDialog = ref(false)
const loadingNoticeDetail = ref(false)
const showSubscribeModal = ref(false)
const showSubscribeQr = ref(false)

onMounted(async () => {
  try {
    subscribe.value = await getSubscribe()
  } catch { /* ignore */ }

  try {
    const list = await fetchNotices(1, 1)
    if (list.data?.length > 0) {
      currentNotice.value = list.data[0]
    }
  } catch { /* ignore */ }
})

const formatTime = (ts: number | null) => ts ? new Date(ts * 1000).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'
const formatDate = (ts: number | null) => ts ? new Date(ts * 1000).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-'
const isExpired = (ts: number | null) => ts ? ts <= Date.now() / 1000 : false

const usagePercent = computed(() => {
  if (!subscribe.value || !subscribe.value.transfer_enable) return 0
  const used = (subscribe.value.u || 0) + (subscribe.value.d || 0)
  const percent = (used / subscribe.value.transfer_enable) * 100
  return Math.min(100, Math.max(0, Math.round(percent * 10) / 10))
})

const progressBarClass = computed(() => {
  if (usagePercent.value >= 90) return 'bar-error'
  if (usagePercent.value >= 70) return 'bar-warning'
  return 'bar-success'
})

const deviceLimitDisplay = computed(() => subscribe.value?.device_limit == null ? '∞' : String(subscribe.value.device_limit))

const showResetButton = computed(() => {
  if (!subscribe.value?.plan?.reset_price) return false
  return usagePercent.value >= 80 && !isExpired(subscribe.value.expired_at)
})

const daysLeft = (ts: number) => {
  const diff = ts - Date.now() / 1000
  return diff > 0 ? Math.floor(diff / 86400) : 0
}

const formatTraffic = (bytes: number | null | undefined) => {
  if (!bytes) return '0 B'
  const gb = 1024 ** 3, mb = 1024 ** 2
  if (bytes >= gb) return (bytes / gb).toFixed(2) + ' GB'
  if (bytes >= mb) return (bytes / mb).toFixed(2) + ' MB'
  return (bytes / 1024).toFixed(2) + ' KB'
}

const goPlan = () => {
  const id = subscribe.value?.plan_id
  id ? router.push(`/plan/${id}`) : router.push('/plan')
}
const goTicket = () => router.push('/ticket')
const goKnowledge = () => router.push('/knowledge')
const oneClickSubscribe = () => {
  if (!subscribe.value?.subscribe_url) { goPlan(); return }
  showSubscribeModal.value = true
}

const renewOrBuyText = computed(() => subscribe.value?.plan_id ? '续费套餐' : '购买套餐')
const renewOrBuyDesc = computed(() => subscribe.value?.plan_id ? '延长订阅有效期' : '开启极速连接体验')
const subscribeUrl = computed(() => subscribe.value?.subscribe_url || '')

const copySubscribeUrl = () => {
  navigator.clipboard.writeText(subscribeUrl.value).then(() => {
    alert('复制成功') // In a real app we would use a toast
  })
}

const openSubscribeQr = () => { showSubscribeQr.value = true }
const closeSubscribeModal = () => { showSubscribeModal.value = false }

const hiddifyLink = computed(() => `hiddify://import/${subscribeUrl.value}&flag=sing#${document.title}`)
const singboxLink = computed(() => `sing-box://import-remote-profile?url=${encodeURIComponent(subscribeUrl.value)}#${document.title}`)
const clashMetaLink = computed(() => `clash://install-config?url=${encodeURIComponent(subscribeUrl.value + '&flag=meta')}&name=${encodeURIComponent(document.title)}`)

const openClient = (href: string) => { window.location.href = href }

async function openNoticeDetail() {
  if (!currentNotice.value) return
  showNoticeDialog.value = true
  if (noticeDetail.value?.id === currentNotice.value.id) return
  loadingNoticeDetail.value = true
  try { noticeDetail.value = await getNoticeDetail(currentNotice.value.id) }
  finally { loadingNoticeDetail.value = false }
}
const closeNoticeDialog = () => { showNoticeDialog.value = false }

const noticeDialogTitle = computed(() => (noticeDetail.value ?? currentNotice.value)?.title ?? '')
const noticeDialogTime = computed(() => {
  const n = noticeDetail.value ?? currentNotice.value
  return n ? formatTime(n.created_at) : ''
})
const noticeDialogContent = computed(() => (noticeDetail.value ?? currentNotice.value)?.content ?? '')
</script>

<style scoped>
.dashboard {
  max-width: 1100px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 800;
  color: var(--text-main);
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 16px;
  color: var(--text-muted);
  margin: 0;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: var(--primary-color);
  color: #ffffff;
  border-radius: 12px;
  border: none;
  font-weight: 700;
  box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.25);
  transition: transform 0.2s, background 0.2s;
}

.btn-primary:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

/* 公告卡片 */
.announce-card {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}

.announce-card:hover {
  border-color: #fde68a;
  background: #fffbeb;
  box-shadow: 0 12px 20px -5px rgba(251, 191, 36, 0.1);
}

.announce-icon-box {
  width: 44px;
  height: 44px;
  background: #fef3c7;
  color: #d97706;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.announce-content { flex: 1; }

.announce-tag {
  font-size: 10px;
  text-transform: uppercase;
  font-weight: 800;
  color: #d97706;
  background: #fef3c7;
  padding: 2px 6px;
  border-radius: 4px;
  margin-bottom: 4px;
  display: inline-block;
}

.announce-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
}

.announce-arrow {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #94a3b8;
}

.announce-arrow .date { font-size: 13px; font-weight: 500; }

/* Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 4fr);
  gap: 24px;
}

.card {
  background: #ffffff;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.card-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
}

.status-dot.expired {
  background: #ef4444;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15);
}

/* Subscription Content */
.sub-card .card-body { padding: 32px; }

.loading-state {
  padding: 60px 0;
  text-align: center;
  color: var(--text-muted);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

.plan-name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.plan-name { font-size: 24px; font-weight: 800; color: var(--text-main); }

.plan-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  background: #ecfdf5;
  color: #059669;
}

.plan-badge.badge-expired { background: #fef2f2; color: #ef4444; }

.plan-expiry {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 32px;
}

.days-pill {
  background: #eff6ff;
  color: var(--primary-color);
  padding: 2px 8px;
  border-radius: 99px;
  font-weight: 700;
  font-size: 12px;
}

.usage-section { margin-bottom: 32px; }

.usage-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.usage-label { font-size: 14px; font-weight: 700; color: var(--text-main); }

.usage-progress-bg {
  height: 12px;
  background: #f1f5f9;
  border-radius: 99px;
  overflow: hidden;
  margin-bottom: 12px;
}

.usage-progress-bar {
  height: 100%;
  border-radius: 99px;
  transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bar-success { background: linear-gradient(90deg, #10b981, #34d399); }
.bar-warning { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.bar-error { background: linear-gradient(90deg, #ef4444, #f87171); }

.usage-footer {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
}

.sub-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.btn-sub-primary, .btn-sub-outline {
  padding: 14px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}

.btn-sub-primary {
  background: var(--text-main);
  color: white;
  border: none;
}

.btn-sub-outline {
  background: white;
  color: var(--text-main);
  border: 1px solid #e2e8f0;
}

.btn-sub-outline:hover { background: #f8fafc; }

/* Empty State */
.empty-subscription {
  padding: 40px;
  text-align: center;
  border: 2px dashed #e2e8f0;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.empty-subscription:hover {
  background: #eff6ff;
  border-color: var(--primary-color);
}

.empty-icon-box {
  width: 64px;
  height: 64px;
  background: #f1f5f9;
  color: #94a3b8;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

/* Shortcuts */
.shortcut-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  padding: 20px;
}

.shortcut-btn {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  text-align: left;
  transition: all 0.2s;
}

.shortcut-btn:hover {
  transform: translateX(4px);
  border-color: #e2e8f0;
  box-shadow: var(--shadow-sm);
}

.s-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-blue { background: #eff6ff; color: #2563eb; }
.icon-purple { background: #f5f3ff; color: #7c3aed; }
.icon-green { background: #ecfdf5; color: #10b981; }
.icon-orange { background: #fff7ed; color: #f97316; }

.s-title { display: block; font-size: 15px; font-weight: 700; color: var(--text-main); }
.s-desc { font-size: 12px; color: var(--text-muted); }

/* Modal */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-dialog {
  width: 90%;
  max-width: 440px;
  background: white;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
}

.modal-header {
  padding: 24px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn { background: none; border: none; font-size: 28px; color: #94a3b8; }

.sub-options { padding: 24px; }

.sub-method {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 16px;
  margin-bottom: 12px;
  font-weight: 700;
  cursor: pointer;
}

.sub-method:hover { background: #eff6ff; color: var(--primary-color); }

.m-icon { font-size: 20px; }

.sub-divider {
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  margin: 20px 0;
  position: relative;
}

.sub-divider::before, .sub-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 25%;
  height: 1px;
  background: #e2e8f0;
}
.sub-divider::before { left: 0; }
.sub-divider::after { right: 0; }

.client-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.client-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  background: #f8fafc;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.client-item:hover { background: #f1f5f9; }

.c-icon {
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  box-shadow: var(--shadow-sm);
}

/* Notice Modal */
.notice-modal { max-width: 580px; border-radius: 32px; border: none; }
.notice-modal .modal-header { 
  padding: 40px 32px 24px; background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  position: relative; overflow: hidden; display: flex; align-items: flex-start;
}
.modal-header-decoration {
  position: absolute; top: -15px; right: -15px; width: 120px; height: 120px;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%);
  color: rgba(37, 99, 235, 0.1); display: flex; align-items: center; justify-content: center;
  transform: rotate(15deg); pointer-events: none;
}
.modal-title-box { flex: 1; position: relative; z-index: 1; }
.modal-tag { display: inline-block; font-size: 11px; font-weight: 800; background: var(--primary-color); color: white; padding: 4px 12px; border-radius: 8px; margin-bottom: 12px; letter-spacing: 0.05em; }
.modal-notice-title { font-size: 24px; font-weight: 850; line-height: 1.3; color: var(--text-main); margin: 0 0 12px; letter-spacing: -0.02em; }

.notice-meta-line { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #94a3b8; }

.close-btn-round {
  width: 36px; height: 36px; border-radius: 50%; border: 1px solid #e2e8f0; background: white; 
  color: #94a3b8; display: flex; align-items: center; justify-content: center; cursor: pointer;
  transition: all 0.2s; flex-shrink: 0; margin-left: 16px; position: relative; z-index: 1;
}
.close-btn-round:hover { background: #f1f5f9; color: var(--text-main); transform: rotate(90deg); }

.notice-body-scroll { padding: 0 32px 24px; }
.notice-content-wrapper {
  background: #fcfdfe; border-radius: 24px; padding: 28px; border: 1px solid #f1f5f9;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
}
.notice-html-body { 
  font-size: 15.5px; color: #334155; line-height: 1.85; overflow-y: auto; max-height: 45vh; 
  padding-right: 8px;
}
/* 自定义滚动条 */
.notice-html-body::-webkit-scrollbar { width: 4px; }
.notice-html-body::-webkit-scrollbar-track { background: transparent; }
.notice-html-body::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
.notice-html-body::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }

.notice-html-body :deep(p) { margin-bottom: 20px; }
.notice-html-body :deep(p:last-child) { margin-bottom: 0; }
.notice-html-body :deep(a) { color: var(--primary-color); font-weight: 800; text-decoration: none; border-bottom: 2px solid rgba(37, 99, 235, 0.1); transition: all 0.2s; }
.notice-html-body :deep(a:hover) { border-bottom-color: var(--primary-color); background: rgba(37, 99, 235, 0.05); }
.notice-html-body :deep(strong) { color: var(--text-main); font-weight: 800; }

.modal-footer { padding: 20px 24px 24px; border-top: 1px solid #f1f5f9; }
.btn-confirm-full { width: 100%; padding: 14px; background: var(--text-main); color: white; border: none; border-radius: 14px; font-weight: 800; font-size: 14px; cursor: pointer; transition: all 0.2s; }
.btn-confirm-full:hover { background: var(--primary-color); box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3); }

/* Shimmer Loading */
.shimmer-line { height: 16px; background: #f1f5f9; border-radius: 4px; margin-bottom: 12px; position: relative; overflow: hidden; }
.shimmer-line.shorter { width: 70%; }
.shimmer-line::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent); animation: shimmer 1.5s infinite; }
@keyframes shimmer { 100% { transform: translateX(100%); } }

/* Animations */
@keyframes spin { to { transform: rotate(360deg); } }
.animate-fade-in { animation: fadeIn 0.5s ease-out forwards; opacity: 0; }
.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Modal Animation */
.modal-enter-active, .modal-leave-active { transition: opacity 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal-dialog { animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }

@keyframes modalIn {
  from { transform: scale(0.9) translateY(20px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}

@media (max-width: 900px) {
  .dashboard-grid { grid-template-columns: 1fr; }
  .dashboard-header { flex-direction: column; align-items: flex-start; gap: 20px; }
}
</style>
