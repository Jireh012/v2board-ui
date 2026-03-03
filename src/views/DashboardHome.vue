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
            <div class="sub-row">
              <div class="sub-label">邮箱</div>
              <div class="sub-value">{{ subscribe.email }}</div>
            </div>
            <div class="sub-row">
              <div class="sub-label">订阅状态</div>
              <div class="sub-value">
                {{ subscribe.expired_at ? '正常' : '未激活' }}
              </div>
            </div>
            <div class="sub-row">
              <div class="sub-label">到期时间</div>
              <div class="sub-value">{{ formatTime(subscribe.expired_at) }}</div>
            </div>
            <div class="sub-row">
              <div class="sub-label">已用流量</div>
              <div class="sub-value">{{ formatTraffic(subscribe.u + subscribe.d) }}</div>
            </div>
            <div class="sub-row">
              <div class="sub-label">总流量</div>
              <div class="sub-value">{{ formatTraffic(subscribe.transfer_enable) }}</div>
            </div>
            <div class="sub-row">
              <div class="sub-label">订阅链接</div>
              <div class="sub-value sub-url">{{ subscribe.subscribe_url }}</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>账户信息</h3>
          </div>
          <div class="card-body" v-if="!info">
            正在加载账户信息...
          </div>
          <div class="card-body" v-else>
            <div class="sub-row">
              <div class="sub-label">余额</div>
              <div class="sub-value">￥{{ (info.balance || 0) / 100 }}</div>
            </div>
            <div class="sub-row">
              <div class="sub-label">佣金余额</div>
              <div class="sub-value">￥{{ (info.commission_balance || 0) / 100 }}</div>
            </div>
            <div class="sub-row">
              <div class="sub-label">创建时间</div>
              <div class="sub-value">{{ formatTime(info.created_at) }}</div>
            </div>
          </div>
        </div>
      </div>

      <aside class="column column-side">
        <div class="card">
          <div class="card-header">
            <h3>捷径</h3>
          </div>
          <div class="card-body shortcuts">
            <button class="shortcut-item" @click="goPlan">
              <span class="shortcut-title">查看套餐</span>
              <span class="shortcut-desc">快速跳转到订阅套餐页面</span>
            </button>
            <button class="shortcut-item" @click="goOrder">
              <span class="shortcut-title">我的订单</span>
              <span class="shortcut-desc">查看历史订单记录和支付状态</span>
            </button>
            <button class="shortcut-item" @click="goTicket">
              <span class="shortcut-title">提交工单</span>
              <span class="shortcut-desc">遇到问题？联系管理员获取帮助</span>
            </button>
            <button class="shortcut-item" @click="goTraffic">
              <span class="shortcut-title">流量明细</span>
              <span class="shortcut-desc">查看最近的流量使用情况</span>
            </button>
          </div>
        </div>
      </aside>
    </section>

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
import { getUserInfo, getSubscribe, type UserInfo, type SubscribeInfo } from '../api/user'
import { fetchNotices, getNoticeDetail, type Notice } from '../api/notice'

const router = useRouter()
const info = ref<UserInfo | null>(null)
const subscribe = ref<SubscribeInfo | null>(null)
const currentNotice = ref<Notice | null>(null)
const noticeDetail = ref<Notice | null>(null)
const showNoticeDialog = ref(false)
const loadingNoticeDetail = ref(false)

onMounted(async () => {
  try {
    info.value = await getUserInfo()
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

function goOrder() {
  router.push('/dashboard/order')
}

function goTicket() {
  router.push('/dashboard/ticket')
}

function goTraffic() {
  router.push('/dashboard/traffic')
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
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
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
</style>

