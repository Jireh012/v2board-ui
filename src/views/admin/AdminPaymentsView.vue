<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">支付配置</h1>
        <p class="page-subtitle">管理收银台支付方式、网关参数与回调通知地址。</p>
      </div>
      <div class="header-actions">
        <button type="button" class="btn" :disabled="loading" @click="load" title="刷新列表">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :class="{ spinning: loading }"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
          刷新
        </button>
        <button type="button" class="btn primary" @click="openAdd">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          添加支付方式
        </button>
      </div>
    </div>

    <div class="stat-row" v-if="!loading">
      <div class="stat-card">
        <span class="stat-label">支付方式</span>
        <strong class="stat-value">{{ rows.length }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">已启用</span>
        <strong class="stat-value ok">{{ enabledCount }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">已停用</span>
        <strong class="stat-value muted">{{ rows.length - enabledCount }}</strong>
      </div>
    </div>

    <div class="toolbar" v-if="!loading && rows.length">
      <div class="filters">
        <button
          v-for="ft in filterTabs"
          :key="ft.value"
          type="button"
          class="filter-btn"
          :class="{ active: filter === ft.value }"
          @click="filter = ft.value"
        >
          <span>{{ ft.label }}</span>
          <em>{{ ft.count }}</em>
        </button>
      </div>
    </div>

    <div class="panel">
      <div v-if="loading" class="state-box">
        <div class="spinner"></div>
        <p>加载支付方式…</p>
      </div>
      <div v-else-if="!rows.length" class="state-box empty">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/></svg>
        </div>
        <h3>暂无支付方式</h3>
        <p>添加网关后，用户下单时可选择对应支付渠道。</p>
        <button type="button" class="btn primary" @click="openAdd">添加第一个支付方式</button>
      </div>
      <div v-else-if="!filtered.length" class="state-box empty compact">
        <h3>没有匹配的支付方式</h3>
        <p>试试切换启用状态筛选。</p>
        <button type="button" class="btn" @click="filter = 'all'">显示全部</button>
      </div>
      <div v-else class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th style="width:52px">#</th>
              <th>名称</th>
              <th>驱动</th>
              <th>手续费</th>
              <th>状态</th>
              <th>通知地址</th>
              <th class="col-actions sticky-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, idx) in filtered" :key="p.id">
              <td class="id-cell">{{ idx + 1 }}</td>
              <td>
                <div class="name-cell">
                  <img v-if="p.icon" :src="p.icon" alt="" class="pay-icon" />
                  <div class="name-text">
                    <span class="name">{{ p.name }}</span>
                    <span class="meta">UUID {{ shortUuid(p.uuid) }}</span>
                  </div>
                </div>
              </td>
              <td><span class="driver-badge">{{ p.payment }}</span></td>
              <td class="fee-cell">{{ fmtFee(p) }}</td>
              <td>
                <span class="status" :class="p.enable === 1 ? 'status-on' : 'status-off'">
                  {{ p.enable === 1 ? '启用' : '停用' }}
                </span>
              </td>
              <td>
                <button
                  type="button"
                  class="url-btn"
                  :title="p.notify_url"
                  @click="copyUrl(p.notify_url)"
                >
                  <span>{{ shortUrl(p.notify_url) }}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16V4a2 2 0 0 1 2-2h12"/></svg>
                </button>
              </td>
              <td class="actions-td sticky-right">
                <button
                  type="button"
                  class="link-btn"
                  :class="p.enable === 1 ? 'warn' : 'ok'"
                  :disabled="togglingId === p.id"
                  @click="doToggle(p)"
                >
                  {{ p.enable === 1 ? '停用' : '启用' }}
                </button>
                <button type="button" class="link-btn" @click="openEdit(p)">编辑</button>
                <button type="button" class="link-btn danger" @click="askDrop(p)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showModal" class="modal-mask" @click.self="closeModal">
        <div
          class="modal edit-modal"
          role="dialog"
          aria-modal="true"
          style="width: min(720px, calc(100vw - 48px)); max-width: calc(100vw - 48px);"
        >
          <div class="modal-header">
            <div>
              <h2>{{ editId ? '编辑支付方式' : '添加支付方式' }}</h2>
              <p class="modal-sub">配置显示名称、网关驱动与回调域名；网关密钥仅保存在服务端。</p>
            </div>
            <button type="button" class="modal-close" @click="closeModal">&times;</button>
          </div>
          <form class="edit-form" @submit.prevent="doSave">
            <div class="form-grid">
              <div class="form-row">
                <label>显示名称 <span class="req">*</span></label>
                <input v-model="form.name" class="input" placeholder="如：支付宝" required />
              </div>
              <div class="form-row">
                <label>支付网关 <span class="req">*</span></label>
                <select v-model="form.payment" class="input" required @change="onPaymentChange">
                  <option value="">-- 请选择 --</option>
                  <option v-for="m in methods" :key="m" :value="m">{{ m }}</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <label>图标 URL</label>
              <input v-model="form.icon" class="input" placeholder="可选，支付图标地址" />
            </div>
            <div class="form-row">
              <label>自定义通知域名</label>
              <input v-model="form.notify_domain" class="input" placeholder="留空则使用站点地址" />
            </div>
            <div class="form-grid">
              <div class="form-row">
                <label>固定手续费（分）</label>
                <input v-model.number="form.handling_fee_fixed" type="number" min="0" class="input" />
              </div>
              <div class="form-row">
                <label>百分比手续费 (%)</label>
                <input v-model.number="form.handling_fee_percent" type="number" min="0" step="0.1" class="input" />
              </div>
            </div>

            <template v-if="formFields && Object.keys(formFields).length">
              <div class="config-block">
                <div class="config-title">网关配置</div>
                <div v-for="(field, key) in formFields" :key="key" class="form-row">
                  <label>{{ field.label }}</label>
                  <input
                    v-model="configValues[key]"
                    class="input"
                    :placeholder="field.description || ''"
                    autocomplete="off"
                  />
                  <p v-if="field.description" class="field-desc">{{ field.description }}</p>
                </div>
              </div>
            </template>

            <p v-if="errMsg" class="form-error">{{ errMsg }}</p>
            <div class="modal-footer">
              <button type="button" class="btn" @click="closeModal">取消</button>
              <button type="submit" class="btn primary" :disabled="saving">
                {{ saving ? '保存中…' : '保存' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="dropTarget" class="modal-mask" @click.self="dropTarget = null">
        <div class="modal confirm-modal" role="dialog" aria-modal="true">
          <div class="modal-header">
            <div>
              <h2>删除支付方式</h2>
              <p class="modal-sub">此操作不可恢复</p>
            </div>
            <button type="button" class="modal-close" @click="dropTarget = null">&times;</button>
          </div>
          <div class="modal-body">
            <p>确认删除「{{ dropTarget.name }}」？删除后相关下单通道将不可用。</p>
            <div class="modal-footer">
              <button type="button" class="btn" @click="dropTarget = null">取消</button>
              <button type="button" class="btn danger-solid" :disabled="dropping" @click="confirmDrop">
                {{ dropping ? '删除中…' : '确认删除' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="toastMessage" class="toast" :class="{ error: toastError }">{{ toastMessage }}</div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  fetchPayments, fetchPaymentMethods, fetchPaymentForm,
  savePayment, togglePayment, dropPayment,
  type AdminPayment, type FormField
} from '../../api/admin/payment'
import { copyText } from '../../utils/clipboard'

const loading = ref(true)
const rows = ref<AdminPayment[]>([])
const methods = ref<string[]>([])
const filter = ref<'all' | 'on' | 'off'>('all')
const togglingId = ref<number | null>(null)

const showModal = ref(false)
const saving = ref(false)
const errMsg = ref('')
const editId = ref<number | null>(null)
const form = reactive({
  name: '',
  icon: '',
  payment: '',
  notify_domain: '',
  handling_fee_fixed: 0,
  handling_fee_percent: 0
})
const formFields = ref<Record<string, FormField>>({})
const configValues = reactive<Record<string, string>>({})

const dropTarget = ref<AdminPayment | null>(null)
const dropping = ref(false)

const toastMessage = ref('')
const toastError = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | null = null

const enabledCount = computed(() => rows.value.filter((p) => p.enable === 1).length)
const filtered = computed(() => {
  if (filter.value === 'on') return rows.value.filter((p) => p.enable === 1)
  if (filter.value === 'off') return rows.value.filter((p) => p.enable !== 1)
  return rows.value
})
const filterTabs = computed(() => [
  { value: 'all' as const, label: '全部', count: rows.value.length },
  { value: 'on' as const, label: '启用', count: enabledCount.value },
  { value: 'off' as const, label: '停用', count: rows.value.length - enabledCount.value }
])

function showToast(msg: string, error = false) {
  toastMessage.value = msg
  toastError.value = error
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    if (toastMessage.value === msg) toastMessage.value = ''
  }, 2600)
}

async function load() {
  loading.value = true
  try {
    const [list, m] = await Promise.all([fetchPayments(), fetchPaymentMethods()])
    rows.value = list || []
    methods.value = m || []
  } catch (e) {
    showToast(e instanceof Error ? e.message : '加载失败', true)
  } finally {
    loading.value = false
  }
}

function fmtFee(p: AdminPayment) {
  const parts: string[] = []
  if (p.handling_fee_percent) parts.push(`${p.handling_fee_percent}%`)
  if (p.handling_fee_fixed) parts.push(`${(p.handling_fee_fixed / 100).toFixed(2)} 元`)
  return parts.length ? parts.join(' + ') : '—'
}

function shortUuid(uuid?: string) {
  if (!uuid) return '—'
  return uuid.length > 12 ? `${uuid.slice(0, 8)}…` : uuid
}

function shortUrl(url?: string) {
  if (!url) return '—'
  try {
    const u = new URL(url)
    const path = u.pathname.length > 28 ? `${u.pathname.slice(0, 28)}…` : u.pathname
    return `${u.host}${path}`
  } catch {
    return url.length > 36 ? `${url.slice(0, 36)}…` : url
  }
}

async function copyUrl(url: string) {
  if (!url) {
    showToast('暂无通知地址', true)
    return
  }
  try {
    await copyText(url)
    showToast('通知地址已复制')
  } catch {
    showToast('复制失败，请手动复制', true)
  }
}

function closeModal() {
  showModal.value = false
}

function openAdd() {
  editId.value = null
  form.name = ''
  form.icon = ''
  form.payment = ''
  form.notify_domain = ''
  form.handling_fee_fixed = 0
  form.handling_fee_percent = 0
  formFields.value = {}
  clearConfig()
  errMsg.value = ''
  showModal.value = true
}

async function openEdit(p: AdminPayment) {
  editId.value = p.id
  form.name = p.name
  form.icon = p.icon || ''
  form.payment = p.payment
  form.notify_domain = p.notify_domain || ''
  form.handling_fee_fixed = p.handling_fee_fixed || 0
  form.handling_fee_percent = p.handling_fee_percent || 0
  errMsg.value = ''
  clearConfig()
  showModal.value = true
  await loadForm(p.payment, p.id)
}

async function onPaymentChange() {
  clearConfig()
  formFields.value = {}
  if (!form.payment) return
  if (editId.value) {
    await loadForm(form.payment, editId.value)
  } else {
    formFields.value = getStaticForm(form.payment)
  }
}

async function loadForm(payment: string, id: number) {
  try {
    const data = await fetchPaymentForm(payment, id)
    if (data && data.length > 0) {
      formFields.value = data[0] as unknown as Record<string, FormField>
      for (const key of Object.keys(formFields.value)) {
        const f = formFields.value[key]
        configValues[key] = (f.value as string) || ''
      }
    }
  } catch (e) {
    showToast(e instanceof Error ? e.message : '加载网关表单失败', true)
  }
}

function getStaticForm(payment: string): Record<string, FormField> {
  const forms: Record<string, Record<string, FormField>> = {
    AlipayF2F: {
      app_id: { label: '支付宝APPID', description: '', type: 'input' },
      private_key: { label: '支付宝私钥', description: '', type: 'input' },
      public_key: { label: '支付宝公钥', description: '', type: 'input' },
      product_name: { label: '自定义商品名称', description: '将会体现在支付宝账单中', type: 'input' }
    },
    WechatPayNative: {
      app_id: { label: 'APPID', description: '绑定微信支付商户的APPID', type: 'input' },
      mch_id: { label: '商户号', description: '微信支付商户号', type: 'input' },
      api_key: { label: 'APIKEY(v1)', description: '', type: 'input' }
    },
    EPay: {
      url: { label: 'URL', description: '', type: 'input' },
      pid: { label: 'PID', description: '', type: 'input' },
      key: { label: 'KEY', description: '', type: 'input' },
      type: { label: 'TYPE', description: '支付类型，如: alipay, wxpay, qqpay', type: 'input' }
    },
    MGate: {
      mgate_url: { label: 'API地址', description: '', type: 'input' },
      mgate_app_id: { label: 'APPID', description: '', type: 'input' },
      mgate_app_secret: { label: 'AppSecret', description: '', type: 'input' },
      mgate_source_currency: { label: '源货币', description: '默认CNY', type: 'input' }
    },
    StripeAlipay: {
      currency: { label: '货币单位', description: '', type: 'input' },
      stripe_sk_live: { label: 'SK_LIVE', description: '', type: 'input' },
      stripe_webhook_key: { label: 'WebHook密钥签名', description: '', type: 'input' }
    },
    StripeWepay: {
      currency: { label: '货币单位', description: '', type: 'input' },
      stripe_sk_live: { label: 'SK_LIVE', description: '', type: 'input' },
      stripe_webhook_key: { label: 'WebHook密钥签名', description: '', type: 'input' }
    },
    StripeCredit: {
      currency: { label: '货币单位', description: '', type: 'input' },
      stripe_sk_live: { label: 'SK_LIVE', description: '', type: 'input' },
      stripe_pk_live: { label: 'PK_LIVE', description: '', type: 'input' },
      stripe_webhook_key: { label: 'WebHook密钥签名', description: '', type: 'input' }
    },
    StripeCheckout: {
      currency: { label: '货币单位', description: '', type: 'input' },
      stripe_sk_live: { label: 'SK_LIVE', description: 'API 密钥', type: 'input' },
      stripe_pk_live: { label: 'PK_LIVE', description: 'API 公钥', type: 'input' },
      stripe_webhook_key: { label: 'WebHook 密钥签名', description: '', type: 'input' }
    },
    StripeALL: {
      currency: { label: '货币单位', description: '请使用符合ISO 4217标准的三位字母，例如GBP', type: 'input' },
      stripe_sk_live: { label: 'SK_LIVE', description: '', type: 'input' },
      stripe_webhook_key: { label: 'WebHook密钥签名', description: 'whsec_....', type: 'input' },
      payment_method: { label: '支付方式', description: '请输入alipay, wechat_pay, cards', type: 'input' }
    },
    BTCPay: {
      btcpay_url: { label: 'API接口所在网址(包含最后的斜杠)', description: '', type: 'input' },
      btcpay_storeId: { label: 'storeId', description: '', type: 'input' },
      btcpay_api_key: { label: 'API KEY', description: '个人设置中的API KEY(非商店设置中的)', type: 'input' },
      btcpay_webhook_key: { label: 'WEBHOOK KEY', description: '', type: 'input' }
    },
    Coinbase: {
      coinbase_url: { label: '接口地址', description: '', type: 'input' },
      coinbase_api_key: { label: 'API KEY', description: '', type: 'input' },
      coinbase_webhook_key: { label: 'WEBHOOK KEY', description: '', type: 'input' }
    },
    CoinPayments: {
      coinpayments_merchant_id: { label: 'Merchant ID', description: '商户 ID', type: 'input' },
      coinpayments_ipn_secret: { label: 'IPN Secret', description: '通知密钥', type: 'input' },
      coinpayments_currency: { label: '货币代码', description: '填写您的货币代码（大写）', type: 'input' }
    },
    BEasyPaymentUSDT: {
      bepusdt_url: { label: 'API 地址', description: '您的 BEPUSDT API 接口地址(例如: https://xxx.com)', type: 'input' },
      bepusdt_apitoken: { label: 'API Token', description: '您的 BEPUSDT API Token', type: 'input' },
      bepusdt_trade_type: { label: '交易类型', description: '您的 BEPUSDT 交易类型', type: 'input' }
    }
  }
  const def = forms[payment] || {}
  for (const key of Object.keys(def)) {
    configValues[key] = ''
  }
  return def
}

function clearConfig() {
  for (const key of Object.keys(configValues)) {
    delete configValues[key]
  }
}

async function doSave() {
  saving.value = true
  errMsg.value = ''
  try {
    const config: Record<string, string> = {}
    for (const key of Object.keys(configValues)) {
      config[key] = configValues[key]
    }
    const body: Record<string, unknown> = {
      name: form.name,
      icon: form.icon,
      payment: form.payment,
      config,
      notify_domain: form.notify_domain,
      handling_fee_fixed: form.handling_fee_fixed || 0,
      handling_fee_percent: form.handling_fee_percent || 0
    }
    if (editId.value) body.id = editId.value
    await savePayment(body)
    showModal.value = false
    showToast(editId.value ? '已保存' : '已添加')
    await load()
  } catch (e) {
    errMsg.value = e instanceof Error ? e.message : '保存失败'
  } finally {
    saving.value = false
  }
}

async function doToggle(p: AdminPayment) {
  togglingId.value = p.id
  try {
    await togglePayment(p.id)
    showToast(p.enable === 1 ? '已停用' : '已启用')
    await load()
  } catch (e) {
    showToast(e instanceof Error ? e.message : '操作失败', true)
  } finally {
    togglingId.value = null
  }
}

function askDrop(p: AdminPayment) {
  dropTarget.value = p
}

async function confirmDrop() {
  if (!dropTarget.value) return
  dropping.value = true
  try {
    await dropPayment(dropTarget.value.id)
    dropTarget.value = null
    showToast('已删除')
    await load()
  } catch (e) {
    showToast(e instanceof Error ? e.message : '删除失败', true)
  } finally {
    dropping.value = false
  }
}

load()
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.page-title { margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
.page-subtitle { margin: 6px 0 0; font-size: 13px; color: #94a3b8; line-height: 1.5; }
.header-actions { display: flex; gap: 8px; flex-shrink: 0; }

.stat-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.stat-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.stat-label { font-size: 12px; color: #94a3b8; font-weight: 600; }
.stat-value { font-size: 22px; font-weight: 800; color: #0f172a; }
.stat-value.ok { color: #059669; }
.stat-value.muted { color: #94a3b8; }

.toolbar {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 10px 12px;
}
.filters { display: flex; flex-wrap: wrap; gap: 8px; }
.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.filter-btn em {
  font-style: normal;
  background: #e2e8f0;
  color: #475569;
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 11px;
}
.filter-btn.active {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}
.filter-btn.active em { background: #dbeafe; color: #1d4ed8; }

.panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
}

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 56px 20px;
  color: #64748b;
  text-align: center;
}
.state-box.empty { padding: 48px 20px; }
.state-box.compact { padding: 36px 20px; }
.state-box h3 { margin: 0; font-size: 16px; color: #0f172a; }
.state-box p { margin: 0; font-size: 13px; color: #94a3b8; }
.empty-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #f1f5f9;
  color: #64748b;
  display: grid;
  place-items: center;
}
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 0.8s linear infinite; }

.table-wrap { overflow-x: auto; }
.table { width: max-content; min-width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
.table th, .table td {
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
}
.table th {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  background: #f8fafc;
  position: sticky;
  top: 0;
  z-index: 1;
}
.table tbody tr:hover { background: #f8fafc; }
.id-cell { color: #94a3b8; font-weight: 700; }

.name-cell { display: flex; align-items: center; gap: 10px; }
.pay-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
  background: #fff;
  flex-shrink: 0;
}
.name-text { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.name { font-weight: 700; color: #0f172a; }
.meta { font-size: 11px; color: #94a3b8; font-variant-numeric: tabular-nums; }

.driver-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
.fee-cell { color: #475569; font-weight: 600; font-variant-numeric: tabular-nums; }

.status {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}
.status-on { background: #ecfdf5; color: #059669; }
.status-off { background: #fef2f2; color: #dc2626; }

.url-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 280px;
  padding: 5px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
}
.url-btn span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.url-btn:hover { border-color: #bfdbfe; color: #1d4ed8; background: #eff6ff; }

.col-actions { width: 160px; text-align: right; }
.sticky-right { position: sticky; right: 0; background: #fff; z-index: 2; }
.table th.sticky-right { background: #f8fafc; z-index: 3; }
.actions-td {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  box-shadow: -8px 0 12px -10px rgba(15, 23, 42, 0.12);
}
.link-btn {
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}
.link-btn:hover:not(:disabled) { background: #eff6ff; }
.link-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.link-btn.warn { color: #d97706; }
.link-btn.warn:hover:not(:disabled) { background: #fffbeb; }
.link-btn.ok { color: #059669; }
.link-btn.ok:hover:not(:disabled) { background: #ecfdf5; }
.link-btn.danger { color: #dc2626; }
.link-btn.danger:hover:not(:disabled) { background: #fef2f2; }

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #334155;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.btn:hover:not(:disabled) { background: #f8fafc; }
.btn:disabled { opacity: 0.55; cursor: not-allowed; }
.btn.primary { background: #2563eb; border-color: #2563eb; color: #fff; }
.btn.primary:hover:not(:disabled) { background: #1d4ed8; border-color: #1d4ed8; }
.btn.danger-solid { background: #dc2626; border-color: #dc2626; color: #fff; }

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
  max-height: 92vh;
  overflow: auto;
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
}
.modal.edit-modal {
  width: min(720px, calc(100vw - 48px));
  max-width: calc(100vw - 48px);
}
.modal.confirm-modal { width: min(420px, calc(100vw - 48px)); }

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
  background: transparent;
  font-size: 22px;
  line-height: 1;
  color: #94a3b8;
  cursor: pointer;
}
.edit-form, .modal-body {
  padding: 8px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.form-row { display: flex; flex-direction: column; gap: 6px; }
.form-row label { font-size: 13px; color: #64748b; font-weight: 600; }
.req { color: #ef4444; }
.input {
  width: 100%;
  padding: 9px 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #0f172a;
  font-size: 13px;
  box-sizing: border-box;
  font-family: inherit;
}
.input:focus {
  outline: none;
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}
select.input { cursor: pointer; }
.field-desc { margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.4; }
.config-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
}
.config-title { font-size: 13px; font-weight: 800; color: #0f172a; }
.form-error { margin: 0; color: #dc2626; font-size: 13px; font-weight: 600; }
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 28px;
  transform: translateX(-50%);
  background: #0f172a;
  color: #fff;
  padding: 12px 22px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  z-index: 3000;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.25);
}
.toast.error { background: #dc2626; }

@media (max-width: 720px) {
  .page-header { flex-direction: column; }
  .header-actions { width: 100%; }
  .stat-row { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
}
</style>
