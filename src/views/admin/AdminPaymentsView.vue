<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">支付配置</h1>
      <button class="btn primary" @click="openAdd">添加支付方式</button>
    </div>

    <!-- 列表 -->
    <div class="panel">
      <div v-if="loading" class="loading">加载中…</div>
      <div v-else-if="!rows.length" class="empty">暂无支付方式，请点击上方按钮添加。</div>
      <table v-else class="table">
        <thead>
          <tr>
            <th style="width:50px">#</th>
            <th>名称</th>
            <th>驱动</th>
            <th>手续费</th>
            <th>状态</th>
            <th>通知地址</th>
            <th style="width:180px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, idx) in rows" :key="p.id">
            <td>{{ idx + 1 }}</td>
            <td>{{ p.name }}</td>
            <td><span class="tag">{{ p.payment }}</span></td>
            <td>{{ fmtFee(p) }}</td>
            <td>
              <span class="status" :class="p.enable === 1 ? 'on' : 'off'">
                {{ p.enable === 1 ? '启用' : '停用' }}
              </span>
            </td>
            <td class="url-cell">{{ p.notify_url }}</td>
            <td class="actions-cell">
              <button class="btn-sm" :class="p.enable === 1 ? 'warn' : 'ok'" @click="doToggle(p)">
                {{ p.enable === 1 ? '停用' : '启用' }}
              </button>
              <button class="btn-sm edit" @click="openEdit(p)">编辑</button>
              <button class="btn-sm danger" @click="doDelete(p)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 新增 / 编辑弹窗 -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-mask" @click.self="showModal = false">
        <div class="modal">
          <div class="modal-header">
            <h2>{{ editId ? '编辑支付方式' : '添加支付方式' }}</h2>
            <button class="modal-close" @click="showModal = false">&times;</button>
          </div>
          <form class="modal-body" @submit.prevent="doSave">
            <!-- 基本信息 -->
            <div class="form-row">
              <label>显示名称 <span class="req">*</span></label>
              <input v-model="form.name" class="input" placeholder="支付名称" required />
            </div>
            <div class="form-row">
              <label>图标 URL</label>
              <input v-model="form.icon" class="input" placeholder="可选，图标地址" />
            </div>
            <div class="form-row">
              <label>支付网关 <span class="req">*</span></label>
              <select v-model="form.payment" class="input" required @change="onPaymentChange">
                <option value="">-- 请选择 --</option>
                <option v-for="m in methods" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>
            <div class="form-row">
              <label>自定义通知域名</label>
              <input v-model="form.notify_domain" class="input" placeholder="留空则使用站点地址" />
            </div>
            <div class="form-row half">
              <div>
                <label>固定手续费（分）</label>
                <input v-model.number="form.handling_fee_fixed" type="number" class="input" />
              </div>
              <div>
                <label>百分比手续费 (%)</label>
                <input v-model.number="form.handling_fee_percent" type="number" step="0.1" class="input" />
              </div>
            </div>

            <!-- 动态配置字段 -->
            <template v-if="formFields && Object.keys(formFields).length">
              <div class="config-title">网关配置</div>
              <div v-for="(field, key) in formFields" :key="key" class="form-row">
                <label>{{ field.label }}</label>
                <input v-model="configValues[key]" class="input" :placeholder="field.description || ''" />
                <p v-if="field.description" class="field-desc">{{ field.description }}</p>
              </div>
            </template>

            <div class="modal-footer">
              <button type="button" class="btn secondary" @click="showModal = false">取消</button>
              <button type="submit" class="btn primary" :disabled="saving">{{ saving ? '保存中…' : '保存' }}</button>
              <span v-if="errMsg" class="err-msg">{{ errMsg }}</span>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import {
  fetchPayments, fetchPaymentMethods, fetchPaymentForm,
  savePayment, togglePayment, dropPayment,
  type AdminPayment, type FormField
} from '../../api/admin/payment'

const loading = ref(true)
const rows = ref<AdminPayment[]>([])
const methods = ref<string[]>([])

/* ---- 弹窗状态 ---- */
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

/* ---- 加载 ---- */
async function load() {
  loading.value = true
  try {
    const [list, m] = await Promise.all([fetchPayments(), fetchPaymentMethods()])
    rows.value = list
    methods.value = m
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

/* ---- 格式化手续费 ---- */
function fmtFee(p: AdminPayment) {
  const parts: string[] = []
  if (p.handling_fee_percent) parts.push(`${p.handling_fee_percent}%`)
  if (p.handling_fee_fixed) parts.push(`${(p.handling_fee_fixed / 100).toFixed(2)}元`)
  return parts.length ? parts.join(' + ') : '-'
}

/* ---- 新增 ---- */
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

/* ---- 编辑 ---- */
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
  // 加载表单
  await loadForm(p.payment, p.id)
}

/* ---- 切换驱动时加载表单 ---- */
async function onPaymentChange() {
  clearConfig()
  formFields.value = {}
  if (!form.payment) return
  // 编辑模式有 id，新增模式没有 → 新增模式不调 form 接口
  if (editId.value) {
    await loadForm(form.payment, editId.value)
  } else {
    // 新增模式：用静态表单定义
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
    console.error('Failed to load form', e)
  }
}

/* ---- 新增时的静态表单 ---- */
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
      key: { label: 'KEY', description: '', type: 'input' }
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

/* ---- 保存 ---- */
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
    await load()
  } catch (e) {
    errMsg.value = (e as Error).message
  } finally {
    saving.value = false
  }
}

/* ---- 启用/停用 ---- */
async function doToggle(p: AdminPayment) {
  try {
    await togglePayment(p.id)
    await load()
  } catch (e) {
    alert((e as Error).message)
  }
}

/* ---- 删除 ---- */
async function doDelete(p: AdminPayment) {
  if (!confirm(`确认删除支付方式「${p.name}」？`)) return
  try {
    await dropPayment(p.id)
    await load()
  } catch (e) {
    alert((e as Error).message)
  }
}

load()
</script>

<style scoped>
.page { max-width: 1100px; }

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #e5e7eb;
}

/* ---- Panel ---- */
.panel {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 16px;
}

.loading, .empty {
  color: #64748b;
  font-size: 14px;
  padding: 20px 0;
  text-align: center;
}

/* ---- Table ---- */
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.table th,
.table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #1e293b;
}

.table th {
  color: #94a3b8;
  font-weight: 500;
  font-size: 12px;
  text-transform: uppercase;
}

.table tbody tr:hover { background: rgba(56,189,248,0.04); }

.tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: #1e293b;
  color: #94a3b8;
}

.status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.status.on { background: rgba(74,222,128,0.15); color: #4ade80; }
.status.off { background: rgba(248,113,113,0.15); color: #f87171; }

.url-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: #64748b;
}

.actions-cell {
  display: flex;
  gap: 6px;
  align-items: center;
}

/* ---- Buttons ---- */
.btn {
  padding: 8px 16px;
  font-size: 13px;
  border-radius: 6px;
  cursor: pointer;
  border: none;
}
.btn.primary { background: #38bdf8; color: #0f172a; }
.btn.primary:hover:not(:disabled) { background: #7dd3fc; }
.btn.primary:disabled { opacity: .6; cursor: not-allowed; }
.btn.secondary { background: #334155; color: #e5e7eb; }
.btn.secondary:hover { background: #475569; }

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  background: #1e293b;
  color: #94a3b8;
}
.btn-sm:hover { background: #334155; color: #e5e7eb; }
.btn-sm.ok { color: #4ade80; }
.btn-sm.warn { color: #fbbf24; }
.btn-sm.edit { color: #38bdf8; }
.btn-sm.danger { color: #f87171; }
.btn-sm.danger:hover { background: rgba(248,113,113,.15); }

/* ---- Modal ---- */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 12px;
  width: 560px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #1e293b;
}

.modal-header h2 {
  font-size: 16px;
  margin: 0;
  color: #e5e7eb;
}

.modal-close {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 22px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}
.modal-close:hover { color: #e5e7eb; }

.modal-body {
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-row label {
  font-size: 13px;
  color: #94a3b8;
}

.form-row.half {
  flex-direction: row;
  gap: 12px;
}
.form-row.half > div {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.req { color: #f87171; }

.input {
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  color: #e5e7eb;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  box-sizing: border-box;
  font-family: inherit;
}
.input:focus { outline: none; border-color: #38bdf8; }
select.input { cursor: pointer; }

.field-desc {
  font-size: 11px;
  color: #64748b;
  margin: 0;
}

.config-title {
  font-size: 14px;
  font-weight: 500;
  color: #e5e7eb;
  padding-top: 8px;
  border-top: 1px solid #1e293b;
}

.modal-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid #1e293b;
}

.err-msg { color: #f87171; font-size: 13px; }
</style>
