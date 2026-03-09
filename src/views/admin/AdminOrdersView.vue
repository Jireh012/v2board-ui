<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">订单管理</h1>
      <div class="header-actions">
        <button class="btn primary" @click="openAssign">分配订单</button>
      </div>
    </div>

    <!-- 搜索过滤 -->
    <div class="search-bar">
      <div class="search-group">
        <select v-model="searchKey" class="input search-select">
          <option value="trade_no">订单号</option>
          <option value="email">用户邮箱</option>
          <option value="user_id">用户ID</option>
          <option value="status">状态</option>
          <option value="commission_status">佣金状态</option>
          <option value="invite_user_id">邀请人ID</option>
          <option value="callback_no">回调单号</option>
        </select>
        <select v-if="searchKey !== 'status' && searchKey !== 'commission_status'"
          v-model="searchCondition" class="input search-condition">
          <option value="=">=</option>
          <option value="模糊">模糊</option>
          <option value="!=">!=</option>
          <option value=">">&gt;</option>
          <option value="<">&lt;</option>
        </select>
        <select v-if="searchKey === 'status'" v-model="searchValue" class="input search-input">
          <option value="">全部</option>
          <option value="0">待支付</option>
          <option value="1">开通中</option>
          <option value="2">已取消</option>
          <option value="3">已完成</option>
          <option value="4">已折抵</option>
        </select>
        <select v-else-if="searchKey === 'commission_status'" v-model="searchValue" class="input search-input">
          <option value="">全部</option>
          <option value="0">待确认</option>
          <option value="1">发放中</option>
          <option value="2">有效</option>
          <option value="3">无效</option>
        </select>
        <input v-else v-model="searchValue" class="input search-input" placeholder="输入搜索内容…"
          @keydown.enter="doSearch" />
        <button class="btn primary" @click="doSearch">搜索</button>
        <button v-if="activeFilters.length" class="btn secondary" @click="clearSearch">清除</button>
      </div>
      <label class="commission-toggle">
        <input type="checkbox" v-model="isCommission" @change="doSearch" />
        <span>仅佣金订单</span>
      </label>
    </div>

    <!-- 列表 -->
    <div class="panel">
      <div v-if="loading" class="loading">加载中…</div>
      <div v-else-if="!rows.length" class="empty">暂无订单数据。</div>
      <template v-else>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th style="width:50px">ID</th>
                <th>订单号</th>
                <th>类型</th>
                <th>周期</th>
                <th>套餐</th>
                <th>金额（元）</th>
                <th>状态</th>
                <th>佣金状态</th>
                <th>创建时间</th>
                <th style="width:200px">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in rows" :key="o.id">
                <td>{{ o.id }}</td>
                <td class="mono">{{ o.trade_no }}</td>
                <td><span class="tag" :class="'tag-type-' + o.type">{{ typeLabel(o.type) }}</span></td>
                <td>{{ periodLabel(o.period) }}</td>
                <td>{{ o.plan_name || o.plan_id }}</td>
                <td>{{ fmtAmount(o.total_amount) }}</td>
                <td>
                  <span class="status" :class="'status-' + o.status">{{ statusLabel(o.status) }}</span>
                </td>
                <td>
                  <span class="comm-status" :class="'comm-' + o.commission_status">
                    {{ commStatusLabel(o.commission_status) }}
                  </span>
                </td>
                <td>{{ fmtTime(o.created_at) }}</td>
                <td class="actions-cell">
                  <button class="btn-sm info" @click="openDetail(o)">详情</button>
                  <button v-if="o.status === 0" class="btn-sm ok" @click="doPaid(o)">确认收款</button>
                  <button v-if="o.status === 0" class="btn-sm danger" @click="doCancel(o)">取消</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- 分页 -->
        <div class="pagination">
          <span class="page-info">共 {{ total }} 条</span>
          <button class="btn-page" :disabled="currentPage <= 1" @click="goPage(currentPage - 1)">上一页</button>
          <span class="page-num">{{ currentPage }} / {{ totalPages }}</span>
          <button class="btn-page" :disabled="currentPage >= totalPages" @click="goPage(currentPage + 1)">下一页</button>
          <select v-model="pageSize" class="input page-size" @change="doSearch">
            <option :value="10">10条/页</option>
            <option :value="20">20条/页</option>
            <option :value="50">50条/页</option>
          </select>
        </div>
      </template>
    </div>

    <!-- 详情弹窗 -->
    <Teleport to="body">
      <div v-if="showDetail" class="modal-mask" @click.self="showDetail = false">
        <div class="modal modal-wide">
          <div class="modal-header">
            <h2>订单详情</h2>
            <button class="modal-close" @click="showDetail = false">&times;</button>
          </div>
          <div class="modal-body">
            <div v-if="detailLoading" class="loading">加载中…</div>
            <template v-else-if="detail">
              <div class="detail-grid">
                <div class="detail-item"><label>订单号</label><span class="mono">{{ detail.trade_no }}</span></div>
                <div class="detail-item"><label>用户ID</label><span>{{ detail.user_id }}</span></div>
                <div class="detail-item"><label>类型</label><span class="tag" :class="'tag-type-' + detail.type">{{ typeLabel(detail.type) }}</span></div>
                <div class="detail-item"><label>周期</label><span>{{ periodLabel(detail.period) }}</span></div>
                <div class="detail-item"><label>套餐ID</label><span>{{ detail.plan_id }}</span></div>
                <div class="detail-item"><label>总金额</label><span>{{ fmtAmount(detail.total_amount) }} 元</span></div>
                <div class="detail-item"><label>折扣金额</label><span>{{ fmtAmount(detail.discount_amount) }} 元</span></div>
                <div class="detail-item"><label>余额支付</label><span>{{ fmtAmount(detail.balance_amount) }} 元</span></div>
                <div class="detail-item"><label>手续费</label><span>{{ fmtAmount(detail.handling_amount) }} 元</span></div>
                <div class="detail-item"><label>退款金额</label><span>{{ fmtAmount(detail.refund_amount) }} 元</span></div>
                <div class="detail-item"><label>剩余价值</label><span>{{ fmtAmount(detail.surplus_amount) }} 元</span></div>
                <div class="detail-item">
                  <label>状态</label>
                  <span class="status" :class="'status-' + detail.status">{{ statusLabel(detail.status) }}</span>
                </div>
                <div class="detail-item"><label>回调单号</label><span>{{ detail.callback_no || '-' }}</span></div>
                <div class="detail-item"><label>支付时间</label><span>{{ detail.paid_at ? fmtTime(detail.paid_at) : '-' }}</span></div>
                <div class="detail-item"><label>创建时间</label><span>{{ fmtTime(detail.created_at) }}</span></div>
                <div class="detail-item"><label>邀请人ID</label><span>{{ detail.invite_user_id || '-' }}</span></div>
                <div class="detail-item"><label>佣金金额</label><span>{{ fmtAmount(detail.commission_balance) }} 元</span></div>
                <div class="detail-item">
                  <label>佣金状态</label>
                  <div class="comm-edit">
                    <select v-model="editCommStatus" class="input input-sm">
                      <option :value="0">待确认</option>
                      <option :value="1">发放中</option>
                      <option :value="3">无效</option>
                    </select>
                    <button class="btn-sm primary" :disabled="updatingComm"
                      @click="doUpdateComm">{{ updatingComm ? '…' : '更新' }}</button>
                  </div>
                </div>
              </div>

              <!-- 佣金日志 -->
              <template v-if="detail.commission_log && detail.commission_log.length">
                <h3 class="section-title">佣金日志</h3>
                <table class="table table-sm">
                  <thead>
                    <tr><th>ID</th><th>邀请人</th><th>订单金额</th><th>佣金</th><th>时间</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="log in detail.commission_log" :key="log.id">
                      <td>{{ log.id }}</td>
                      <td>{{ log.invite_user_id }}</td>
                      <td>{{ fmtAmount(log.order_amount) }}</td>
                      <td>{{ fmtAmount(log.get_amount) }}</td>
                      <td>{{ fmtTime(log.created_at) }}</td>
                    </tr>
                  </tbody>
                </table>
              </template>

              <!-- 折抵订单 -->
              <template v-if="detail.surplus_orders && detail.surplus_orders.length">
                <h3 class="section-title">折抵订单</h3>
                <table class="table table-sm">
                  <thead>
                    <tr><th>ID</th><th>订单号</th><th>金额</th><th>状态</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="so in detail.surplus_orders" :key="so.id">
                      <td>{{ so.id }}</td>
                      <td class="mono">{{ so.trade_no }}</td>
                      <td>{{ fmtAmount(so.total_amount) }}</td>
                      <td>{{ statusLabel(so.status) }}</td>
                    </tr>
                  </tbody>
                </table>
              </template>
            </template>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 分配订单弹窗 -->
    <Teleport to="body">
      <div v-if="showAssign" class="modal-mask" @click.self="showAssign = false">
        <div class="modal">
          <div class="modal-header">
            <h2>分配订单</h2>
            <button class="modal-close" @click="showAssign = false">&times;</button>
          </div>
          <form class="modal-body" @submit.prevent="doAssign">
            <div class="form-row">
              <label>用户邮箱 <span class="req">*</span></label>
              <input v-model="assignForm.email" class="input" placeholder="user@example.com" required />
            </div>
            <div class="form-row">
              <label>订阅计划 <span class="req">*</span></label>
              <select v-model.number="assignForm.plan_id" class="input" required>
                <option value="">-- 请选择 --</option>
                <option v-for="p in plans" :key="p.id" :value="p.id">{{ p.name }} (ID:{{ p.id }})</option>
              </select>
            </div>
            <div class="form-row">
              <label>周期 <span class="req">*</span></label>
              <select v-model="assignForm.period" class="input" required>
                <option value="">-- 请选择 --</option>
                <option value="month_price">月付</option>
                <option value="quarter_price">季付</option>
                <option value="half_year_price">半年付</option>
                <option value="year_price">年付</option>
                <option value="two_year_price">两年付</option>
                <option value="three_year_price">三年付</option>
                <option value="onetime_price">一次性</option>
                <option value="reset_price">流量重置</option>
              </select>
            </div>
            <div class="form-row">
              <label>金额（元） <span class="req">*</span></label>
              <input v-model.number="assignForm.amount" class="input" type="number" step="0.01" min="0" required />
            </div>
            <div class="modal-footer">
              <button type="button" class="btn secondary" @click="showAssign = false">取消</button>
              <button type="submit" class="btn primary" :disabled="assigning">{{ assigning ? '提交中…' : '提交' }}</button>
              <span v-if="assignErr" class="err-msg">{{ assignErr }}</span>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, reactive } from 'vue'
import {
  fetchAdminOrders, fetchAdminOrderDetail, paidAdminOrder, cancelAdminOrder,
  updateAdminOrder, assignAdminOrder, fetchAdminPlans,
  type AdminOrderRow, type AdminOrderDetail, type AdminPlan, type OrderFilter, type PageResult
} from '../../api/admin'

// ==================== 常量 ====================
const PERIOD_LABELS: Record<string, string> = {
  month_price: '月付', quarter_price: '季付', half_year_price: '半年付',
  year_price: '年付', two_year_price: '两年付', three_year_price: '三年付',
  onetime_price: '一次性', reset_price: '流量重置', deposit: '钱包充值'
}
const STATUS_LABELS = ['待支付', '开通中', '已取消', '已完成', '已折抵']
const TYPE_LABELS: Record<number, string> = { 1: '新购', 2: '续费', 3: '升级', 4: '流量重置', 9: '充值' }
const COMM_STATUS_LABELS: Record<number, string> = { 0: '待确认', 1: '发放中', 2: '有效', 3: '无效' }

// ==================== 列表状态 ====================
const rows = ref<AdminOrderRow[]>([])
const total = ref(0)
const loading = ref(true)
const currentPage = ref(1)
const pageSize = ref(10)
const isCommission = ref(false)

// 搜索
const searchKey = ref('trade_no')
const searchCondition = ref('=')
const searchValue = ref('')
const activeFilters = ref<OrderFilter[]>([])

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

// ==================== 详情 ====================
const showDetail = ref(false)
const detail = ref<AdminOrderDetail | null>(null)
const detailLoading = ref(false)
const editCommStatus = ref(0)
const updatingComm = ref(false)

// ==================== 分配 ====================
const showAssign = ref(false)
const assigning = ref(false)
const assignErr = ref('')
const plans = ref<AdminPlan[]>([])
const assignForm = reactive({
  email: '',
  plan_id: '' as number | '',
  period: '',
  amount: 0
})

// ==================== 格式化 ====================
function periodLabel(p: string) { return PERIOD_LABELS[p] || p }
function statusLabel(s: number) { return STATUS_LABELS[s] ?? `未知(${s})` }
function typeLabel(t: number) { return TYPE_LABELS[t] ?? `未知(${t})` }
function commStatusLabel(s: number) { return COMM_STATUS_LABELS[s] ?? `未知(${s})` }
function fmtAmount(v: number | null | undefined) { return v != null ? (v / 100).toFixed(2) : '0.00' }
function fmtTime(ts: number | null | undefined) {
  if (!ts) return '-'
  return new Date(ts * 1000).toLocaleString('zh-CN', { hour12: false })
}

// ==================== 加载 ====================
async function load() {
  loading.value = true
  try {
    const res: PageResult<AdminOrderRow> = await fetchAdminOrders(
      currentPage.value, pageSize.value, activeFilters.value, isCommission.value
    )
    rows.value = res.data
    total.value = res.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function doSearch() {
  const filters: OrderFilter[] = []
  if (searchValue.value) {
    const cond = (searchKey.value === 'status' || searchKey.value === 'commission_status') ? '=' : searchCondition.value
    filters.push({ key: searchKey.value, condition: cond, value: searchValue.value })
  }
  activeFilters.value = filters
  currentPage.value = 1
  load()
}

function clearSearch() {
  searchValue.value = ''
  activeFilters.value = []
  isCommission.value = false
  currentPage.value = 1
  load()
}

function goPage(p: number) {
  if (p < 1 || p > totalPages.value) return
  currentPage.value = p
  load()
}

// ==================== 详情 ====================
async function openDetail(o: AdminOrderRow) {
  showDetail.value = true
  detailLoading.value = true
  detail.value = null
  try {
    detail.value = await fetchAdminOrderDetail(o.id)
    editCommStatus.value = detail.value.commission_status ?? 0
  } catch (e) {
    alert((e as Error).message)
    showDetail.value = false
  } finally {
    detailLoading.value = false
  }
}

async function doUpdateComm() {
  if (!detail.value) return
  updatingComm.value = true
  try {
    await updateAdminOrder(detail.value.trade_no, editCommStatus.value)
    detail.value.commission_status = editCommStatus.value
    await load()
  } catch (e) {
    alert((e as Error).message)
  } finally {
    updatingComm.value = false
  }
}

// ==================== 操作 ====================
async function doPaid(o: AdminOrderRow) {
  if (!confirm(`确认手动标记订单 ${o.trade_no} 为已支付？此操作将触发订阅开通。`)) return
  try {
    await paidAdminOrder(o.trade_no)
    await load()
  } catch (e) {
    alert((e as Error).message)
  }
}

async function doCancel(o: AdminOrderRow) {
  if (!confirm(`确认取消订单 ${o.trade_no}？`)) return
  try {
    await cancelAdminOrder(o.trade_no)
    await load()
  } catch (e) {
    alert((e as Error).message)
  }
}

// ==================== 分配订单 ====================
async function openAssign() {
  assignForm.email = ''
  assignForm.plan_id = ''
  assignForm.period = ''
  assignForm.amount = 0
  assignErr.value = ''
  showAssign.value = true
  if (!plans.value.length) {
    try { plans.value = await fetchAdminPlans() } catch (e) { console.error(e) }
  }
}

async function doAssign() {
  if (!assignForm.plan_id || !assignForm.email || !assignForm.period) return
  assigning.value = true
  assignErr.value = ''
  try {
    const tradeNo = await assignAdminOrder(
      assignForm.plan_id as number,
      assignForm.email,
      assignForm.period,
      Math.round(assignForm.amount * 100)
    )
    showAssign.value = false
    alert(`订单创建成功，订单号：${tradeNo}`)
    await load()
  } catch (e) {
    assignErr.value = (e as Error).message
  } finally {
    assigning.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }

.page-header { display: flex; align-items: center; justify-content: space-between; }
.page-title { font-size: 20px; font-weight: 600; margin: 0; color: #e5e7eb; }
.header-actions { display: flex; gap: 8px; }

/* ---- 搜索 ---- */
.search-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.search-group { display: flex; gap: 6px; align-items: center; }
.search-select { width: 130px; }
.search-condition { width: 70px; }
.search-input { width: 200px; }
.commission-toggle { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #94a3b8; cursor: pointer; white-space: nowrap; }
.commission-toggle input { accent-color: #2563eb; }

/* ---- Panel ---- */
.panel { background: #111827; border: 1px solid #1e293b; border-radius: 10px; padding: 16px; }
.loading, .empty { padding: 32px; text-align: center; color: #64748b; font-size: 14px; }

/* ---- Table ---- */
.table-wrap { overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; font-size: 13px; }
.table th, .table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #1e293b; white-space: nowrap; }
.table th { color: #94a3b8; font-weight: 500; font-size: 12px; background: #0f172a; }
.table td { color: #e5e7eb; }
.table tbody tr:hover { background: rgba(56,189,248,0.04); }
.table-sm { font-size: 12px; margin-top: 8px; }
.table-sm th, .table-sm td { padding: 6px 10px; }
.mono { font-family: 'SF Mono', 'Cascadia Code', monospace; font-size: 12px; }

/* ---- Tags & Status ---- */
.tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
.tag-type-1 { background: #1e3a5f; color: #93c5fd; }
.tag-type-2 { background: #1a3a2f; color: #86efac; }
.tag-type-3 { background: #3b2f1a; color: #fcd34d; }
.tag-type-4 { background: #3b1a3b; color: #f0abfc; }
.tag-type-9 { background: #2d1b69; color: #c4b5fd; }

.status { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.status-0 { background: rgba(251,191,36,0.15); color: #fbbf24; }
.status-1 { background: rgba(56,189,248,0.15); color: #38bdf8; }
.status-2 { background: rgba(107,114,128,0.15); color: #9ca3af; }
.status-3 { background: rgba(74,222,128,0.15); color: #4ade80; }
.status-4 { background: rgba(248,113,113,0.15); color: #f87171; }

.comm-status { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.comm-0 { background: rgba(251,191,36,0.12); color: #fbbf24; }
.comm-1 { background: rgba(56,189,248,0.12); color: #38bdf8; }
.comm-2 { background: rgba(74,222,128,0.12); color: #4ade80; }
.comm-3 { background: rgba(248,113,113,0.12); color: #f87171; }

.actions-cell { display: flex; gap: 5px; }

/* ---- Pagination ---- */
.pagination { display: flex; align-items: center; gap: 10px; padding-top: 14px; border-top: 1px solid #1e293b; margin-top: 14px; }
.page-info { font-size: 13px; color: #64748b; }
.page-num { font-size: 13px; color: #e5e7eb; }
.btn-page { padding: 4px 12px; font-size: 12px; border: 1px solid #334155; border-radius: 4px; background: #1e293b; color: #e5e7eb; cursor: pointer; }
.btn-page:hover:not(:disabled) { background: #334155; }
.btn-page:disabled { opacity: .4; cursor: not-allowed; }
.page-size { width: 100px; font-size: 12px; padding: 4px 8px; }

/* ---- Buttons ---- */
.btn { padding: 7px 16px; font-size: 13px; border-radius: 6px; cursor: pointer; border: none; }
.btn.primary { background: #2563eb; color: #fff; }
.btn.primary:hover:not(:disabled) { background: #1d4ed8; }
.btn.primary:disabled { opacity: .6; cursor: not-allowed; }
.btn.secondary { background: #334155; color: #e5e7eb; }
.btn.secondary:hover { background: #475569; }

.btn-sm { padding: 3px 10px; font-size: 11px; border-radius: 4px; border: none; cursor: pointer; background: #1e293b; color: #94a3b8; }
.btn-sm:hover { background: #334155; color: #e5e7eb; }
.btn-sm.info { color: #38bdf8; }
.btn-sm.ok { color: #4ade80; }
.btn-sm.danger { color: #f87171; }
.btn-sm.danger:hover { background: rgba(248,113,113,.15); }
.btn-sm.primary { background: #2563eb; color: #fff; }

/* ---- Modal ---- */
.modal-mask { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: flex-start; justify-content: center; z-index: 200; padding-top: 40px; overflow-y: auto; }
.modal { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; width: 520px; max-width: 95vw; margin-bottom: 40px; }
.modal-wide { width: 680px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #1e293b; }
.modal-header h2 { font-size: 16px; margin: 0; color: #e5e7eb; }
.modal-close { background: none; border: none; color: #94a3b8; font-size: 22px; cursor: pointer; padding: 0; line-height: 1; }
.modal-close:hover { color: #e5e7eb; }
.modal-body { padding: 20px; overflow-y: auto; max-height: 75vh; display: flex; flex-direction: column; gap: 14px; }

.form-row { display: flex; flex-direction: column; gap: 4px; }
.form-row label { font-size: 13px; color: #94a3b8; }
.req { color: #f87171; }

.input { width: 100%; padding: 7px 10px; font-size: 13px; color: #e5e7eb; background: #1e293b; border: 1px solid #334155; border-radius: 6px; box-sizing: border-box; font-family: inherit; }
.input:focus { outline: none; border-color: #2563eb; }
.input-sm { width: auto; padding: 4px 8px; font-size: 12px; }
select.input { cursor: pointer; }

.modal-footer { display: flex; align-items: center; gap: 10px; padding-top: 12px; border-top: 1px solid #1e293b; }
.err-msg { color: #f87171; font-size: 13px; }

/* ---- Detail ---- */
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; }
.detail-item { display: flex; flex-direction: column; gap: 2px; }
.detail-item label { font-size: 11px; color: #64748b; text-transform: uppercase; }
.detail-item span { font-size: 13px; color: #e5e7eb; }
.comm-edit { display: flex; gap: 6px; align-items: center; }
.section-title { font-size: 14px; font-weight: 500; color: #94a3b8; margin: 0; padding-top: 12px; border-top: 1px solid #1e293b; }
</style>
