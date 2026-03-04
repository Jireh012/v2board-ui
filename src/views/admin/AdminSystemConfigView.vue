<template>
  <div class="config-page">
    <h1 class="page-title">系统配置</h1>

    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="tab"
        :class="{ active: currentTab === tab.key }"
        @click="currentTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="currentTab === 'site'" class="panel">
      <form v-if="site" class="form" @submit.prevent="saveSite">
        <div class="form-row">
          <div class="label-col">
            <label>站点名称</label>
            <p class="desc">用于显示需要站点名称的地方。</p>
          </div>
          <div class="input-col">
            <input v-model="site.app_name" type="text" class="input" placeholder="站点名称" />
          </div>
        </div>
        <div class="form-row">
          <div class="label-col">
            <label>站点描述</label>
            <p class="desc">用于显示需要站点描述的地方。</p>
          </div>
          <div class="input-col">
            <input v-model="site.app_description" type="text" class="input" placeholder="站点描述" />
          </div>
        </div>
        <div class="form-row">
          <div class="label-col">
            <label>站点网址</label>
            <p class="desc">当前网站最新网址，将会在部件等需要用于网址处体现。</p>
          </div>
          <div class="input-col">
            <input v-model="site.app_url" type="text" class="input" placeholder="https://example.com" />
          </div>
        </div>
        <div class="form-row">
          <div class="label-col">
            <label>强制 HTTPS</label>
            <p class="desc">当站点没有使用 HTTPS，CDN 以及代开强制 HTTPS 时需开启。</p>
          </div>
          <div class="input-col toggle-col">
            <button
              type="button"
              class="toggle"
              :class="{ on: site.force_https === 1 }"
              role="switch"
              :aria-checked="site.force_https === 1"
              @click="site.force_https = site.force_https === 1 ? 0 : 1"
            >
              <span class="toggle-thumb" />
            </button>
          </div>
        </div>
        <div class="form-row">
          <div class="label-col">
            <label>LOGO</label>
            <p class="desc">用于显示需要 LOGO 的地方。</p>
          </div>
          <div class="input-col">
            <input
              v-model="site.logo"
              type="text"
              class="input"
              placeholder="请输入 LOGO URL，末尾不要 /"
            />
          </div>
        </div>
        <div class="form-row">
          <div class="label-col">
            <label>订阅 URL</label>
            <p class="desc">用于订阅所使用，留空则为站点 URL；如需多个订阅 URL 随机获取请使用逗号分割。</p>
          </div>
          <div class="input-col">
            <input v-model="site.subscribe_url" type="text" class="input" placeholder="留空则使用站点 URL" />
          </div>
        </div>
        <div class="form-row">
          <div class="label-col">
            <label>订阅路径</label>
            <p class="desc">用于订阅所使用，留空则为 /api/v1/client/subscribe；如需更换不同订阅路径请设置。</p>
          </div>
          <div class="input-col">
            <input
              v-model="site.subscribe_path"
              type="text"
              class="input"
              placeholder="/api/v1/client/subscribe"
            />
          </div>
        </div>
        <div class="form-row">
          <div class="label-col">
            <label>用户条款 (TOS) URL</label>
            <p class="desc">用于跳转到用户条款 (TOS)。</p>
          </div>
          <div class="input-col">
            <input
              v-model="site.tos_url"
              type="text"
              class="input"
              placeholder="请输入用户条款 URL，末尾不要 /"
            />
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn primary" :disabled="saving">
            {{ saving ? '保存中…' : '保存' }}
          </button>
          <span v-if="saveMessage" class="msg" :class="saveMessageType">{{ saveMessage }}</span>
        </div>
      </form>
      <p v-else-if="!loading" class="empty">暂无站点配置数据。</p>
      <p v-else class="loading">加载中…</p>
    </div>

    <div v-else class="panel placeholder">
      <p>「{{ tabs.find(t => t.key === currentTab)?.label }}」配置项后续开放。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { fetchConfig, saveConfig, type ConfigData } from '../../api/admin/config'

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

const currentTab = ref('site')
const loading = ref(true)
const saving = ref(false)
const saveMessage = ref('')
const saveMessageType = ref<'ok' | 'err'>('ok')

const config = ref<ConfigData | null>(null)
const site = computed(() => config.value?.site ?? null)

async function load() {
  loading.value = true
  try {
    config.value = await fetchConfig()
  } catch (e) {
    saveMessage.value = (e as Error).message
    saveMessageType.value = 'err'
  } finally {
    loading.value = false
  }
}

async function saveSite() {
  if (!site.value) return
  saving.value = true
  saveMessage.value = ''
  try {
    await saveConfig({ site: { ...site.value } })
    saveMessage.value = '保存成功'
    saveMessageType.value = 'ok'
    setTimeout(() => { saveMessage.value = '' }, 3000)
  } catch (e) {
    saveMessage.value = (e as Error).message
    saveMessageType.value = 'err'
  } finally {
    saving.value = false
  }
}

watch(currentTab, () => { saveMessage.value = '' })

load()
</script>

<style scoped>
.config-page {
  max-width: 900px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px;
  color: #e5e7eb;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 20px;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 0;
}

.tab {
  padding: 10px 14px;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 13px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  border-radius: 4px 4px 0 0;
}

.tab:hover {
  color: #e5e7eb;
}

.tab.active {
  color: #38bdf8;
  border-bottom-color: #38bdf8;
}

.panel {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 20px 24px;
}

.panel.placeholder {
  color: #64748b;
  font-size: 14px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 20px;
  align-items: start;
}

.label-col label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #e5e7eb;
  margin-bottom: 4px;
}

.label-col .desc {
  font-size: 12px;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.input-col {
  min-width: 0;
}

.input {
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  color: #e5e7eb;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: #38bdf8;
}

.toggle-col {
  display: flex;
  align-items: center;
}

.toggle {
  width: 44px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 12px;
  background: #334155;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
}

.toggle.on {
  background: #38bdf8;
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s;
}

.toggle.on .toggle-thumb {
  transform: translateX(20px);
}

.form-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.btn {
  padding: 8px 16px;
  font-size: 13px;
  border-radius: 6px;
  cursor: pointer;
  border: none;
}

.btn.primary {
  background: #38bdf8;
  color: #0f172a;
}

.btn.primary:hover:not(:disabled) {
  background: #7dd3fc;
}

.btn.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.msg {
  font-size: 13px;
}

.msg.ok {
  color: #4ade80;
}

.msg.err {
  color: #f87171;
}

.empty,
.loading {
  color: #64748b;
  font-size: 14px;
  margin: 0;
}
</style>
