<template>
  <div class="config-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">系统配置</h1>
        <p class="page-subtitle">按分组管理站点、安全、订阅与第三方集成参数</p>
      </div>
    </div>

    <div class="tabs" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="tab"
        role="tab"
        :aria-selected="currentTab === tab.key"
        :class="{ active: currentTab === tab.key }"
        @click="currentTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="loading" class="panel"><p class="loading">加载中…</p></div>

    <!-- ==================== 站点 ==================== -->
    <form v-else-if="currentTab === 'site' && config?.site" class="panel" @submit.prevent="saveGroup('site')">
      <Row label="站点名称" desc="用于显示需要站点名称的地方。">
        <input v-model="config.site.app_name" class="input" />
      </Row>
      <Row label="站点描述" desc="用于显示需要站点描述的地方。">
        <input v-model="config.site.app_description" class="input" />
      </Row>
      <Row label="站点网址" desc="当前网站最新网址，将会在部件等需要用于网址处体现。">
        <input v-model="config.site.app_url" class="input" placeholder="https://example.com" />
      </Row>
      <Row label="强制 HTTPS" desc="当站点没有使用 HTTPS，CDN 以及代理开启强制 HTTPS 时需开启。">
        <Toggle v-model="config.site.force_https" />
      </Row>
      <Row label="LOGO" desc="用于显示需要 LOGO 的地方。">
        <input v-model="config.site.logo" class="input" placeholder="请输入 LOGO URL" />
      </Row>
      <Row label="订阅 URL" desc="用于订阅所使用，留空则为站点 URL；多个请每行一条（也可逗号分隔）。">
        <textarea
          :value="subscribeUrlText"
          @input="onSubscribeUrlInput(($event.target as HTMLTextAreaElement).value)"
          class="input textarea"
          rows="3"
          placeholder="留空则使用站点 URL&#10;https://sub1.example.com&#10;https://sub2.example.com"
        />
      </Row>
      <Row label="订阅路径" desc="用于订阅所使用，留空则为 /api/v1/client/subscribe；保存后立即生效，无需重启。">
        <input v-model="config.site.subscribe_path" class="input" placeholder="/api/v1/client/subscribe" />
      </Row>
      <Row label="用户条款 URL" desc="用于跳转到用户条款 (TOS)。">
        <input v-model="config.site.tos_url" class="input" placeholder="https://example.com/tos" />
      </Row>
      <Row label="停止新用户注册" desc="开启后新用户将无法注册。">
        <Toggle v-model="config.site.stop_register" />
      </Row>
      <Row label="试用订阅 ID" desc="新注册用户赠送的试用订阅 Plan ID，0 表示不赠送。">
        <input v-model.number="config.site.try_out_plan_id" type="number" class="input" />
      </Row>
      <Row label="试用时长（小时）" desc="试用订阅的有效时长。">
        <input v-model.number="config.site.try_out_hour" type="number" class="input" />
      </Row>
      <Row label="货币单位" desc="如 CNY、USD、EUR 等。">
        <input v-model="config.site.currency" class="input" placeholder="CNY" />
      </Row>
      <Row label="货币符号" desc="显示在金额前的符号。">
        <input v-model="config.site.currency_symbol" class="input" placeholder="¥" />
      </Row>
      <Actions :saving="saving" :msg="saveMessage" :msg-type="saveMessageType" />
    </form>

    <!-- ==================== 安全 ==================== -->
    <form v-else-if="currentTab === 'safe' && config?.safe" class="panel" @submit.prevent="saveGroup('safe')">
      <Row label="邮箱验证" desc="开启后注册及重置密码需要进行邮箱验证。">
        <Toggle v-model="config.safe.email_verify" />
      </Row>
      <Row label="安全模式" desc="开启后除主页外的用户端只能登入后访问。">
        <Toggle v-model="config.safe.safe_mode_enable" />
      </Row>
      <Row label="后台路径" desc="管理后台路径，最小 8 位，只能为字母或数字。">
        <input v-model="config.safe.secure_path" class="input" placeholder="admin888" />
      </Row>
      <Row label="邮箱后缀白名单" desc="开启后只允许白名单内邮箱后缀注册。">
        <Toggle v-model="config.safe.email_whitelist_enable" />
      </Row>
      <Row v-if="config.safe.email_whitelist_enable === 1" label="白名单后缀" desc="多个后缀用逗号分隔，如 gmail.com,qq.com。">
        <input v-model="config.safe.email_whitelist_suffix" class="input" placeholder="gmail.com,qq.com" />
      </Row>
      <Row label="禁止 Gmail 多别名" desc="开启后将会验证 Gmail 邮箱是否使用了别名注册。">
        <Toggle v-model="config.safe.email_gmail_limit_enable" />
      </Row>
      <Row label="reCAPTCHA 验证" desc="开启后注册和登录将会进行 reCAPTCHA 人机验证。">
        <Toggle v-model="config.safe.recaptcha_enable" />
      </Row>
      <Row v-if="config.safe.recaptcha_enable === 1" label="reCAPTCHA 密钥" desc="Google reCAPTCHA v2 密钥 (Secret Key)。">
        <input v-model="config.safe.recaptcha_key" class="input" />
      </Row>
      <Row v-if="config.safe.recaptcha_enable === 1" label="reCAPTCHA 站点密钥" desc="Google reCAPTCHA v2 站点密钥 (Site Key)。">
        <input v-model="config.safe.recaptcha_site_key" class="input" />
      </Row>
      <Row label="IP 注册限制" desc="开启后同 IP 在指定时间内只能注册指定次数。">
        <Toggle v-model="config.safe.register_limit_by_ip_enable" />
      </Row>
      <Row v-if="config.safe.register_limit_by_ip_enable === 1" label="限制注册次数" desc="同 IP 允许的注册次数。">
        <input v-model.number="config.safe.register_limit_count" type="number" class="input" />
      </Row>
      <Row v-if="config.safe.register_limit_by_ip_enable === 1" label="限制时间（分钟）" desc="注册限制的时间窗口。">
        <input v-model.number="config.safe.register_limit_expire" type="number" class="input" />
      </Row>
      <Row label="密码错误限制" desc="开启后同一邮箱密码错误达到上限将被暂时锁定。">
        <Toggle v-model="config.safe.password_limit_enable" />
      </Row>
      <Row v-if="config.safe.password_limit_enable === 1" label="最大错误次数" desc="锁定前允许的密码错误次数（按邮箱计数）。">
        <input v-model.number="config.safe.password_limit_count" type="number" class="input" />
      </Row>
      <Row v-if="config.safe.password_limit_enable === 1" label="锁定时间（分钟）" desc="该邮箱密码错误锁定时长。">
        <input v-model.number="config.safe.password_limit_expire" type="number" class="input" />
      </Row>
      <Actions :saving="saving" :msg="saveMessage" :msg-type="saveMessageType" />
    </form>

    <!-- ==================== 订阅 ==================== -->
    <form v-else-if="currentTab === 'subscribe' && config?.subscribe" class="panel" @submit.prevent="saveGroup('subscribe')">
      <Row label="允许更换订阅" desc="开启后用户可更换当前订阅到其他订阅。">
        <Toggle v-model="config.subscribe.plan_change_enable" />
      </Row>
      <Row label="流量重置方式" desc="选择用户流量的重置方式。">
        <select v-model.number="config.subscribe.reset_traffic_method" class="input">
          <option :value="0">每月1日</option>
          <option :value="1">订阅到期日</option>
          <option :value="2">不重置</option>
          <option :value="3">每年1月1日</option>
          <option :value="4">每年到期日</option>
        </select>
      </Row>
      <Row label="差价补足" desc="开启后更换订阅时将会计算差价补足。">
        <Toggle v-model="config.subscribe.surplus_enable" />
      </Row>
      <Row label="允许选择新周期" desc="开启后用户续费时可选择不同周期。">
        <Toggle v-model="config.subscribe.allow_new_period" />
      </Row>
      <Row label="新购时清零已用流量" desc="开启后新购订阅开通成功时将用户已用流量（上传/下载）清零。">
        <Toggle v-model="config.subscribe.new_order_event_id" />
      </Row>
      <Row label="续费时清零已用流量" desc="开启后续费订阅开通成功时将用户已用流量（上传/下载）清零。">
        <Toggle v-model="config.subscribe.renew_order_event_id" />
      </Row>
      <Row label="变更时清零已用流量" desc="开启后变更订阅开通成功时将用户已用流量（上传/下载）清零。">
        <Toggle v-model="config.subscribe.change_order_event_id" />
      </Row>
      <Row label="节点端显示用户信息" desc="开启后节点端能获取到用户的订阅信息。">
        <Toggle v-model="config.subscribe.show_info_to_server_enable" />
      </Row>
      <Row label="订阅展示方式" desc="控制订阅链接中信息节点的展示内容（流量 / 重置天 / 到期），不影响订阅 URL。">
        <select v-model.number="config.subscribe.show_subscribe_method" class="input">
          <option :value="0">全部</option>
          <option :value="1">只显示到期时间</option>
          <option :value="2">只显示流量</option>
        </select>
      </Row>
      <Row label="订阅到期提前天数" desc="展示「即将到期」标签的提前天数。">
        <input v-model.number="config.subscribe.show_subscribe_expire" type="number" class="input" />
      </Row>
      <Actions :saving="saving" :msg="saveMessage" :msg-type="saveMessageType" />
    </form>

    <!-- ==================== 充值 ==================== -->
    <form v-else-if="currentTab === 'deposit' && config?.deposit" class="panel" @submit.prevent="saveGroup('deposit')">
      <Row label="充值奖励" desc="格式：充值金额:奖励金额（元），每行一条规则。如 100:10 表示充值 100 送 10。">
        <textarea
          :value="(config.deposit.deposit_bounus ?? []).join('\n')"
          @input="config.deposit.deposit_bounus = ($event.target as HTMLTextAreaElement).value.split('\n').filter(Boolean)"
          class="input textarea"
          rows="4"
          placeholder="100:10&#10;500:100"
        />
      </Row>
      <Actions :saving="saving" :msg="saveMessage" :msg-type="saveMessageType" />
    </form>

    <!-- ==================== 工单 ==================== -->
    <form v-else-if="currentTab === 'ticket' && config?.ticket" class="panel" @submit.prevent="saveGroup('ticket')">
      <Row label="工单状态" desc="控制工单系统的可用范围。">
        <select v-model.number="config.ticket.ticket_status" class="input">
          <option :value="0">全部用户可用</option>
          <option :value="1">仅付费用户</option>
          <option :value="2">关闭工单系统</option>
        </select>
      </Row>
      <Actions :saving="saving" :msg="saveMessage" :msg-type="saveMessageType" />
    </form>

    <!-- ==================== 邀请 & 佣金 ==================== -->
    <form v-else-if="currentTab === 'invite' && config?.invite" class="panel" @submit.prevent="saveGroup('invite')">
      <Row label="强制邀请注册" desc="开启后用户必须使用邀请码才能注册。">
        <Toggle v-model="config.invite.invite_force" />
      </Row>
      <Row label="佣金比例 (%)" desc="邀请人获得被邀请人订单金额的佣金比例。">
        <input v-model.number="config.invite.invite_commission" type="number" class="input" />
      </Row>
      <Row label="邀请码生成上限" desc="每个用户能生成的最大邀请码数量。">
        <input v-model.number="config.invite.invite_gen_limit" type="number" class="input" />
      </Row>
      <Row label="邀请码永不过期" desc="开启后邀请码不会过期。">
        <Toggle v-model="config.invite.invite_never_expire" />
      </Row>
      <Row label="仅首次下单佣金" desc="开启后只有被邀请用户的首笔订单产生佣金。">
        <Toggle v-model="config.invite.commission_first_time_enable" />
      </Row>
      <Row label="佣金自动审核" desc="开启后完成 3 天以上的订单佣金将自动确认。">
        <Toggle v-model="config.invite.commission_auto_check_enable" />
      </Row>
      <Row label="提现最低金额" desc="单位为分；如 100 表示余额满 1 元可提现。">
        <input v-model.number="config.invite.commission_withdraw_limit" type="number" class="input" />
      </Row>
      <Row label="提现方式" desc="支持的提现方式，逗号分隔。">
        <input v-model="config.invite.commission_withdraw_method" class="input" placeholder="支付宝,USDT,Paypal" />
      </Row>
      <Row label="关闭提现" desc="开启后佣金直接到余额，无需手动提现。">
        <Toggle v-model="config.invite.withdraw_close_enable" />
      </Row>
      <Row label="三级分销" desc="开启后支持三级分销佣金分配。">
        <Toggle v-model="config.invite.commission_distribution_enable" />
      </Row>
      <template v-if="config.invite.commission_distribution_enable === 1">
        <Row label="一级分销比例 (%)" desc="一级邀请人获得的佣金比例。">
          <input v-model.number="config.invite.commission_distribution_l1" type="number" class="input" />
        </Row>
        <Row label="二级分销比例 (%)" desc="二级邀请人获得的佣金比例。">
          <input v-model.number="config.invite.commission_distribution_l2" type="number" class="input" />
        </Row>
        <Row label="三级分销比例 (%)" desc="三级邀请人获得的佣金比例。">
          <input v-model.number="config.invite.commission_distribution_l3" type="number" class="input" />
        </Row>
      </template>
      <Actions :saving="saving" :msg="saveMessage" :msg-type="saveMessageType" />
    </form>

    <!-- ==================== 个性化 ==================== -->
    <form v-else-if="currentTab === 'frontend' && config?.frontend" class="panel" @submit.prevent="saveGroup('frontend')">
      <Row label="主题" desc="前端使用的主题。">
        <input v-model="config.frontend.frontend_theme" class="input" placeholder="v2board" />
      </Row>
      <Row label="侧栏风格" desc="侧栏颜色风格。">
        <select v-model="config.frontend.frontend_theme_sidebar" class="input">
          <option value="light">亮色</option>
          <option value="dark">暗色</option>
        </select>
      </Row>
      <Row label="头部风格" desc="顶部导航栏颜色风格。">
        <select v-model="config.frontend.frontend_theme_header" class="input">
          <option value="light">亮色</option>
          <option value="dark">暗色</option>
        </select>
      </Row>
      <Row label="主题色" desc="前端主题色。">
        <select v-model="config.frontend.frontend_theme_color" class="input">
          <option value="default">默认</option>
          <option value="darkblue">深蓝</option>
          <option value="black">黑色</option>
          <option value="green">绿色</option>
        </select>
      </Row>
      <Row label="背景图 URL" desc="自定义前端背景图片 URL。">
        <input v-model="config.frontend.frontend_background_url" class="input" placeholder="https://..." />
      </Row>
      <Actions :saving="saving" :msg="saveMessage" :msg-type="saveMessageType" />
    </form>

    <!-- ==================== 节点 ==================== -->
    <form v-else-if="currentTab === 'server' && config?.server" class="panel" @submit.prevent="saveGroup('server')">
      <Row label="节点 API URL" desc="节点与面板通讯的 API 地址，留空则使用站点 URL。">
        <input v-model="config.server.server_api_url" class="input" placeholder="留空则使用站点 URL" />
      </Row>
      <Row label="通讯密钥" desc="面板和节点间的通讯密钥，最少 16 位。">
        <input v-model="config.server.server_token" class="input" placeholder="至少16位" />
      </Row>
      <Row label="节点拉取间隔（秒）" desc="节点从面板拉取用户数据的间隔秒数。">
        <input v-model.number="config.server.server_pull_interval" type="number" class="input" />
      </Row>
      <Row label="节点推送间隔（秒）" desc="节点向面板推送流量数据的间隔秒数。">
        <input v-model.number="config.server.server_push_interval" type="number" class="input" />
      </Row>
      <Row label="最低上报流量（字节）" desc="低于该值的流量不计入统计，0 不限制。">
        <input v-model.number="config.server.server_node_report_min_traffic" type="number" class="input" />
      </Row>
      <Row label="在线判定最低流量（字节）" desc="低于该值不判定为在线设备，0 不限制。">
        <input v-model.number="config.server.server_device_online_min_traffic" type="number" class="input" />
      </Row>
      <Row label="设备限制模式" desc="控制在线设备的统计方式。">
        <select v-model.number="config.server.device_limit_mode" class="input">
          <option :value="0">按节点统计</option>
          <option :value="1">全局去重</option>
        </select>
      </Row>
      <Actions :saving="saving" :msg="saveMessage" :msg-type="saveMessageType" />
    </form>

    <!-- ==================== 邮件 ==================== -->
    <form v-else-if="currentTab === 'email' && config?.email" class="panel" @submit.prevent="saveGroup('email')">
      <Row label="邮件模板" desc="邮件使用的模板名。">
        <input v-model="config.email.email_template" class="input" placeholder="default" />
      </Row>
      <Row label="SMTP 主机" desc="邮件服务器地址。">
        <input v-model="config.email.email_host" class="input" placeholder="smtp.example.com" />
      </Row>
      <Row label="SMTP 端口" desc="邮件服务器端口，如 465 或 587。">
        <input v-model="config.email.email_port" class="input" placeholder="465" />
      </Row>
      <Row label="SMTP 用户名" desc="邮件服务器登录用户名。">
        <input v-model="config.email.email_username" class="input" />
      </Row>
      <Row label="SMTP 密码" desc="邮件服务器登录密码。">
        <input v-model="config.email.email_password" type="password" class="input" />
      </Row>
      <Row label="加密方式" desc="SSL/TLS 加密方式，留空为不加密。">
        <select v-model="config.email.email_encryption" class="input">
          <option value="">不加密</option>
          <option value="ssl">SSL</option>
          <option value="tls">TLS</option>
        </select>
      </Row>
      <Row label="发件人地址" desc="邮件发件人 From 地址。">
        <input v-model="config.email.email_from_address" class="input" placeholder="noreply@example.com" />
      </Row>
      <div class="form-actions">
        <button type="submit" class="btn primary" :disabled="saving">{{ saving ? '保存中…' : '保存' }}</button>
        <button type="button" class="btn secondary" :disabled="testing" @click="doTestMail">
          {{ testing ? '发送中…' : '发送测试邮件' }}
        </button>
        <span v-if="saveMessage" class="msg" :class="saveMessageType">{{ saveMessage }}</span>
      </div>
    </form>

    <!-- ==================== Telegram ==================== -->
    <form v-else-if="currentTab === 'telegram' && config?.telegram" class="panel" @submit.prevent="saveGroup('telegram')">
      <Row label="启用 Telegram Bot" desc="开启后将通过 Telegram Bot 发送通知。">
        <Toggle v-model="config.telegram.telegram_bot_enable" />
      </Row>
      <Row label="Bot Token" desc="通过 @BotFather 获取的 Telegram Bot Token。">
        <input v-model="config.telegram.telegram_bot_token" class="input" placeholder="123456:ABC-DEF..." />
      </Row>
      <Row label="群组链接" desc="Telegram 群组邀请链接。">
        <input v-model="config.telegram.telegram_discuss_link" class="input" placeholder="https://t.me/xxx" />
      </Row>
      <div class="form-actions">
        <button type="submit" class="btn primary" :disabled="saving">{{ saving ? '保存中…' : '保存' }}</button>
        <button type="button" class="btn secondary" :disabled="testing" @click="doSetWebhook">
          {{ testing ? '设置中…' : '设置 Webhook' }}
        </button>
        <span v-if="saveMessage" class="msg" :class="saveMessageType">{{ saveMessage }}</span>
      </div>
    </form>

    <!-- ==================== APP ==================== -->
    <form v-else-if="currentTab === 'app' && config?.app" class="panel" @submit.prevent="saveGroup('app')">
      <Row label="Windows 版本" desc="Windows 客户端版本号。">
        <input v-model="config.app.windows_version" class="input" placeholder="1.0.0" />
      </Row>
      <Row label="Windows 下载地址" desc="Windows 客户端下载 URL。">
        <input v-model="config.app.windows_download_url" class="input" placeholder="https://..." />
      </Row>
      <Row label="macOS 版本" desc="macOS 客户端版本号。">
        <input v-model="config.app.macos_version" class="input" placeholder="1.0.0" />
      </Row>
      <Row label="macOS 下载地址" desc="macOS 客户端下载 URL。">
        <input v-model="config.app.macos_download_url" class="input" placeholder="https://..." />
      </Row>
      <Row label="Android 版本" desc="Android 客户端版本号。">
        <input v-model="config.app.android_version" class="input" placeholder="1.0.0" />
      </Row>
      <Row label="Android 下载地址" desc="Android 客户端下载 URL。">
        <input v-model="config.app.android_download_url" class="input" placeholder="https://..." />
      </Row>
      <Actions :saving="saving" :msg="saveMessage" :msg-type="saveMessageType" />
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, defineComponent, h, type PropType } from 'vue'
import {
  fetchConfig, saveConfig, testSendMail, setTelegramWebhook,
  type ConfigData
} from '../../api/admin/config'
import { adminBasePath, adminUrl, loadSiteBrand } from '../../siteBrand'

/* ---- 子组件：表单行 ---- */
const Row = defineComponent({
  name: 'FormRow',
  props: {
    label: { type: String, required: true },
    desc: { type: String, default: '' }
  },
  setup(props, { slots }) {
    return () =>
      h('div', { class: 'form-row' }, [
        h('div', { class: 'label-col' }, [
          h('label', null, props.label),
          props.desc ? h('p', { class: 'desc' }, props.desc) : null
        ]),
        h('div', { class: 'input-col' }, slots.default?.())
      ])
  }
})

const Toggle = defineComponent({
  name: 'ToggleSwitch',
  props: {
    modelValue: {
      type: [Number, Boolean] as PropType<number | boolean | undefined>,
      default: 0
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const isOn = () => props.modelValue === 1 || props.modelValue === true
    return () =>
      h('div', { class: 'toggle-col' }, [
        h(
          'button',
          {
            type: 'button',
            class: ['toggle', { on: isOn() }],
            role: 'switch',
            'aria-checked': isOn(),
            onClick: () => emit('update:modelValue', isOn() ? 0 : 1)
          },
          [h('span', { class: 'toggle-thumb' })]
        ),
        h('span', { class: 'toggle-state' }, isOn() ? '已开启' : '已关闭')
      ])
  }
})

const Actions = defineComponent({
  name: 'FormActions',
  props: {
    saving: Boolean,
    msg: String,
    msgType: { type: String as PropType<'ok' | 'err'>, default: 'ok' }
  },
  setup(props) {
    return () =>
      h('div', { class: 'form-actions' }, [
        h('button', { type: 'submit', class: 'btn primary', disabled: props.saving },
          props.saving ? '保存中…' : '保存'),
        props.msg ? h('span', { class: ['msg', props.msgType] }, props.msg) : null
      ])
  }
})

/* ---- Tab 列表 ---- */
const tabs = [
  { key: 'site', label: '站点' },
  { key: 'safe', label: '安全' },
  { key: 'subscribe', label: '订阅' },
  { key: 'deposit', label: '充值' },
  { key: 'ticket', label: '工单' },
  { key: 'invite', label: '邀请&佣金' },
  { key: 'frontend', label: '个性化' },
  { key: 'server', label: '节点' },
  { key: 'email', label: '邮件' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'app', label: 'APP' }
]

/* ---- 状态 ---- */
const currentTab = ref('site')
const loading = ref(true)
const saving = ref(false)
const testing = ref(false)
const saveMessage = ref('')
const saveMessageType = ref<'ok' | 'err'>('ok')
const config = ref<ConfigData | null>(null)

/** 订阅 URL：DB/API 仍为逗号串；编辑时按行展示 */
const subscribeUrlText = computed(() => {
  const raw = config.value?.site?.subscribe_url ?? ''
  return raw
    .split(/[,\n\r]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n')
})

function onSubscribeUrlInput(value: string) {
  if (!config.value?.site) return
  config.value.site.subscribe_url = value
    .split(/[,\n\r]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(',')
}

/* ---- 加载 ---- */
async function load() {
  loading.value = true
  try {
    config.value = await fetchConfig()
  } catch (e) {
    showMsg((e as Error).message, 'err')
  } finally {
    loading.value = false
  }
}

/* ---- 保存当前分组 ---- */
async function saveGroup(group: string) {
  if (!config.value) return
  saving.value = true
  saveMessage.value = ''
  const prevAdminPath = adminBasePath.value
  try {
    const payload: Record<string, unknown> = {}
    payload[group] = (config.value as Record<string, unknown>)[group]
    await saveConfig(payload as ConfigData)
    if (group === 'safe') {
      // Routes are registered once at boot; path change needs a full reload.
      await loadSiteBrand()
      if (adminBasePath.value !== prevAdminPath) {
        showMsg('保存成功，正在跳转到新后台路径…', 'ok')
        window.location.href = adminUrl('/config/system')
        return
      }
    }
    showMsg('保存成功', 'ok')
  } catch (e) {
    showMsg((e as Error).message, 'err')
  } finally {
    saving.value = false
  }
}

/* ---- 测试邮件 ---- */
async function doTestMail() {
  testing.value = true
  saveMessage.value = ''
  try {
    await testSendMail()
    showMsg('测试邮件已发送', 'ok')
  } catch (e) {
    showMsg((e as Error).message, 'err')
  } finally {
    testing.value = false
  }
}

/* ---- 设置 Webhook ---- */
async function doSetWebhook() {
  testing.value = true
  saveMessage.value = ''
  try {
    await setTelegramWebhook()
    showMsg('Webhook 设置成功', 'ok')
  } catch (e) {
    showMsg((e as Error).message, 'err')
  } finally {
    testing.value = false
  }
}

function showMsg(text: string, type: 'ok' | 'err') {
  saveMessage.value = text
  saveMessageType.value = type
  if (type === 'ok') setTimeout(() => { saveMessage.value = '' }, 3000)
}

watch(currentTab, () => { saveMessage.value = '' })

load()
</script>

<style scoped>
.config-page {
  max-width: 960px;
}

.page-header {
  margin-bottom: 4px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-main, #0f172a);
}

.page-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--text-muted, #64748b);
}

/* ---- Tabs ---- */
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 16px 0 18px;
  padding: 6px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
}

.tab {
  padding: 8px 12px;
  border: 1px solid transparent;
  background: transparent;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 10px;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.tab:hover {
  color: #0f172a;
  background: #ffffff;
}

.tab.active {
  color: #1d4ed8;
  background: #ffffff;
  border-color: #bfdbfe;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

/* ---- Panel ---- */
.panel {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 8px 20px 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

/*
 * Row / Toggle / Actions 均为同文件子组件，scoped 默认不穿透。
 * 用 :deep 保证样式生效，并压过全局 .admin-page .form-row。
 */
.config-page :deep(.form-row) {
  display: grid;
  grid-template-columns: minmax(200px, 1fr) minmax(240px, 1.15fr);
  gap: 16px 28px;
  align-items: center;
  padding: 16px 4px;
  border-bottom: 1px solid #f1f5f9;
}

.config-page :deep(.form-row:has(+ .form-actions)) {
  border-bottom: none;
}

.config-page :deep(.label-col label) {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-main, #0f172a);
  margin-bottom: 4px;
}

.config-page :deep(.label-col .desc) {
  font-size: 12px;
  color: var(--text-muted, #64748b);
  margin: 0;
  line-height: 1.5;
}

.config-page :deep(.input-col) {
  min-width: 0;
  display: flex;
  align-items: center;
}

.config-page :deep(.input) {
  width: 100%;
  padding: 9px 12px;
  font-size: 13px;
  color: var(--text-main, #0f172a);
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-sizing: border-box;
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.config-page :deep(.input:focus) {
  outline: none;
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.config-page :deep(select.input) {
  cursor: pointer;
}

.config-page :deep(.textarea) {
  resize: vertical;
  line-height: 1.5;
  min-height: 96px;
}

/* ---- Toggle：关闭态必须有可见轨道色，不能白底白钮 ---- */
.config-page :deep(.toggle-col) {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.config-page :deep(.toggle) {
  width: 44px;
  height: 26px;
  padding: 0;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: #e2e8f0;
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.06);
}

.config-page :deep(.toggle:hover) {
  background: #cbd5e1;
}

.config-page :deep(.toggle.on) {
  background: var(--primary-color, #2563eb);
  border-color: var(--primary-color, #2563eb);
  box-shadow: none;
}

.config-page :deep(.toggle.on:hover) {
  background: var(--primary-hover, #1d4ed8);
  border-color: var(--primary-hover, #1d4ed8);
}

.config-page :deep(.toggle:focus-visible) {
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
}

.config-page :deep(.toggle-thumb) {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.2);
  transition: transform 0.2s;
}

.config-page :deep(.toggle.on .toggle-thumb) {
  transform: translateX(18px);
}

.config-page :deep(.toggle-state) {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  user-select: none;
}

.config-page :deep(.toggle.on + .toggle-state) {
  color: #1d4ed8;
}

/* ---- Buttons ---- */
.config-page :deep(.form-actions),
.form-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.config-page :deep(.btn),
.btn {
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid transparent;
}

.config-page :deep(.btn.primary),
.btn.primary {
  background: var(--primary-color, #2563eb);
  border-color: var(--primary-color, #2563eb);
  color: #ffffff;
}

.config-page :deep(.btn.primary:hover:not(:disabled)),
.btn.primary:hover:not(:disabled) {
  background: var(--primary-hover, #1d4ed8);
  border-color: var(--primary-hover, #1d4ed8);
}

.config-page :deep(.btn.primary:disabled),
.btn.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.config-page :deep(.btn.secondary),
.btn.secondary {
  background: #ffffff;
  border-color: #e2e8f0;
  color: #0f172a;
}

.config-page :deep(.btn.secondary:hover:not(:disabled)),
.btn.secondary:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #0f172a;
}

.config-page :deep(.btn.secondary:disabled),
.btn.secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.config-page :deep(.msg),
.msg {
  font-size: 13px;
  font-weight: 600;
}

.config-page :deep(.msg.ok),
.msg.ok {
  color: #15803d;
}

.config-page :deep(.msg.err),
.msg.err {
  color: #dc2626;
}

.loading {
  color: #64748b;
  font-size: 14px;
  margin: 0;
  padding: 24px 0;
  text-align: center;
}

@media (max-width: 720px) {
  .config-page :deep(.form-row) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}
</style>
