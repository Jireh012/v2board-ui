<template>
  <div class="invite-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">我的邀请</h1>
        <p class="hint">邀请好友注册，获取丰厚返利。</p>
      </div>
      <div class="user-stats">
        <div class="stat-main">
          <div class="stat-value">¥ {{ formatAmount(stat[4]) }}</div>
          <div class="stat-label">可用佣金余额</div>
        </div>
        <button class="btn-primary btn-round" @click="showTransfer = true">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>
          划转
        </button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">已注册用户数</div>
        <div class="stat-value">{{ stat[0] || 0 }} <small>人</small></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">佣金比例</div>
        <div class="stat-value">{{ stat[3] || 0 }}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">确认中的佣金</div>
        <div class="stat-value">¥ {{ formatAmount(stat[2]) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">累计获得佣金</div>
        <div class="stat-value">¥ {{ formatAmount(stat[1]) }}</div>
      </div>
    </div>

    <!-- 邀请码管理 -->
    <div class="section-card">
      <div class="section-header">
        <h3 class="section-title">邀请码</h3>
        <button 
          class="btn-outline btn-sm" 
          type="button" 
          :disabled="saving"
          @click="handleSaveInvite"
        >
          {{ saving ? '生成中...' : '管理邀请码' }}
        </button>
      </div>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="inviteCodes.length" class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>邀请码</th>
              <th style="text-align: right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in inviteCodes" :key="c.id">
              <td class="code-cell">{{ c.code }}</td>
              <td style="text-align: right">
                <button 
                  type="button" 
                  class="link-action" 
                  @click="copyInviteLink(c.code)"
                >
                  复制链接
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="empty">暂无可用邀请码，请点击右上方按钮生成。</p>
    </div>

    <!-- 返利明细 -->
    <div class="section-card">
      <div class="section-header">
        <h3 class="section-title">返利明细</h3>
      </div>
      <div v-if="detailsLoading" class="loading">加载中...</div>
      <div v-else-if="details.length" class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>订单金额</th>
              <th>获得佣金</th>
              <th style="text-align: right">时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in details" :key="d.id">
              <td class="trade-no">{{ d.trade_no }}</td>
              <td>¥ {{ formatAmount(d.order_amount) }}</td>
              <td class="amount-plus">+ ¥ {{ formatAmount(d.get_amount) }}</td>
              <td style="text-align: right" class="time-cell">{{ formatTime(d.created_at) }}</td>
            </tr>
          </tbody>
        </table>
        <!-- 分页 -->
        <div class="pagination" v-if="total > pageSize">
          <button 
            class="page-btn"
            :disabled="current === 1" 
            @click="handlePageChange(current - 1)"
          >上一页</button>
          <span class="page-info">{{ current }} / {{ Math.ceil(total / pageSize) }}</span>
          <button 
            class="page-btn"
            :disabled="current >= Math.ceil(total / pageSize)" 
            @click="handlePageChange(current + 1)"
          >下一页</button>
        </div>
      </div>
      <p v-else class="empty">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span>暂无活跃返利记录</span>
      </p>
    </div>

    <!-- 划转弹窗 -->
    <div v-if="showTransfer" class="modal-mask" @click.self="showTransfer = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">推广佣金划转至余额</h3>
          <button class="modal-close" @click="showTransfer = false">×</button>
        </div>
        <div class="modal-body">
          <div class="alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            划转后的余额仅用于谜之站点消费使用
          </div>
          <div class="form-item">
            <label>当前推广佣金余额</label>
            <input type="text" :value="formatAmount(stat[4])" disabled class="input-disabled">
          </div>
          <div class="form-item">
            <label>划转金额</label>
            <input 
              v-model.number="transferAmount" 
              type="number" 
              placeholder="请输入需要划转到余额的金额"
            >
            <p class="input-hint">最小划转金额为 ¥ 1.00</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-text" @click="showTransfer = false">取消</button>
          <button 
            class="btn-primary" 
            @click="handleTransfer" 
            :disabled="transferring || !transferAmount || transferAmount < 1"
          >
            {{ transferring ? '处理中...' : '确认' }}
          </button>
        </div>
      </div>
    </div>

    <p v-if="message" class="toast" :class="{ error: isError }">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { 
  fetchInvite, 
  saveInvite, 
  fetchInviteDetails, 
  transferCommission,
  type InviteCode, 
  type CommissionLog 
} from '../api/invite'

const inviteCodes = ref<InviteCode[]>([])
const stat = ref<number[]>([])
const details = ref<CommissionLog[]>([])
const total = ref(0)
const current = ref(1)
const pageSize = 10

const loading = ref(false)
const detailsLoading = ref(false)
const saving = ref(false)
const message = ref('')
const isError = ref(false)

const showTransfer = ref(false)
const transferAmount = ref<number | null>(null)
const transferring = ref(false)

async function loadInvite() {
  loading.value = true
  try {
    const res = await fetchInvite()
    inviteCodes.value = res.codes
    stat.value = res.stat
  } catch (e) {
    showToast(e instanceof Error ? e.message : '加载邀请信息失败', true)
  } finally {
    loading.value = false
  }
}

async function loadDetails(page = 1) {
  detailsLoading.value = true
  try {
    const res = await fetchInviteDetails(page, pageSize)
    details.value = res.data
    total.value = res.total
    current.value = page
  } catch (e) {
    showToast(e instanceof Error ? e.message : '加载返利明细失败', true)
  } finally {
    detailsLoading.value = false
  }
}

async function handleSaveInvite() {
  saving.value = true
  try {
    await saveInvite()
    await loadInvite()
    showToast('生成成功')
  } catch (e) {
    showToast(e instanceof Error ? e.message : '生成失败', true)
  } finally {
    saving.value = false
  }
}

async function handleTransfer() {
  if (!transferAmount.value || transferAmount.value < 1) return
  transferring.value = true
  try {
    // 后端接收的是分，所以乘以 100
    await transferCommission(Math.floor(transferAmount.value * 100))
    showToast('划转成功')
    showTransfer.value = false
    transferAmount.value = null
    await loadInvite()
  } catch (e) {
    showToast(e instanceof Error ? e.message : '划转失败', true)
  } finally {
    transferring.value = false
  }
}

function handlePageChange(page: number) {
  loadDetails(page)
}

function formatAmount(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return '0.00'
  return (cents / 100).toFixed(2)
}

function formatTime(ts: number | null | undefined): string {
  if (!ts) return '-'
  const d = new Date(ts * 1000)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function copyInviteLink(code: string) {
  const url = `${window.location.protocol}//${window.location.host}/register?code=${code}`
  navigator.clipboard.writeText(url).then(() => {
    showToast('邀请链接已复制')
  }).catch(() => {
    showToast('复制失败，请手动复制', true)
  })
}

function showToast(msg: string, error = false) {
  message.value = msg
  isError.value = error
  setTimeout(() => { if (message.value === msg) message.value = '' }, 3000)
}

onMounted(() => {
  loadInvite()
  loadDetails()
})
</script>

<style scoped>
.invite-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.page-title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 800;
  color: #1e293b;
}

.hint {
  font-size: 15px;
  color: #64748b;
  margin: 0;
}

.user-stats {
  display: flex;
  align-items: center;
  gap: 20px;
  background: #ffffff;
  padding: 12px 20px;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  border: 1px solid #f1f5f9;
}

.stat-main {
  text-align: right;
}

.stat-main .stat-value {
  font-size: 24px;
  font-weight: 800;
  color: #2563eb;
  line-height: 1;
}

.stat-main .stat-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  margin-top: 4px;
}

.btn-round {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 999px;
}

/* Stats Cards */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: #ffffff;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border: 1px solid #f1f5f9;
}

.stat-card .stat-label {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
}

.stat-card .stat-value {
  font-size: 22px;
  font-weight: 800;
  color: #1e293b;
}

.stat-card .stat-value small {
  font-size: 14px;
  font-weight: 400;
  color: #94a3b8;
}

/* Sections */
.section-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  border: 1px solid #f1f5f9;
  margin-bottom: 24px;
  overflow: hidden;
}

.section-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
}

/* Table */
.table-wrapper {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.loading, 
.empty {
  padding: 64px 24px;
  text-align: center;
  color: #94a3b8;
  font-size: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty svg {
  color: #e2e8f0;
}

.table th {
  padding: 14px 24px;
  background: #f8fafc;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: left;
}

.table td {
  padding: 18px 24px;
  font-size: 14px;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
}

.code-cell {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  color: #2563eb;
}

.trade-no {
  font-size: 13px;
  color: #64748b;
}

.amount-plus {
  color: #059669;
  font-weight: 700;
}

.time-cell {
  color: #94a3b8;
}

.link-action {
  background: transparent;
  border: none;
  color: #2563eb;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.link-action:hover {
  text-decoration: underline;
}

/* Pagination */
.pagination {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.page-btn {
  padding: 6px 14px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: #94a3b8;
}

/* Modal */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal {
  width: 90%;
  max-width: 480px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.modal-header {
  padding: 24px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 24px;
  color: #94a3b8;
  cursor: pointer;
}

.modal-body {
  padding: 0 28px 24px;
}

.alert-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #fff7ed;
  color: #9a3412;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 24px;
}

.form-item {
  margin-bottom: 20px;
}

.form-item label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
}

.form-item input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 15px;
  box-sizing: border-box;
}

.input-disabled {
  background: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
}

.input-hint {
  font-size: 12px;
  color: #94a3b8;
  margin: 6px 0 0;
}

.modal-footer {
  padding: 20px 28px;
  background: #f8fafc;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #1e293b;
  color: white;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  z-index: 3000;
}

.toast.error { background: #ef4444; }

/* Buttons */
.btn-primary {
  background: #2563eb;
  color: white;
  border: none;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline {
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
  font-weight: 600;
  cursor: pointer;
}

.btn-sm { padding: 6px 12px; font-size: 13px; border-radius: 8px; }

.btn-text {
  background: transparent;
  border: none;
  color: #64748b;
  font-weight: 600;
  cursor: pointer;
}
</style>
