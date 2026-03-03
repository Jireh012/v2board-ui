<template>
  <div class="dashboard">
    <section class="announce" v-if="currentNotice" @click="openNoticeDetail">
      <div class="announce-label">公告</div>
      <div class="announce-body">
        <h2>{{ currentNotice.title }}</h2>
      </div>
      <div class="announce-meta">
        <span class="announce-date">{{ formatTime(currentNotice.created_at) }}</span>
        <span class="announce-more">查看详情</span>
      </div>
    </section>

    <section class="main-grid">
      <div class="column column-main">
        <div class="card">
          <div class="card-header">
            <h3>我的订阅</h3>
          </div>
          <div class="card-body" v-if="!subscribe">
            正在加载订阅信息...
          </div>
          <div class="card-body" v-else>
            <template v-if="subscribe.email">
              <template v-if="subscribe.plan_id">
                <div class="sub-main">
                  <h3 class="sub-plan-name">
                    {{ subscribe.plan?.name || '未命名套餐' }}
                  </h3>
                  <p class="sub-meta" v-if="subscribe.expired_at === null">
                    该订阅长期有效
                  </p>
                  <p class="sub-meta" v-else>
                    <template v-if="isExpired(subscribe.expired_at)">
                      <span class="sub-expired">已过期</span>
                    </template>
                    <template v-else>
                      于 {{ formatDate(subscribe.expired_at) }} 到期，距离到期还有
                      {{ daysLeft(subscribe.expired_at) }} 天。
                      <template v-if="subscribe.reset_day !== null">
                        <template v-if="subscribe.reset_day !== 0">
                          已用流量将在 {{ subscribe.reset_day }} 日后重置
                        </template>
                        <template v-else>
                          已用流量已在今日重置
                        </template>
                      </template>
                    </template>
                  </p>

                  <div class="sub-progress">
                    <div class="progress">
                      <div
                        class="progress-bar"
                        :class="progressBarClass"
                        :style="{ width: usagePercent + '%' }"
                      ></div>
                    </div>
                    <p class="progress-text">
                      <span class="progress-main">
                        已用 {{ formatTraffic(subscribe.u + subscribe.d) }} /
                        总计 {{ formatTraffic(subscribe.transfer_enable) }}
                      </span>
                      <span class="progress-devices">
                        在线设备 {{ subscribe.alive_ip }}/{{
                          deviceLimitDisplay
                        }}
                      </span>
                    </p>
                  </div>

                  <div class="sub-actions">
                    <button
                      v-if="showResetButton"
                      type="button"
                      class="btn-sub"
                      @click="goPlan"
                    >
                      购买流量重置包
                    </button>
                    <button
                      v-if="showNewPeriodButton"
                      type="button"
                      class="btn-sub"
                      @click="goPlan"
                    >
                      提前开启流量周期
                    </button>
                    <button
                      v-if="isExpired(subscribe.expired_at)"
                      type="button"
                      class="btn-sub"
                      @click="goPlan"
                    >
                      {{ subscribe.plan_id ? '续费订阅' : '购买订阅' }}
                    </button>
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="sub-empty" @click="goPlan">
                  <div class="sub-empty-icon">＋</div>
                  <div class="sub-empty-text">购买订阅</div>
                </div>
              </template>
            </template>
          </div>
        </div>

      </div>

      <aside class="column column-side">
        <div class="card">
          <div class="card-header">
            <h3>捷径</h3>
          </div>
          <div class="card-body shortcuts">
            <button class="shortcut-item" @click="goKnowledge">
              <span class="shortcut-title">查看教程</span>
              <span class="shortcut-desc">
                学习如何使用当前站点
              </span>
            </button>
            <button class="shortcut-item" @click="oneClickSubscribe">
              <span class="shortcut-title">一键订阅</span>
              <span class="shortcut-desc">
                快速将节点导入对应客户端进行使用
              </span>
            </button>
            <button class="shortcut-item" @click="goPlan">
              <span class="shortcut-title">{{ renewOrBuyText }}</span>
              <span class="shortcut-desc">{{ renewOrBuyDesc }}</span>
            </button>
            <button class="shortcut-item" @click="goTicket">
              <span class="shortcut-title">遇到问题</span>
              <span class="shortcut-desc">
                遇到问题可以通过工单与我们沟通
              </span>
            </button>
          </div>
        </div>
      </aside>
    </section>

    <div
      v-if="showSubscribeModal && subscribeUrl"
      class="subscribe-mask"
      @click.self="closeSubscribeModal"
    >
      <div class="subscribe-dialog">
        <button class="subscribe-item" @click="copySubscribeUrl">
          <span class="subscribe-icon">📋</span>
          <span class="subscribe-text">复制订阅地址</span>
        </button>
        <button class="subscribe-item" @click="openSubscribeQr">
          <span class="subscribe-icon">🔳</span>
          <span class="subscribe-text">扫描二维码订阅</span>
        </button>
        <button class="subscribe-item" @click="openClient(hiddifyLink)">
          <span class="subscribe-icon">H</span>
          <span class="subscribe-text">导入到 Hiddify</span>
        </button>
        <button class="subscribe-item" @click="openClient(singboxLink)">
          <span class="subscribe-icon">S</span>
          <span class="subscribe-text">导入到 Sing-box</span>
        </button>
        <button class="subscribe-item" @click="openClient(clashMetaLink)">
          <span class="subscribe-icon">M</span>
          <span class="subscribe-text">导入到 ClashMeta</span>
        </button>
        <div class="subscribe-footer">
          <button class="subscribe-help" @click="goKnowledge">
            不会使用，查看使用教程
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showSubscribeQr && subscribeUrl"
      class="subscribe-mask"
      @click.self="closeSubscribeQr"
    >
      <div class="subscribe-dialog qr-dialog">
        <img
          class="subscribe-qr"
          :src="`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(subscribeUrl)}`"
          alt="订阅二维码"
        />
        <div class="subscribe-qr-tip">
          使用支持链接导入的客户端扫描即可订阅
        </div>
        <div class="subscribe-footer">
          <button class="subscribe-help" @click="closeSubscribeQr">关闭</button>
        </div>
      </div>
    </div>

    <div
      v-if="showNoticeDialog && (currentNotice || noticeDetail)"
      class="notice-dialog-mask"
      @click.self="closeNoticeDialog"
    >
      <div class="notice-dialog">
        <h2 class="notice-dialog-title">{{ noticeDialogTitle }}</h2>
        <div class="notice-dialog-meta">{{ noticeDialogTime }}</div>
        <div v-if="loadingNoticeDetail" class="notice-dialog-body">
          正在加载公告内容...
        </div>
        <div
          v-else
          class="notice-dialog-body"
          v-html="noticeDialogContent"
        ></div>
        <div class="notice-dialog-footer">
          <button type="button" class="notice-dialog-close" @click="closeNoticeDialog">
            关闭
          </button>
        </div>
      </div>
    </div>
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
  } catch {
    // 忽略订阅信息失败，UI 中会显示加载中文案
  }

  try {
    const list = await fetchNotices(1, 1)
    if (list.data && list.data.length > 0) {
      currentNotice.value = list.data[0]
    }
  } catch {
    // 没有公告时直接不展示公告区域
  }
})

function formatTime(ts: number | null): string {
  if (!ts) return '-'
  const d = new Date(ts * 1000)
  return d.toLocaleString()
}

function formatDate(ts: number | null): string {
  if (!ts) return '-'
  const d = new Date(ts * 1000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}/${m}/${day}`
}

function isExpired(ts: number | null): boolean {
  if (!ts) return false
  const nowSec = Date.now() / 1000
  return ts <= nowSec
}

const usagePercent = computed(() => {
  if (!subscribe.value) return 0
  const used = (subscribe.value.u || 0) + (subscribe.value.d || 0)
  const total = subscribe.value.transfer_enable || 0
  if (!total || total <= 0) return 0
  const percent = (used / total) * 100
  return Math.max(0, Math.min(100, Math.round(percent * 100) / 100))
})

const progressBarClass = computed(() => {
  const y = usagePercent.value
  if (y >= 100) return 'progress-bar-danger'
  if (y >= 80) return 'progress-bar-warning'
  return 'progress-bar-success'
})

const deviceLimitDisplay = computed(() => {
  if (!subscribe.value) return '-'
  const limit = subscribe.value.device_limit
  return limit == null ? '∞' : String(limit)
})

const showResetButton = computed(() => {
  if (!subscribe.value) return false
  const y = usagePercent.value
  const expired = isExpired(subscribe.value.expired_at)
  const hasResetPrice = !!subscribe.value.plan && !!subscribe.value.plan.reset_price
  return y >= 80 && !expired && hasResetPrice
})

const showNewPeriodButton = computed(() => {
  if (!subscribe.value) return false
  const y = usagePercent.value
  const expired = isExpired(subscribe.value.expired_at)
  return !!subscribe.value.allow_new_period && y >= 100 && !expired
})

function daysLeft(ts: number | null): number {
  if (!ts) return 0
  const nowSec = Math.floor(Date.now() / 1000)
  const diff = ts - nowSec
  return diff > 0 ? Math.floor(diff / 86400) : 0
}

function formatTraffic(bytes: number | null | undefined): string {
  if (!bytes) return '0 B'
  const gb = 1024 * 1024 * 1024
  const mb = 1024 * 1024
  if (bytes >= gb) return (bytes / gb).toFixed(2) + ' GB'
  if (bytes >= mb) return (bytes / mb).toFixed(2) + ' MB'
  return (bytes / 1024).toFixed(2) + ' KB'
}

function goPlan() {
  router.push('/dashboard/plan')
}

function goTicket() {
  router.push('/dashboard/ticket')
}

function goKnowledge() {
  router.push('/dashboard/knowledge')
}

function oneClickSubscribe() {
  if (!subscribe.value || !subscribe.value.subscribe_url) {
    goPlan()
    return
  }
  showSubscribeModal.value = true
}

const renewOrBuyText = computed(() => {
  if (!subscribe.value || !subscribe.value.plan_id) {
    return '购买订阅'
  }
  return '续费订阅'
})

const renewOrBuyDesc = computed(() => {
  if (!subscribe.value || !subscribe.value.plan_id) {
    return '对您当前的订阅进行购买'
  }
  return '对您当前的订阅进行续费'
})

const subscribeUrl = computed(() => subscribe.value?.subscribe_url || '')

function copySubscribeUrl() {
  const url = subscribeUrl.value
  if (!url) return
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).catch(() => {})
  } else {
    const textarea = document.createElement('textarea')
    textarea.value = url
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
    } catch {
      // ignore
    }
    document.body.removeChild(textarea)
  }
}

function openSubscribeQr() {
  if (!subscribeUrl.value) return
  showSubscribeQr.value = true
}

function closeSubscribeModal() {
  showSubscribeModal.value = false
}

function closeSubscribeQr() {
  showSubscribeQr.value = false
}

const hiddifyLink = computed(() => {
  const url = subscribeUrl.value
  if (!url) return ''
  const title = document.title || '订阅'
  return `hiddify://import/${url}&flag=sing#${title}`
})

const singboxLink = computed(() => {
  const url = subscribeUrl.value
  if (!url) return ''
  const title = document.title || '订阅'
  return `sing-box://import-remote-profile?url=${encodeURIComponent(url)}#${title}`
})

const clashMetaLink = computed(() => {
  const url = subscribeUrl.value
  if (!url) return ''
  const title = document.title || '订阅'
  return `clash://install-config?url=${encodeURIComponent(url + '&flag=meta')}&name=${encodeURIComponent(title)}`
})

function openClient(href: string) {
  if (!href) return
  if (typeof window !== 'undefined') {
    window.location.href = href
  }
}

async function openNoticeDetail() {
  if (!currentNotice.value) return
  showNoticeDialog.value = true

  // 已经加载过同一条公告的详情，直接使用缓存
  if (noticeDetail.value && noticeDetail.value.id === currentNotice.value.id) {
    return
  }

  loadingNoticeDetail.value = true
  try {
    noticeDetail.value = await getNoticeDetail(currentNotice.value.id)
  } finally {
    loadingNoticeDetail.value = false
  }
}

function closeNoticeDialog() {
  showNoticeDialog.value = false
}

const noticeDialogTitle = computed(() => {
  const n = noticeDetail.value ?? currentNotice.value
  return n?.title ?? ''
})

const noticeDialogTime = computed(() => {
  const n = noticeDetail.value ?? currentNotice.value
  return n ? formatTime(n.created_at) : ''
})

const noticeDialogContent = computed(() => {
  const n = noticeDetail.value ?? currentNotice.value
  return n?.content ?? ''
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 960px;
  margin: 0 auto;
}

.announce {
  display: flex;
  align-items: stretch;
  background: #fef3c7;
  border-radius: 8px;
  border: 1px solid #facc15;
  overflow: hidden;
  cursor: pointer;
}

.announce-label {
  padding: 12px 16px;
  background: #f97316;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
}

.announce-body {
  flex: 1;
  padding: 10px 16px;
}

.announce-body h2 {
  margin: 0 0 4px;
  font-size: 16px;
}

.announce-body p {
  margin: 0;
  font-size: 13px;
  color: #4b5563;
}

.announce-content {
  margin-top: 4px;
  max-height: 3.4em;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.announce-meta {
  padding: 10px 16px;
  font-size: 12px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 12px;
}

.announce-date {
  flex: 1;
}

.announce-more {
  color: #2563eb;
}

.main-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.card-header {
  padding: 10px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.card-header h3 {
  margin: 0;
  font-size: 15px;
}

.card-body {
  padding: 10px 16px;
  font-size: 13px;
}

.sub-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sub-plan-name {
  margin: 0 0 2px;
  font-size: 16px;
}

.sub-meta {
  margin: 0 0 4px;
  font-size: 13px;
  color: #6b7280;
}

.sub-expired {
  color: #dc2626;
  font-weight: 600;
}

.sub-progress {
  margin: 6px 0 4px;
}

.progress {
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  transition: width 0.2s ease-out;
}

.progress-bar-success {
  background: #16a34a;
}

.progress-bar-warning {
  background: #f59e0b;
}

.progress-bar-danger {
  background: #dc2626;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 12px;
  color: #4b5563;
}

.progress-main {
  font-weight: 600;
}

.progress-devices {
  margin-left: 12px;
}

.sub-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0 6px;
}

.btn-sub {
  padding: 5px 10px;
  border-radius: 999px;
  border: none;
  background: #2563eb;
  color: #ffffff;
  font-size: 12px;
  cursor: pointer;
}

.btn-sub:hover {
  background: #1d4ed8;
}

.sub-empty {
  padding: 20px 0;
  text-align: center;
  cursor: pointer;
  color: #6b7280;
}

.sub-empty-icon {
  font-size: 24px;
}

.sub-empty-text {
  margin-top: 4px;
  font-size: 13px;
}

.sub-row {
  display: flex;
  padding: 6px 0;
  font-size: 13px;
}

.sub-label {
  width: 80px;
  color: #6b7280;
}

.sub-value {
  flex: 1;
  color: #111827;
}

.sub-url {
  word-break: break-all;
}

.shortcuts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shortcut-item {
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  border-radius: 6px;
  border: none;
  background: #f3f4f6;
  cursor: pointer;
}

.shortcut-item:hover {
  background: #e5e7eb;
}

.shortcut-title {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #111827;
}

.shortcut-desc {
  display: block;
  font-size: 12px;
  color: #6b7280;
}

@media (max-width: 960px) {
  .main-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.notice-dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
}

.notice-dialog {
  width: 100%;
  max-width: 640px;
  max-height: 80vh;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.3);
  padding: 18px 20px 14px;
  display: flex;
  flex-direction: column;
}

.notice-dialog-title {
  margin: 0 0 4px;
  font-size: 18px;
}

.notice-dialog-meta {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 10px;
}

.notice-dialog-body {
  flex: 1;
  padding-right: 4px;
  font-size: 14px;
  color: #111827;
  overflow: auto;
}

.notice-dialog-body :deep(p) {
  margin: 0 0 8px;
}

.notice-dialog-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.notice-dialog-close {
  min-width: 72px;
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  background: #2563eb;
  color: #ffffff;
  font-size: 13px;
  cursor: pointer;
}

.subscribe-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.subscribe-dialog {
  width: 100%;
  max-width: 320px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.3);
  padding: 10px 0 12px;
}

.subscribe-item {
  width: 100%;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
}

.subscribe-item:hover {
  background: #f3f4f6;
}

.subscribe-icon {
  width: 24px;
  text-align: center;
}

.subscribe-text {
  font-size: 14px;
  color: #111827;
}

.subscribe-footer {
  padding: 8px 12px 0;
}

.subscribe-help {
  width: 100%;
  padding: 8px 10px;
  border-radius: 6px;
  border: none;
  background: #2563eb;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
}

.subscribe-help:hover {
  background: #1d4ed8;
}

.qr-dialog {
  text-align: center;
  padding-bottom: 14px;
}

.subscribe-qr {
  display: block;
  margin: 4px auto 8px;
  width: 220px;
  height: 220px;
}

.subscribe-qr-tip {
  font-size: 13px;
  color: #4b5563;
  padding: 0 16px 4px;
}
</style>

