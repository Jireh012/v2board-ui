<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">订单管理</h1>
        <p class="page-subtitle">查看与处理用户订单，支持确认收款、取消与手动分配。</p>
      </div>
      <div class="header-actions">
        <button class="btn" :disabled="loading" @click="load" title="刷新">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :class="{ spinning: loading }"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
          刷新
        </button>
        <button class="btn primary" @click="openAssign">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          分配订单
        </button>
      </div>
    </div>

    <div class="stat-row" v-if="!loading">
      <div class="stat-card">
        <span class="stat-label">订单总数</span>
        <strong class="stat-value">{{ total }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">本页待支付</span>
        <strong class="stat-value warn">{{ pagePending }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">本页已完成</span>
        <strong class="stat-value ok">{{ pageDone }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">本页金额</span>
        <strong class="stat-value accent">¥{{ pageAmountText }}</strong>
      </div>
    </div>

    <div class="toolbar-card">
      <div class="search-bar">
        <select v-model="searchKey" class="search-select" @change="onSearchKeyChange">
          <option value="trade_no">订单号</option>
          <option value="email">用户邮箱</option>
          <option value="user_id">用户ID</option>
          <option value="callback_no">回调单号</option>
          <option value="invite_user_id">邀请人ID</option>
          <option value="commission_status">佣金状态</option>
        </select>
        <select
          v-if="searchKey === 'commission_status'"
          v-model="searchValue"
          class="search-input"
          @change="doSearch"
        >
          <option value="">全部</option>
          <option value="0">待确认</option>
          <option value="1">发放中</option>
          <option value="2">有效</option>
          <option value="3">无效</option>
        </select>
        <div v-else class="search-field">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            v-model="searchValue"
            class="search-text"
            :placeholder="searchPlaceholder"
            @keydown.enter="doSearch"
          />
        </div>
        <button type="button" class="btn primary" @click="doSearch">搜索</button>
        <button
          v-if="activeFilters.length || isCommission || statusQuick !== 'all'"
          type="button"
          class="btn"
          @click="clearSearch"
        >
          清除
        </button>
      </div>

      <div class="toolbar-bottom">
        <div class="filters">
          <button
            v-for="ft in statusTabs"
            :key="String(ft.value)"
            type="button"
            class="filter-btn"
            :class="{ active: statusQuick === ft.value }"
            @click="applyStatusQuick(ft.value)"
          >
            <span>{{ ft.label }}</span>
          </button>
        </div>
        <label class="commission-toggle" :class="{ on: isCommission }">
          <input type="checkbox" v-model="isCommission" @change="doSearch" />
          <span>仅佣金订单</span>
        </label>
      </div>
    </div>

    <div class="panel">
      <div v-if="loading" class="state-box">
        <div class="spinner"></div>
        <p>加载订单…</p>
      </div>
      <div v-else-if="!rows.length" class="state-box empty">
        <h3>暂无订单</h3>
        <p>调整筛选条件，或使用「分配订单」手动创建。</p>
        <button class="btn primary" @click="openAssign">分配订单</button>
      </div>
      <template v-else>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th style="width:56px">#</th>
                <th>订单号</th>
                <th>类型</th>
                <th>周期</th>
                <th>套餐</th>
                <th>金额</th>
                <th>状态</th>
                <th>佣金</th>
                <th>创建时间</th>
                <th class="col-actions sticky-right">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in rows" :key="o.id">
                <td class="id-cell">{{ o.id }}</td>
                <td>
                  <button type="button" class="trade-btn" :title="o.trade_no" @click="copyTradeNo(o.trade_no)">
                    <code>{{ shortTrade(o.trade_no) }}</code>
                    <span>复制</span>
                  </button>
                </td>
                <td><span class="tag" :class="'tag-type-' + o.type">{{ typeLabel(o.type) }}</span></td>
                <td>{{ periodLabel(o.period) }}</td>
                <td class="plan-cell">{{ o.plan_name || `套餐 #${o.plan_id}` }}</td>
                <td class="amount">¥{{ fmtAmount(o.total_amount) }}</td>
                <td><span class="status" :class="'status-' + o.status">{{ statusLabel(o.status) }}</span></td>
                <td>
                  <span class="comm-status" :class="'comm-' + o.commission_status">
                    {{ commStatusLabel(o.commission_status) }}
                  </span>
                </td>
                <td class="time-cell">{{ fmtTime(o.created_at) }}</td>
                <td class="actions-td sticky-right" @click.stop>
                  <button
                    type="button"
                    class="menu-trigger"
                    :ref="(el) => setMenuTrigger(o.id, el)"
                    @click="toggleMenu(o)"
                  >
                    操作
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <span class="page-info">共 {{ total }} 条</span>
          <button class="btn-page" :disabled="currentPage <= 1" @click="goPage(currentPage - 1)">上一页</button>
          <span class="page-num">{{ currentPage }} / {{ totalPages }}</span>
          <button class="btn-page" :disabled="currentPage >= totalPages" @click="goPage(currentPage + 1)">下一页</button>
          <select v-model="pageSize" class="input page-size" @change="doSearch">
            <option :value="10">10 条/页</option>
            <option :value="20">20 条/页</option>
            <option :value="50">50 条/页</option>
          </select>
        </div>
      </template>
    </div>

    <!-- 操作菜单 -->
    <Teleport to="body">
      <div v-if="menuOrder" class="order-action-menu" :style="menuStyle" @click.stop>
        <button type="button" @click="openDetail(menuOrder); closeMenu()">详情</button>
        <button
          v-if="menuOrder.status === 0"
          type="button"
          class="ok"
          @click="askPaid(menuOrder); closeMenu()"
        >
          确认收款
        </button>
        <button
          v-if="menuOrder.status === 0"
          type="button"
          class="danger"
          @click="askCancel(menuOrder); closeMenu()"
        >
          取消订单
        </button>
      </div>
    </Teleport>

    <!-- 详情 -->
    <Teleport to="body">
      <div v-if="showDetail" class="modal-mask" @click.self="showDetail = false">
        <div class="modal modal-detail">
          <div class="modal-header detail-header">
            <div class="detail-header-main">
              <div class="detail-title-row">
                <h2>订单详情</h2>
                <template v-if="detail">
                  <span class="status" :class="'status-' + detail.status">{{ statusLabel(detail.status) }}</span>
                  <span class="tag" :class="'tag-type-' + detail.type">{{ typeLabel(detail.type) }}</span>
                </template>
              </div>
              <div v-if="detail" class="trade-row">
                <code class="trade-no">{{ detail.trade_no }}</code>
                <button type="button" class="icon-btn" title="复制订单号" @click="copyTradeNo(detail.trade_no)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16V4a2 2 0 0 1 2-2h12"/></svg>
                </button>
              </div>
            </div>
            <button class="modal-close" @click="showDetail = false">&times;</button>
          </div>

          <div class="modal-body detail-body">
            <div v-if="detailLoading" class="state-box compact">
              <div class="spinner"></div>
              <p>加载详情…</p>
            </div>
            <template v-else-if="detail">
              <div class="detail-hero">
                <div class="hero-amount">
                  <span class="hero-label">应付金额</span>
                  <strong>¥{{ fmtAmount(detail.total_amount) }}</strong>
                </div>
                <div class="hero-meta">
                  <div class="hero-chip">
                    <span>套餐</span>
                    <b>{{ detail.plan_name || `套餐 #${detail.plan_id}` }}</b>
                  </div>
                  <div class="hero-chip">
                    <span>周期</span>
                    <b>{{ periodLabel(detail.period) }}</b>
                  </div>
                  <div class="hero-chip hero-chip-user">
                    <span>用户</span>
                    <b class="user-line" :title="[detail.email, `#${detail.user_id}`, detail.remarks].filter(Boolean).join(' · ')">
                      <span class="user-email">{{ detail.email || `用户 #${detail.user_id}` }}</span>
                      <span class="user-sep">·</span>
                      <span class="user-id">#{{ detail.user_id }}</span>
                      <template v-if="detail.remarks">
                        <span class="user-sep">·</span>
                        <span class="user-remarks">{{ detail.remarks }}</span>
                      </template>
                    </b>
                  </div>
                </div>
              </div>

              <div class="detail-sections">
                <section class="detail-card">
                  <h3 class="card-title">金额明细</h3>
                  <div class="money-grid">
                    <div class="money-item highlight">
                      <label>总金额</label>
                      <span>¥{{ fmtAmount(detail.total_amount) }}</span>
                    </div>
                    <div class="money-item" :class="{ muted: !detail.discount_amount }">
                      <label>折扣</label>
                      <span>{{ moneyOrDash(detail.discount_amount) }}</span>
                    </div>
                    <div class="money-item" :class="{ muted: !detail.balance_amount }">
                      <label>余额支付</label>
                      <span>{{ moneyOrDash(detail.balance_amount) }}</span>
                    </div>
                    <div class="money-item" :class="{ muted: !detail.handling_amount }">
                      <label>手续费</label>
                      <span>{{ moneyOrDash(detail.handling_amount) }}</span>
                    </div>
                    <div class="money-item" :class="{ muted: !detail.refund_amount }">
                      <label>退款</label>
                      <span>{{ moneyOrDash(detail.refund_amount) }}</span>
                    </div>
                    <div class="money-item" :class="{ muted: !detail.surplus_amount }">
                      <label>剩余价值</label>
                      <span>{{ moneyOrDash(detail.surplus_amount) }}</span>
                    </div>
                  </div>
                </section>

                <section class="detail-card">
                  <h3 class="card-title">订单信息</h3>
                  <div class="info-list">
                    <div class="info-row">
                      <label>订单 ID</label>
                      <span>#{{ detail.id }}</span>
                    </div>
                    <div class="info-row">
                      <label>用户邮箱</label>
                      <span class="mono wrap">{{ detail.email || '—' }}</span>
                    </div>
                    <div class="info-row">
                      <label>用户备注</label>
                      <span>{{ detail.remarks || '—' }}</span>
                    </div>
                    <div class="info-row">
                      <label>邀请人</label>
                      <span>{{ detail.invite_user_id ? `#${detail.invite_user_id}` : '无' }}</span>
                    </div>
                    <div class="info-row">
                      <label>支付方式</label>
                      <span>{{ detail.payment_id ? `#${detail.payment_id}` : '未支付 / 未指定' }}</span>
                    </div>
                    <div class="info-row">
                      <label>优惠券</label>
                      <span>{{ detail.coupon_id ? `#${detail.coupon_id}` : '无' }}</span>
                    </div>
                    <div class="info-row">
                      <label>回调单号</label>
                      <span class="mono wrap">{{ detail.callback_no || '无' }}</span>
                    </div>
                    <div class="info-row">
                      <label>创建时间</label>
                      <span>{{ fmtTime(detail.created_at) }}</span>
                    </div>
                    <div class="info-row">
                      <label>支付时间</label>
                      <span>{{ detail.paid_at ? fmtTime(detail.paid_at) : '未支付' }}</span>
                    </div>
                  </div>
                </section>

                <section class="detail-card full">
                  <div class="card-title-row">
                    <h3 class="card-title">佣金</h3>
                    <span class="comm-status" :class="'comm-' + detail.commission_status">
                      {{ commStatusLabel(detail.commission_status) }}
                    </span>
                  </div>
                  <div class="comm-panel">
                    <div class="comm-amount-box">
                      <label>佣金金额</label>
                      <strong>¥{{ fmtAmount(detail.commission_balance) }}</strong>
                      <small v-if="detail.actual_commission_balance != null">
                        实际 ¥{{ fmtAmount(detail.actual_commission_balance) }}
                      </small>
                    </div>
                    <div class="comm-edit-box">
                      <label>更新佣金状态</label>
                      <div class="comm-edit">
                        <select v-model="editCommStatus" class="input">
                          <option :value="0">待确认</option>
                          <option :value="1">发放中</option>
                          <option :value="2">有效</option>
                          <option :value="3">无效</option>
                        </select>
                        <button
                          type="button"
                          class="btn primary"
                          :disabled="updatingComm || editCommStatus === detail.commission_status"
                          @click="doUpdateComm"
                        >
                          {{ updatingComm ? '更新中…' : '更新' }}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <template v-if="detail.commission_log?.length">
                <section class="detail-card">
                  <h3 class="card-title">佣金日志</h3>
                  <div class="mini-table-wrap">
                    <table class="table table-sm">
                      <thead>
                        <tr><th>ID</th><th>邀请人</th><th>订单金额</th><th>佣金</th><th>时间</th></tr>
                      </thead>
                      <tbody>
                        <tr v-for="log in detail.commission_log" :key="log.id">
                          <td>{{ log.id }}</td>
                          <td>#{{ log.invite_user_id }}</td>
                          <td>¥{{ fmtAmount(log.order_amount) }}</td>
                          <td class="amount">¥{{ fmtAmount(log.get_amount) }}</td>
                          <td>{{ fmtTime(log.created_at) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              </template>

              <template v-if="detail.surplus_orders?.length">
                <section class="detail-card">
                  <h3 class="card-title">折抵订单</h3>
                  <div class="mini-table-wrap">
                    <table class="table table-sm">
                      <thead>
                        <tr><th>ID</th><th>订单号</th><th>金额</th><th>状态</th></tr>
                      </thead>
                      <tbody>
                        <tr v-for="so in detail.surplus_orders" :key="so.id">
                          <td>{{ so.id }}</td>
                          <td class="mono">{{ so.trade_no }}</td>
                          <td>¥{{ fmtAmount(so.total_amount) }}</td>
                          <td>
                            <span class="status" :class="'status-' + so.status">{{ statusLabel(so.status) }}</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              </template>

              <div class="detail-footer">
                <button type="button" class="btn" @click="showDetail = false">关闭</button>
                <template v-if="detail.status === 0">
                  <button type="button" class="btn danger-solid" @click="askCancel(detail)">取消订单</button>
                  <button type="button" class="btn primary" @click="askPaid(detail)">确认收款</button>
                </template>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 分配订单 -->
    <Teleport to="body">
      <div v-if="showAssign" class="modal-mask" @click.self="showAssign = false">
        <div class="modal">
          <div class="modal-header">
            <div>
              <h2>分配订单</h2>
              <p class="modal-sub">为指定用户手动创建并开通订阅订单。</p>
            </div>
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
                <option value="">请选择订阅</option>
                <option v-for="p in plans" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </div>
            <div class="form-row">
              <label>周期 <span class="req">*</span></label>
              <select v-model="assignForm.period" class="input" required>
                <option value="">请选择周期</option>
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
            <p v-if="assignErr" class="field-error">{{ assignErr }}</p>
            <div class="modal-footer">
              <button type="button" class="btn" @click="showAssign = false">取消</button>
              <button type="submit" class="btn primary" :disabled="assigning">
                {{ assigning ? '提交中…' : '提交' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- 确认弹窗 -->
    <Teleport to="body">
      <div v-if="confirmAction" class="modal-mask" @click.self="confirmAction = null">
        <div class="modal confirm-modal">
          <div class="modal-header">
            <h2>{{ confirmAction.type === 'paid' ? '确认收款' : '取消订单' }}</h2>
            <button class="modal-close" @click="confirmAction = null">&times;</button>
          </div>
          <div class="modal-body">
            <p class="confirm-text">
              <template v-if="confirmAction.type === 'paid'">
                确认手动标记订单 <strong class="mono">{{ confirmAction.order.trade_no }}</strong> 为已支付？将触发订阅开通。
              </template>
              <template v-else>
                确认取消订单 <strong class="mono">{{ confirmAction.order.trade_no }}</strong>？
              </template>
            </p>
            <div class="modal-footer">
              <button type="button" class="btn" @click="confirmAction = null">返回</button>
              <button
                type="button"
                class="btn"
                :class="confirmAction.type === 'paid' ? 'primary' : 'danger-solid'"
                :disabled="acting"
                @click="runConfirm"
              >
                {{ acting ? '处理中…' : '确认' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <p v-if="toastMessage" class="toast" :class="{ error: toastError }">{{ toastMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  fetchAdminOrders,
  fetchAdminOrderDetail,
  paidAdminOrder,
  cancelAdminOrder,
  updateAdminOrder,
  assignAdminOrder,
  fetchAdminPlans,
  type AdminOrderRow,
  type AdminOrderDetail,
  type AdminPlan,
  type OrderFilter,
  type PageResult
} from '../../api/admin'

const route = useRoute()
const router = useRouter()

const PERIOD_LABELS: Record<string, string> = {
  month_price: '月付',
  quarter_price: '季付',
  half_year_price: '半年付',
  year_price: '年付',
  two_year_price: '两年付',
  three_year_price: '三年付',
  onetime_price: '一次性',
  reset_price: '流量重置',
  deposit: '钱包充值'
}
const STATUS_LABELS = ['待支付', '开通中', '已取消', '已完成', '已折抵']
const TYPE_LABELS: Record<number, string> = { 1: '新购', 2: '续费', 3: '升级', 4: '流量重置', 9: '充值' }
const COMM_STATUS_LABELS: Record<number, string> = { 0: '待确认', 1: '发放中', 2: '有效', 3: '无效' }

const rows = ref<AdminOrderRow[]>([])
const total = ref(0)
const loading = ref(true)
const currentPage = ref(1)
const pageSize = ref(10)
const isCommission = ref(false)
const searchKey = ref('trade_no')
const searchValue = ref('')
const activeFilters = ref<OrderFilter[]>([])
const statusQuick = ref<string | number | 'all'>('all')

/** 文本类字段走模糊；ID / 状态类走精确匹配 */
const EXACT_KEYS = new Set(['user_id', 'invite_user_id', 'status', 'commission_status'])

const searchPlaceholder = computed(() => {
  switch (searchKey.value) {
    case 'trade_no':
      return '模糊搜索订单号…'
    case 'email':
      return '模糊搜索用户邮箱…'
    case 'callback_no':
      return '模糊搜索回调单号…'
    case 'user_id':
      return '输入用户 ID…'
    case 'invite_user_id':
      return '输入邀请人 ID…'
    default:
      return '输入搜索内容…'
  }
})

const showDetail = ref(false)
const detail = ref<AdminOrderDetail | null>(null)
const detailLoading = ref(false)
const editCommStatus = ref(0)
const updatingComm = ref(false)

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

const menuOrder = ref<AdminOrderRow | null>(null)
const menuStyle = ref<Record<string, string>>({})
const menuTriggers = new Map<number, HTMLElement>()

const confirmAction = ref<{ type: 'paid' | 'cancel'; order: AdminOrderRow } | null>(null)
const acting = ref(false)

const toastMessage = ref('')
const toastError = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | null = null

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const pagePending = computed(() => rows.value.filter((o) => o.status === 0).length)
const pageDone = computed(() => rows.value.filter((o) => o.status === 3).length)
const pageAmountText = computed(() =>
  (rows.value.reduce((n, o) => n + (o.total_amount || 0), 0) / 100).toFixed(2)
)

const statusTabs = [
  { value: 'all' as const, label: '全部' },
  { value: 0, label: '待支付' },
  { value: 1, label: '开通中' },
  { value: 3, label: '已完成' },
  { value: 2, label: '已取消' }
]

function showToast(msg: string, error = false) {
  toastMessage.value = msg
  toastError.value = error
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    if (toastMessage.value === msg) toastMessage.value = ''
  }, 2600)
}

function periodLabel(p: string) {
  return PERIOD_LABELS[p] || p
}
function statusLabel(s: number) {
  return STATUS_LABELS[s] ?? `未知(${s})`
}
function typeLabel(t: number) {
  return TYPE_LABELS[t] ?? `未知(${t})`
}
function commStatusLabel(s: number) {
  return COMM_STATUS_LABELS[s] ?? `未知(${s})`
}
function fmtAmount(v: number | null | undefined) {
  return v != null ? (v / 100).toFixed(2) : '0.00'
}
function moneyOrDash(v: number | null | undefined) {
  if (v == null || v === 0) return '—'
  return `¥${fmtAmount(v)}`
}
function fmtTime(ts: number | null | undefined) {
  if (!ts) return '—'
  const d = new Date(ts * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function shortTrade(no: string) {
  if (!no || no.length <= 16) return no
  return `${no.slice(0, 8)}…${no.slice(-6)}`
}

async function copyTradeNo(no: string) {
  try {
    await navigator.clipboard.writeText(no)
    showToast('订单号已复制')
  } catch {
    showToast('复制失败', true)
  }
}

async function load() {
  loading.value = true
  try {
    const res: PageResult<AdminOrderRow> = await fetchAdminOrders(
      currentPage.value,
      pageSize.value,
      activeFilters.value,
      isCommission.value
    )
    rows.value = res.data || []
    total.value = Number(res.total) || 0
  } catch (e) {
    showToast(e instanceof Error ? e.message : '加载失败', true)
  } finally {
    loading.value = false
  }
}

function buildFilters(): OrderFilter[] {
  const filters: OrderFilter[] = []
  const value = String(searchValue.value ?? '').trim()
  if (value) {
    filters.push({
      key: searchKey.value,
      condition: EXACT_KEYS.has(searchKey.value) ? '=' : '模糊',
      value
    })
  }
  if (statusQuick.value !== 'all') {
    const hasStatus = filters.some((f) => f.key === 'status')
    if (!hasStatus) {
      filters.push({ key: 'status', condition: '=', value: String(statusQuick.value) })
    }
  }
  return filters
}

function onSearchKeyChange() {
  searchValue.value = ''
}

function doSearch() {
  activeFilters.value = buildFilters()
  currentPage.value = 1
  load()
}

function clearSearch() {
  searchKey.value = 'trade_no'
  searchValue.value = ''
  activeFilters.value = []
  isCommission.value = false
  statusQuick.value = 'all'
  currentPage.value = 1
  load()
}

function applyStatusQuick(value: string | number) {
  statusQuick.value = value
  // 状态用下方快捷筛选，避免与搜索栏状态字段冲突
  if (searchKey.value === 'status' || searchKey.value === 'commission_status') {
    /* keep */
  }
  activeFilters.value = buildFilters()
  currentPage.value = 1
  load()
}

function goPage(p: number) {
  if (p < 1 || p > totalPages.value) return
  currentPage.value = p
  load()
}

function setMenuTrigger(id: number, el: unknown) {
  if (el instanceof HTMLElement) menuTriggers.set(id, el)
  else menuTriggers.delete(id)
}

function closeMenu() {
  menuOrder.value = null
}

function positionMenu(order: AdminOrderRow) {
  const trigger = menuTriggers.get(order.id)
  if (!trigger) return
  const rect = trigger.getBoundingClientRect()
  const menuWidth = 128
  const menuHeight = 120
  const pad = 8
  let left = rect.right - menuWidth
  let top = rect.bottom + 4
  if (left < pad) left = pad
  if (left + menuWidth > window.innerWidth - pad) left = window.innerWidth - menuWidth - pad
  if (top + menuHeight > window.innerHeight - pad) top = Math.max(pad, rect.top - menuHeight - 4)
  menuStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    zIndex: '4000'
  }
}

function toggleMenu(order: AdminOrderRow) {
  if (menuOrder.value?.id === order.id) {
    closeMenu()
    return
  }
  menuOrder.value = order
  requestAnimationFrame(() => positionMenu(order))
}

async function openDetail(o: AdminOrderRow) {
  showDetail.value = true
  detailLoading.value = true
  detail.value = null
  try {
    detail.value = await fetchAdminOrderDetail(o.id)
    editCommStatus.value = detail.value.commission_status ?? 0
  } catch (e) {
    showToast(e instanceof Error ? e.message : '加载详情失败', true)
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
    showToast('佣金状态已更新')
    await load()
  } catch (e) {
    showToast(e instanceof Error ? e.message : '更新失败', true)
  } finally {
    updatingComm.value = false
  }
}

function askPaid(o: AdminOrderRow) {
  confirmAction.value = { type: 'paid', order: o }
}

function askCancel(o: AdminOrderRow) {
  confirmAction.value = { type: 'cancel', order: o }
}

async function runConfirm() {
  if (!confirmAction.value) return
  acting.value = true
  const { type, order } = confirmAction.value
  try {
    if (type === 'paid') {
      await paidAdminOrder(order.trade_no)
      showToast('已确认收款')
    } else {
      await cancelAdminOrder(order.trade_no)
      showToast('订单已取消')
    }
    confirmAction.value = null
    await load()
    if (showDetail.value && detail.value?.id === order.id) {
      await openDetail(order)
    }
  } catch (e) {
    showToast(e instanceof Error ? e.message : '操作失败', true)
  } finally {
    acting.value = false
  }
}

async function openAssign(prefillEmail = '') {
  assignForm.email = prefillEmail || ''
  assignForm.plan_id = ''
  assignForm.period = ''
  assignForm.amount = 0
  assignErr.value = ''
  showAssign.value = true
  if (!plans.value.length) {
    try {
      plans.value = await fetchAdminPlans()
    } catch (e) {
      console.error(e)
    }
  }
}

function applyRouteQuery() {
  const q = route.query
  if (q.user_id != null && String(q.user_id)) {
    searchKey.value = 'user_id'
    searchValue.value = String(q.user_id)
    activeFilters.value = [{ key: 'user_id', condition: '=', value: String(q.user_id) }]
  } else if (q.email != null && String(q.email)) {
    searchKey.value = 'email'
    searchValue.value = String(q.email)
    activeFilters.value = [{ key: 'email', condition: '模糊', value: String(q.email) }]
  }
  if (q.assign_email != null && String(q.assign_email)) {
    void openAssign(String(q.assign_email))
  }
}

function clearRouteQuery() {
  if (!Object.keys(route.query).length) return
  router.replace({ path: route.path, query: {} })
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
    showToast(`订单创建成功：${tradeNo}`)
    await load()
  } catch (e) {
    assignErr.value = e instanceof Error ? e.message : '创建失败'
  } finally {
    assigning.value = false
  }
}

function onDocClick(e: MouseEvent) {
  const t = e.target as HTMLElement
  if (t.closest('.menu-trigger') || t.closest('.order-action-menu')) return
  closeMenu()
}

function onViewportChange() {
  if (menuOrder.value) positionMenu(menuOrder.value)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  closeMenu()
  confirmAction.value = null
  if (showDetail.value) showDetail.value = false
  if (showAssign.value) showAssign.value = false
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', onViewportChange)
  document.addEventListener('click', onDocClick)
  document.addEventListener('scroll', onViewportChange, true)
  applyRouteQuery()
  load().finally(() => {
    // 消费掉预填 query，避免返回页面重复弹分配窗
    if (route.query.assign_email || route.query.user_id || route.query.email) {
      clearRouteQuery()
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', onViewportChange)
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('scroll', onViewportChange, true)
  if (toastTimer) clearTimeout(toastTimer)
})
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: var(--text-main, #0f172a);
  letter-spacing: -0.02em;
}

.page-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--text-muted, #64748b);
}

.header-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.stat-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 14px 16px;
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.04));
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-label { font-size: 12px; font-weight: 700; color: #94a3b8; }
.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.03em;
}
.stat-value.accent { color: #2563eb; }
.stat-value.ok { color: #059669; }
.stat-value.warn { color: #d97706; }

.toolbar-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.04));
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.search-select,
.search-input {
  height: 38px;
  padding: 0 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  color: #0f172a;
  font-size: 13px;
  font-weight: 600;
  box-sizing: border-box;
  width: auto;
  flex: 0 0 auto;
}

.search-select {
  min-width: 120px;
  max-width: 140px;
}

.search-input {
  min-width: 160px;
  flex: 1 1 180px;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 260px;
  min-width: 200px;
  height: 38px;
  padding: 0 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  color: #94a3b8;
}

.search-field:focus-within {
  border-color: #93c5fd;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.search-text {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: #0f172a;
  font-weight: 500;
}

.toolbar-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 2px;
}

.filters { display: flex; gap: 8px; flex-wrap: wrap; }

.filter-btn {
  padding: 7px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #fff;
  color: #64748b;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}

.filter-btn.active {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.commission-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 12px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #fff;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  font-weight: 600;
  user-select: none;
}

.commission-toggle.on {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.commission-toggle input {
  margin: 0;
  accent-color: #2563eb;
}

.panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: visible;
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.04));
}

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 48px 20px;
  text-align: center;
  color: #64748b;
}

.state-box.compact { padding: 28px; }
.state-box h3 { margin: 0; font-size: 16px; font-weight: 800; color: #0f172a; }
.state-box p { margin: 0; font-size: 13px; color: #94a3b8; }

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 0.8s linear infinite; }

.table-wrap {
  overflow-x: auto;
  border-radius: 16px 16px 0 0;
}

.table {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
}

.table th,
.table td {
  border-bottom: 1px solid #f1f5f9;
  padding: 12px 12px;
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
  background: #fff;
}

.table th {
  background: #f8fafc;
  color: #64748b;
  font-weight: 700;
  font-size: 12px;
  position: sticky;
  top: 0;
  z-index: 2;
}

.table tbody tr:hover td { background: #f8fafc; }

.table-sm { width: 100%; min-width: 0; font-size: 12px; }
.table-sm th, .table-sm td { padding: 8px 10px; }

.id-cell { color: #94a3b8; font-weight: 600; }
.plan-cell { max-width: 160px; overflow: hidden; text-overflow: ellipsis; }
.amount { font-weight: 800; color: #0f172a; font-variant-numeric: tabular-nums; }
.time-cell { color: #64748b; font-variant-numeric: tabular-nums; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; }

.trade-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  color: #334155;
}

.trade-btn code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  font-weight: 600;
}

.trade-btn span {
  font-size: 11px;
  font-weight: 700;
  color: #2563eb;
}

.tag {
  display: inline-flex;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.tag-type-1 { background: #eff6ff; color: #2563eb; }
.tag-type-2 { background: #ecfdf5; color: #059669; }
.tag-type-3 { background: #fffbeb; color: #d97706; }
.tag-type-4 { background: #fdf4ff; color: #a21caf; }
.tag-type-9 { background: #f5f3ff; color: #6d28d9; }

.status, .comm-status {
  display: inline-flex;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status-0 { background: #fffbeb; color: #d97706; }
.status-1 { background: #eff6ff; color: #2563eb; }
.status-2 { background: #f1f5f9; color: #64748b; }
.status-3 { background: #ecfdf5; color: #059669; }
.status-4 { background: #fef2f2; color: #dc2626; }

.comm-0 { background: #fffbeb; color: #d97706; }
.comm-1 { background: #eff6ff; color: #2563eb; }
.comm-2 { background: #ecfdf5; color: #059669; }
.comm-3 { background: #fef2f2; color: #dc2626; }

.sticky-right {
  position: sticky;
  right: 0;
  z-index: 3;
  box-shadow: -8px 0 12px -8px rgba(15, 23, 42, 0.18);
}

.table th.sticky-right { z-index: 4; background: #f8fafc; }
.table td.sticky-right { background: #fff; }
.table tbody tr:hover td.sticky-right { background: #f8fafc; }

.actions-td { width: 88px; text-align: right; }

.menu-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.order-action-menu {
  min-width: 120px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.16);
  padding: 4px;
  display: flex;
  flex-direction: column;
}

.order-action-menu button {
  border: none;
  background: transparent;
  text-align: left;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
}

.order-action-menu button:hover { background: #f1f5f9; }
.order-action-menu button.ok { color: #059669; }
.order-action-menu button.danger { color: #dc2626; }

.pagination {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
}

.page-info, .page-num { font-size: 13px; color: #64748b; }
.btn-page {
  padding: 5px 12px;
  font-size: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  color: #334155;
  cursor: pointer;
  font-weight: 600;
}
.btn-page:disabled { opacity: 0.4; cursor: not-allowed; }
.page-size { width: 110px; font-size: 12px; padding: 5px 8px; }

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  color: #0f172a;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}
.btn:hover:not(:disabled) { background: #f8fafc; }
.btn:disabled { opacity: 0.55; cursor: not-allowed; }
.btn.primary { background: #2563eb; border-color: #2563eb; color: #fff; }
.btn.primary:hover:not(:disabled) { background: #1d4ed8; }
.btn.danger-solid { background: #dc2626; border-color: #dc2626; color: #fff; }

.btn-sm {
  padding: 4px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  background: #fff;
  color: #334155;
}
.btn-sm.primary { background: #2563eb; border-color: #2563eb; color: #fff; }

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal {
  background: #fff;
  border-radius: 16px;
  width: min(520px, 96vw);
  max-height: 90vh;
  overflow: auto;
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
}

.modal-wide { width: min(720px, 96vw); }
.confirm-modal { width: min(440px, 96vw); }

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #f1f5f9;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 2;
}

.modal-header h2 { margin: 0; font-size: 17px; font-weight: 800; }
.modal-sub { margin: 4px 0 0; font-size: 12px; color: #94a3b8; }
.modal-close {
  border: none;
  background: #f1f5f9;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  font-size: 20px;
  line-height: 1;
  color: #64748b;
  cursor: pointer;
  flex-shrink: 0;
}
.modal-close:hover { background: #e2e8f0; color: #0f172a; }

.modal-body {
  padding: 18px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-header { align-items: flex-start; }
.detail-header-main { min-width: 0; flex: 1; }
.detail-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.trade-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  min-width: 0;
}
.trade-no {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 4px 8px;
}
.icon-btn {
  display: inline-grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  color: #64748b;
  cursor: pointer;
  flex-shrink: 0;
}
.icon-btn:hover { border-color: #bfdbfe; color: #2563eb; background: #eff6ff; }

.detail-body { gap: 16px; }

.detail-hero {
  display: flex;
  align-items: stretch;
  gap: 14px;
  padding: 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 55%, #ecfdf5 100%);
  border: 1px solid #e2e8f0;
}

.hero-amount {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  min-width: 140px;
  padding-right: 14px;
  border-right: 1px solid rgba(148, 163, 184, 0.35);
}
.hero-label {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}
.hero-amount strong {
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-content: center;
  flex: 1;
}
.hero-chip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 96px;
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(226, 232, 240, 0.9);
}
.hero-chip span {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
}
.hero-chip b {
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
}
.hero-chip-user {
  flex: 1.6;
  min-width: 220px;
  max-width: 100%;
}
.hero-chip-user .user-line {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hero-chip-user .user-email {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hero-chip-user .user-sep {
  flex-shrink: 0;
  color: #cbd5e1;
  font-weight: 700;
}
.hero-chip-user .user-id {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  font-variant-numeric: tabular-nums;
}
.hero-chip-user .user-remarks {
  flex-shrink: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}

.detail-sections {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 12px;
}

.detail-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px;
}
.detail-card.full { grid-column: 1 / -1; }

.card-title {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
}
.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}
.card-title-row .card-title { margin: 0; }

.money-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.money-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
}
.money-item.highlight {
  background: #eff6ff;
  border-color: #dbeafe;
}
.money-item.muted span { color: #cbd5e1; }
.money-item label {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
}
.money-item span {
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}
.money-item.highlight span { color: #1d4ed8; }

.info-list { display: flex; flex-direction: column; gap: 0; }
.info-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
}
.info-row:last-child { border-bottom: 0; padding-bottom: 0; }
.info-row:first-child { padding-top: 0; }
.info-row label {
  color: #94a3b8;
  font-weight: 700;
  flex-shrink: 0;
}
.info-row span {
  color: #0f172a;
  font-weight: 600;
  text-align: right;
}
.info-row .wrap {
  white-space: normal;
  word-break: break-all;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.comm-panel {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 12px;
  align-items: stretch;
}
.comm-amount-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
}
.comm-amount-box label,
.comm-edit-box label {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
}
.comm-amount-box strong {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}
.comm-amount-box small {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}
.comm-edit-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}
.comm-edit {
  display: flex;
  gap: 8px;
  align-items: center;
}
.comm-edit .input { flex: 1; }

.mini-table-wrap {
  overflow-x: auto;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
}
.table-sm { width: 100%; min-width: 0; }
.table-sm th,
.table-sm td {
  padding: 10px 12px;
  white-space: nowrap;
}

.detail-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
  border-top: 1px solid #f1f5f9;
}

.form-row { display: flex; flex-direction: column; gap: 6px; }
.form-row label { font-size: 13px; color: #64748b; font-weight: 600; }
.req { color: #ef4444; }

.input {
  width: 100%;
  padding: 9px 12px;
  font-size: 13px;
  color: #0f172a;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-sizing: border-box;
}
.input:focus {
  outline: none;
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}
.input-sm { width: auto; padding: 5px 8px; font-size: 12px; }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
}

.field-error { margin: 0; font-size: 12px; color: #dc2626; font-weight: 600; }
.confirm-text { margin: 0; font-size: 14px; color: #334155; line-height: 1.6; }

.toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background: #1e293b;
  color: #fff;
  padding: 12px 22px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  z-index: 5000;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.25);
}
.toast.error { background: #dc2626; }

@media (max-width: 900px) {
  .stat-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .detail-sections { grid-template-columns: 1fr; }
  .money-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .comm-panel { grid-template-columns: 1fr; }
  .detail-hero { flex-direction: column; }
  .hero-amount {
    border-right: 0;
    border-bottom: 1px solid rgba(148, 163, 184, 0.35);
    padding-right: 0;
    padding-bottom: 12px;
  }
}

@media (max-width: 640px) {
  .page-header { flex-direction: column; }
  .detail-footer { flex-wrap: wrap; }
  .detail-footer .btn { flex: 1; justify-content: center; }
}
</style>
