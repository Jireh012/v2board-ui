<template>
  <div class="profile-page">
    <div class="header-section animate-fade-in">
      <h1 class="page-title">个人中心</h1>
      <p class="page-subtitle">管理您的账户设置、安全偏好及钱包余额</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载个人资料...</p>
    </div>

    <div v-else-if="info" class="profile-layout animate-fade-in delay-100">
      <!-- 左侧：核心财务与安全 -->
      <div class="profile-main">
        <!-- 钱包卡片 -->
        <section class="card wallet-card">
          <div class="wallet-header">
            <div class="wallet-info">
              <span class="wallet-label">我的钱包余额 (仅消费)</span>
              <div class="balance-row">
                <span class="currency">¥</span>
                <span class="balance-num">{{ formatAmount(info.balance) }}</span>
                <span class="cny">CNY</span>
              </div>
            </div>
            <button class="btn-deposit" @click="goOrder">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              立即充值
            </button>
          </div>
          
          <div class="wallet-footer">
            <div class="auto-renew-status">
              <div class="status-icon" :class="{ enabled: info.auto_renewal }">
                <svg v-if="info.auto_renewal" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </div>
              <span class="status-text">余额充足时自动续费订阅：<strong>{{ info.auto_renewal ? '已开启' : '已禁用' }}</strong></span>
            </div>
          </div>
        </section>

        <!-- 礼品卡兑换 -->
        <section class="card giftcard-card">
          <h3 class="card-title">礼品卡兑换</h3>
          <div class="giftcard-input-box">
            <div class="input-wrapper">
              <div class="input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="6" rx="2"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
              </div>
              <input type="text" v-model="giftcardCode" placeholder="输入您的礼品卡兑换码" @keyup.enter="handleRedeemGiftcard">
            </div>
            <button class="btn-redeem" @click="handleRedeemGiftcard" :disabled="redeeming || !giftcardCode">
              {{ redeeming ? '验证中' : '立即兑换' }}
            </button>
          </div>
        </section>

        <!-- 账号偏好设置 -->
        <section class="card settings-card">
          <h3 class="card-title">通知与偏好</h3>
          
          <div class="setting-row">
            <div class="setting-main">
              <span class="setting-name">余额自动续费</span>
              <p class="setting-desc">账号余额充足时，订阅到期自动完成续费</p>
            </div>
            <label class="premium-switch">
              <input type="checkbox" v-model="info.auto_renewal" :true-value="1" :false-value="0" @change="handleUpdateUserInfo">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-row">
            <div class="setting-main">
              <span class="setting-name">到期预警通知</span>
              <p class="setting-desc">即使关闭此项，重要的账单通知仍可能通过邮件发送</p>
            </div>
            <label class="premium-switch">
              <input type="checkbox" v-model="info.remind_expire" :true-value="1" :false-value="0" @change="handleUpdateUserInfo">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-row">
            <div class="setting-main">
              <span class="setting-name">流量消耗预警</span>
              <p class="setting-desc">当剩余流量低于 20% 时，我们将及时发送通知</p>
            </div>
            <label class="premium-switch">
              <input type="checkbox" v-model="info.remind_traffic" :true-value="1" :false-value="0" @change="handleUpdateUserInfo">
              <span class="slider"></span>
            </label>
          </div>
        </section>
      </div>

      <!-- 右侧：用户信息 -->
      <aside class="profile-side">
        <!-- 用户身份卡片 -->
        <section class="card user-info-card">
          <div class="user-avatar-big">{{ info.email.charAt(0).toUpperCase() }}</div>
          <h2 class="user-email-display">{{ info.email }}</h2>
          <span class="user-badge">{{ info.plan_id ? '尊贵订阅用户' : '注册用户' }}</span>
          
          <div class="user-stats-list">
            <div class="u-stat">
              <span class="u-stat-label">注册时间</span>
              <span class="u-stat-value">{{ formatTime(info.created_at) }}</span>
            </div>
            <div class="u-stat">
              <span class="u-stat-label">最近访问</span>
              <span class="u-stat-value">{{ formatTime(info.last_login_at) }}</span>
            </div>
          </div>
        </section>

        <!-- 安全区域 -->
        <section class="card safety-card">
          <h3 class="card-title">安全管理</h3>
          
          <button class="btn-safety-item" @click="showPwdModal = true">
            <div class="safety-icon icon-blue">
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div class="safety-text">
               <span class="s-label">修改入站密码</span>
               <p class="s-sub">保障您的账户私密性</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>

          <button class="btn-safety-item caution" @click="handleResetSecurity" :disabled="resetting">
            <div class="safety-icon icon-red">
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
            </div>
            <div class="safety-text">
               <span class="s-label">重置连接信息</span>
               <p class="s-sub">UUID/Token 将立即更新</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </section>

        <!-- UUID 展示 -->
        <div class="uuid-label-card">
          <div class="l">UUID (连接密钥)</div>
          <div class="v code-font">{{ info.uuid }}</div>
        </div>
      </aside>
    </div>

    <!-- 修改密码弹窗 -->
    <transition name="modal">
      <div v-if="showPwdModal" class="modal-mask" @click.self="showPwdModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3>重置入站密码</h3>
            <button class="close-btn" @click="showPwdModal = false">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>当前旧密码</label>
              <input type="password" v-model="pwdForm.old_password" placeholder="请输入当前密码进行身份确认">
            </div>
            <div class="form-group">
              <label>设置新密码</label>
              <input type="password" v-model="pwdForm.new_password" placeholder="建议使用 8 位以上字母与数字组合">
            </div>
            <div class="form-group">
              <label>确认新密码</label>
              <input type="password" v-model="pwdForm.confirm_password" placeholder="请再次确认新密码">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showPwdModal = false">放弃修改</button>
            <button class="btn-confirm" @click="handleChangePassword" :disabled="pwdLoading">
              {{ pwdLoading ? '处理中...' : '提交更改' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <p v-if="message" class="toast" :class="{ error: isError }">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getUserInfo, changePassword, updateUserInfo, resetSecurity, redeemGiftcard, type UserInfo } from '../api/user'

const router = useRouter()
const info = ref<UserInfo | null>(null)
const loading = ref(false)
const resetting = ref(false)
const redeeming = ref(false)
const giftcardCode = ref('')
const message = ref('')
const isError = ref(false)
const showPwdModal = ref(false)
const pwdLoading = ref(false)
const pwdForm = ref({ old_password: '', new_password: '', confirm_password: '' })

async function loadInfo() {
  loading.value = true
  try { info.value = await getUserInfo() }
  catch (e) { showMessage(e instanceof Error ? e.message : '同步个人信息失败', true) }
  finally { loading.value = false }
}

async function handleUpdateUserInfo() {
  if (!info.value) return
  try {
    await updateUserInfo({
      auto_renewal: info.value.auto_renewal,
      remind_expire: info.value.remind_expire,
      remind_traffic: info.value.remind_traffic
    })
    showMessage('账户配置已同步')
  } catch (e) { showMessage(e instanceof Error ? e.message : '更新配置失败', true) }
}

async function handleChangePassword() {
  if (!pwdForm.value.old_password || !pwdForm.value.new_password) return showMessage('请完整填写密码信息', true)
  if (pwdForm.value.new_password !== pwdForm.value.confirm_password) return showMessage('两次输入的新密码不匹配', true)
  pwdLoading.value = true
  try {
    await changePassword(pwdForm.value.old_password, pwdForm.value.new_password)
    showMessage('密码已成功重置，正在重新登录')
    setTimeout(() => { localStorage.clear(); router.push('/login') }, 1500)
  } catch (e) { showMessage(e instanceof Error ? e.message : '密码更新失败', true) }
  finally { pwdLoading.value = false }
}

async function handleResetSecurity() {
  if (!confirm('重置安全信息将立即失效原有的订阅链接与 UUID。确认重置？')) return
  resetting.value = true
  try {
    await resetSecurity()
    showMessage('安全信息重置成功，请更新您的订阅配置')
    await loadInfo()
  } catch (e) { showMessage(e instanceof Error ? e.message : '重置失败', true) }
  finally { resetting.value = false }
}

function showMessage(msg: string, error = false) {
  message.value = msg; isError.value = error
  setTimeout(() => { if (message.value === msg) message.value = '' }, 3000)
}

async function handleRedeemGiftcard() {
  if (!giftcardCode.value) return showMessage('请输入 16 位礼品卡代码', true)
  redeeming.value = true
  try {
    const res = await redeemGiftcard(giftcardCode.value)
    const typeLabel = (t: number) => ['余额', '天数', '流量', '重置流量', '套餐'][t - 1] || '未知'
    showMessage(`兑换成功：已为您增加 ${res.value} ${typeLabel(res.type)}`)
    giftcardCode.value = ''; await loadInfo()
  } catch (e) { showMessage(e instanceof Error ? e.message : '兑换码无效', true) }
  finally { redeeming.value = false }
}

const formatAmount = (cents: number | null | undefined) => cents ? (cents / 100).toFixed(2) : '0.00'
const formatTime = (ts: number | null) => ts ? new Date(ts * 1000).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'
const goOrder = () => router.push('/order')

onMounted(loadInfo)
</script>

<style scoped>
.profile-page {
  max-width: 1100px;
  margin: 0 auto;
}

.header-section { margin-bottom: 32px; }
.page-title { font-size: 32px; font-weight: 800; color: var(--text-main); margin-bottom: 8px; }
.page-subtitle { font-size: 16px; color: var(--text-muted); }

.profile-layout {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 4fr);
  gap: 28px;
}

.profile-main, .profile-side {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card {
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  padding: 24px;
}

.card-title { font-size: 16px; font-weight: 800; margin-bottom: 24px; }

/* 钱包卡片 */
.wallet-card {
  background: var(--text-main);
  color: white;
  border: none;
  overflow: hidden;
  position: relative;
}

.wallet-card::before {
  content: '';
  position: absolute;
  top: -20px;
  right: -20px;
  width: 140px;
  height: 140px;
  background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
}

.wallet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.wallet-label { font-size: 13px; font-weight: 700; opacity: 0.6; display: block; margin-bottom: 8px; }

.balance-row { display: flex; align-items: baseline; gap: 8px; }
.currency { font-size: 24px; font-weight: 800; }
.balance-num { font-size: 48px; font-weight: 800; letter-spacing: -2px; line-height: 1; }
.cny { font-size: 14px; font-weight: 700; opacity: 0.6; }

.btn-deposit {
  background: white;
  color: var(--text-main);
  border: none;
  padding: 12px 20px;
  border-radius: 99px;
  font-weight: 800;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-deposit:hover { transform: scale(1.05); }

.wallet-footer {
  padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.auto-renew-status { display: flex; align-items: center; gap: 12px; }
.status-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}
.status-icon.enabled { background: #10b981; color: white; }
.status-text { font-size: 13px; opacity: 0.8; }

/* 礼品卡 */
.giftcard-input-box { display: flex; gap: 12px; }
.input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}
.input-icon { position: absolute; left: 16px; color: #94a3b8; }
.input-wrapper input {
  width: 100%;
  padding: 14px 16px 14px 44px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  transition: border-color 0.2s;
}
.input-wrapper input:focus { border-color: var(--primary-color); outline: none; background: white; }

.btn-redeem {
  padding: 0 24px;
  background: var(--text-main);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
}

.btn-redeem:disabled { opacity: 0.5; cursor: not-allowed; }

/* 设置 */
.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color);
}
.setting-row:last-child { border: none; }
.setting-name { font-size: 15px; font-weight: 700; color: var(--text-main); }
.setting-desc { font-size: 13px; color: var(--text-muted); margin-top: 4px; }

/* Switch Overlay */
.premium-switch { position: relative; width: 48px; height: 26px; }
.premium-switch input { display: none; }
.slider {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background-color: #e2e8f0; border-radius: 34px; cursor: pointer; transition: 0.4s;
}
.slider:before {
  content: ""; position: absolute; height: 20px; width: 20px; left: 3px; bottom: 3px;
  background-color: white; border-radius: 50%; transition: 0.4s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
input:checked + .slider { background-color: #10b981; }
input:checked + .slider:before { transform: translateX(22px); }

/* 右侧用户卡片 */
.user-info-card { text-align: center; padding: 40px 24px; }
.user-avatar-big {
  width: 80px; height: 80px; border-radius: 28px;
  background: #eff6ff; color: var(--primary-color);
  display: flex; align-items: center; justify-content: center;
  font-size: 32px; font-weight: 800; margin: 0 auto 20px;
  box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.15);
}
.user-email-display { font-size: 18px; font-weight: 800; color: var(--text-main); margin-bottom: 8px; }
.user-badge {
  display: inline-block; padding: 4px 12px; background: #f1f5f9;
  border-radius: 99px; font-size: 12px; font-weight: 700; color: #64748b;
  margin-bottom: 32px;
}

.user-stats-list { border-top: 1px solid var(--border-color); padding-top: 24px; display: flex; flex-direction: column; gap: 16px; }
.u-stat { display: flex; justify-content: space-between; font-size: 13px; }
.u-stat-label { color: var(--text-muted); font-weight: 600; }
.u-stat-value { color: var(--text-main); font-weight: 700; }

/* 安全管理 */
.btn-safety-item {
  width: 100%; display: flex; align-items: center; gap: 16px; padding: 14px;
  background: white; border: 1px solid #f1f5f9; border-radius: 16px;
  margin-bottom: 12px; cursor: pointer; transition: all 0.2s;
}
.btn-safety-item:hover { border-color: #e2e8f0; background: #f8fafc; }
.safety-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.icon-blue { background: #eff6ff; color: #2563eb; }
.icon-red { background: #fef2f2; color: #ef4444; }
.safety-text { flex: 1; text-align: left; }
.s-label { display: block; font-size: 14px; font-weight: 800; color: var(--text-main); }
.s-sub { font-size: 12px; color: var(--text-muted); }
.btn-safety-item svg:last-child { color: #cbd5e1; }

.uuid-label-card {
  padding: 16px; background: #1e293b; border-radius: 16px; color: #94a3b8;
}
.uuid-label-card .l { font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 8px; }
.uuid-label-card .v { font-size: 12px; color: #e2e8f0; word-break: break-all; }
.code-font { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }

/* Modal */
.modal-mask {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000;
}
.modal { width: 90%; max-width: 440px; background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
.modal-header { padding: 24px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
.close-btn { background: none; border: none; font-size: 28px; color: #94a3b8; }
.modal-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
.form-group label { font-size: 13px; font-weight: 800; color: var(--text-main); margin-bottom: 8px; display: block; }
.form-group input {
  width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 12px;
  font-size: 14px; font-weight: 600; box-sizing: border-box;
}
.modal-footer { padding: 20px 24px; background: #f8fafc; display: flex; justify-content: flex-end; gap: 12px; border-radius: 0 0 24px 24px; }
.btn-cancel { background: none; border: none; color: #64748b; font-weight: 700; cursor: pointer; }
.btn-confirm { padding: 10px 20px; background: var(--text-main); color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; }

/* Toast */
.toast {
  position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
  background: #1e293b; color: white; padding: 12px 24px; border-radius: 12px;
  font-size: 14px; font-weight: 700; z-index: 3000; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2);
}
.toast.error { background: #ef4444; }

.loading-state { padding: 100px 0; text-align: center; }
.spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
@keyframes spin { to { transform: rotate(360deg); } }

.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; opacity: 0; }
.delay-100 { animation-delay: 0.1s; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.modal-enter-active, .modal-leave-active { transition: opacity 0.3s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

@media (max-width: 900px) { .profile-layout { grid-template-columns: 1fr; } }
</style>
