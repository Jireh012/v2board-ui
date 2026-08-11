<template>
  <div class="rule-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">订阅规则</h1>
        <p class="page-subtitle">
          管理各客户端<strong>本地化</strong>分流模板。推荐同步 ACL4SSR Online Full（含自动测速）：服务端拉取并<strong>全量内联</strong>规则列表，订阅正文无远程规则依赖。勿用
          <code>NoAuto</code>，否则没有「♻️ 自动选择」。
        </p>
      </div>
    </div>

    <div class="tabs" role="tablist">
      <button
        v-for="tab in formats"
        :key="tab.key"
        type="button"
        class="tab"
        role="tab"
        :aria-selected="currentFormat === tab.key"
        :class="{ active: currentFormat === tab.key }"
        @click="switchFormat(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="loading" class="panel state-box">
      <div class="spinner"></div>
      <p>加载规则模板…</p>
    </div>

    <div v-else class="panel">
      <div class="meta-row">
        <div class="meta-pills">
          <span class="pill" :class="isDefault ? 'pill-default' : 'pill-custom'">
            <i class="dot"></i>
            {{ isDefault ? '内置默认' : '自定义' }}
          </span>
          <span v-if="fallbackFormat" class="pill pill-fallback">
            回退自 {{ fallbackFormat }}
          </span>
          <span v-if="updateSource" class="pill pill-source">
            来源 {{ updateSourceLabel }}
          </span>
        </div>
        <div class="meta-time">
          更新时间：{{ fmtTime(updatedAt) }}
        </div>
      </div>

      <div class="info-banner" role="note">
        <strong>同步说明：</strong>默认同步
        <code>ACL4SSR_Online_Full.ini</code>（含 <code>♻️ 自动选择</code> / <code>url-test</code>）。
        <code>*_NoAuto.ini</code> 官方注明「自动测速：不支持」，同步后策略组里不会出现自动选择。
        服务端解析 <code>ruleset=</code> / <code>custom_proxy_group=</code>，拉取全部
        <code>.list</code> 并<strong>内联写入</strong>当前 format 的种子壳（保留 DNS /
        <code>[General]</code> 等），再入库。直连 GitHub 失败时，自动经可用第三方订阅节点前置代理重试（无需手工选节点）。
        亦支持已含 HTTP <code>rule-providers</code> 的 Clash/Stash YAML（同样内联）。
        本页编辑仅覆盖档位 <code>full</code>；用户可用
        <code>?rule=full|simple|nodes</code>（或 <code>subscribe.rule_profile</code>）切换精简/仅节点模板。
      </div>

      <div v-if="warning" class="warn-banner" role="alert">
        {{ warning }}
      </div>
      <div v-if="sanitizeMeta" class="meta-sanitize" role="status">
        {{ sanitizeMeta }}
      </div>

      <div class="form-row">
        <label>同步 URL</label>
        <p class="hint">
          留空：优先已保存地址，否则使用默认 Online INI。同步由服务端内联；拉取失败时自动前置代理。客户端不会访问 GitHub。
        </p>
        <input
          v-model="sourceUrl"
          class="input"
          type="url"
          placeholder="https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Full.ini"
        />
      </div>

      <div class="form-row">
        <div class="editor-head">
          <label>规则内容</label>
          <span class="char-count">{{ content.length.toLocaleString() }} 字符</span>
        </div>
        <textarea
          v-model="content"
          class="input editor"
          spellcheck="false"
          rows="22"
          placeholder="规则模板内容…"
        />
      </div>

      <div class="actions">
        <button type="button" class="btn primary" :disabled="busy" @click="doSave">
          {{ saving ? '保存中…' : '保存' }}
        </button>
        <button type="button" class="btn" :disabled="busy" @click="doSync">
          {{ syncing ? '同步中…' : '从 URL 同步' }}
        </button>
        <button type="button" class="btn danger" :disabled="busy || isDefault" @click="doRestore">
          {{ restoring ? '恢复中…' : '恢复默认' }}
        </button>
        <span v-if="statusMsg" class="status-msg" :class="statusType">{{ statusMsg }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  fetchSubscribeRule,
  restoreSubscribeRule,
  saveSubscribeRule,
  syncSubscribeRule,
  type SubscribeRuleFormat
} from '../../api/admin/subscribeRule'

const formats: { key: SubscribeRuleFormat; label: string }[] = [
  { key: 'clash', label: 'Clash' },
  { key: 'stash', label: 'Stash' },
  { key: 'surge', label: 'Surge' },
  { key: 'surfboard', label: 'Surfboard' },
  { key: 'singbox', label: 'Sing-box' },
  { key: 'quantumultx', label: 'Quantumult X' },
  { key: 'loon', label: 'Loon' }
]

const currentFormat = ref<SubscribeRuleFormat>('clash')
const loading = ref(true)
const content = ref('')
const sourceUrl = ref('')
const isDefault = ref(true)
const updatedAt = ref<number | null>(null)
const updateSource = ref<string | null>(null)
const fallbackFormat = ref<string | null>(null)
const warning = ref<string | null>(null)
const strippedRemote = ref(false)
const usedSeedFallback = ref(false)
const syncHint = ref<string | null>(null)

const saving = ref(false)
const syncing = ref(false)
const restoring = ref(false)
const statusMsg = ref('')
const statusType = ref<'ok' | 'err'>('ok')

const busy = computed(() => saving.value || syncing.value || restoring.value || loading.value)

const updateSourceLabel = computed(() => {
  const s = updateSource.value
  if (s === 'manual') return '手动编辑'
  if (s === 'sync') return 'URL 同步'
  if (s === 'default') return '默认'
  return s || '-'
})

const sanitizeMeta = computed(() => {
  const parts: string[] = []
  if (strippedRemote.value) parts.push('已剥离远程规则依赖')
  if (usedSeedFallback.value) parts.push('已回落本地默认种子')
  if (syncHint.value) parts.push(syncHint.value)
  return parts.length ? parts.join(' · ') : null
})

function applyData(data: Awaited<ReturnType<typeof fetchSubscribeRule>> & {
  stripped_remote?: boolean
  used_seed_fallback?: boolean
  sync_hint?: string | null
}) {
  content.value = data.content ?? ''
  sourceUrl.value = data.source_url ?? ''
  isDefault.value = !!data.is_default
  updatedAt.value = data.updated_at ?? null
  updateSource.value = data.update_source ?? null
  fallbackFormat.value = data.fallback_format ?? null
  warning.value = data.warning ?? null
  strippedRemote.value = !!data.stripped_remote
  usedSeedFallback.value = !!data.used_seed_fallback
  syncHint.value = data.sync_hint ?? null
}

function fmtTime(ts?: number | null) {
  if (!ts) return '-'
  return new Date(ts * 1000).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

function flash(msg: string, type: 'ok' | 'err' = 'ok') {
  statusMsg.value = msg
  statusType.value = type
  window.setTimeout(() => {
    if (statusMsg.value === msg) statusMsg.value = ''
  }, 4000)
}

async function load(format: SubscribeRuleFormat = currentFormat.value) {
  loading.value = true
  statusMsg.value = ''
  warning.value = null
  try {
    applyData(await fetchSubscribeRule(format))
  } catch (e: any) {
    flash(e?.message || '加载失败', 'err')
  } finally {
    loading.value = false
  }
}

async function switchFormat(format: SubscribeRuleFormat) {
  if (format === currentFormat.value) return
  currentFormat.value = format
  await load(format)
}

async function doSave() {
  if (!content.value.trim()) {
    flash('规则内容不能为空', 'err')
    return
  }
  saving.value = true
  try {
    applyData(
      await saveSubscribeRule({
        format: currentFormat.value,
        content: content.value,
        source_url: sourceUrl.value.trim() || null
      })
    )
    flash(warning.value ? '已保存（含警告）' : '保存成功')
  } catch (e: any) {
    flash(e?.message || '保存失败', 'err')
  } finally {
    saving.value = false
  }
}

async function doSync() {
  const url = sourceUrl.value.trim()
  if (!url && isDefault.value) {
    flash('请先填写同步 URL', 'err')
    return
  }
  syncing.value = true
  try {
    applyData(
      await syncSubscribeRule({
        format: currentFormat.value,
        url: url || null,
        source_url: url || null
      })
    )
    flash(warning.value ? '同步完成（含警告）' : '同步成功')
  } catch (e: any) {
    flash(e?.message || '同步失败', 'err')
  } finally {
    syncing.value = false
  }
}

async function doRestore() {
  if (!confirm(`确认将「${currentFormat.value}」恢复为内置默认模板？自定义内容将被删除。`)) {
    return
  }
  restoring.value = true
  try {
    applyData(await restoreSubscribeRule(currentFormat.value))
    flash('已恢复默认')
  } catch (e: any) {
    flash(e?.message || '恢复失败', 'err')
  } finally {
    restoring.value = false
  }
}

load()
</script>

<style scoped>
.rule-page {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-main);
}

.page-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
  max-width: 720px;
}

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

.panel {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.meta-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-time {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.pill .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.pill-default {
  background: #f1f5f9;
  color: #64748b;
}

.pill-custom {
  background: #eff6ff;
  color: #2563eb;
}

.pill-fallback {
  background: #fffbeb;
  color: #d97706;
}

.pill-source {
  background: #ecfdf5;
  color: #059669;
}

.info-banner {
  padding: 10px 12px;
  border-radius: 12px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e3a8a;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.5;
}

.info-banner strong {
  font-weight: 750;
}

.info-banner code {
  font-size: 12px;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.7);
}

.warn-banner {
  padding: 10px 12px;
  border-radius: 12px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
}

.meta-sanitize {
  font-size: 12px;
  font-weight: 650;
  color: #64748b;
  line-height: 1.45;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row label {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}

.hint {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.45;
}

.editor-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.char-count {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  font-variant-numeric: tabular-nums;
}

.input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  color: var(--text-main);
  font-size: 13px;
  box-sizing: border-box;
  font-family: inherit;
}

.input:focus {
  outline: none;
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.editor {
  resize: vertical;
  min-height: 420px;
  line-height: 1.55;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  font-size: 12px;
  background: #f8fafc;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding-top: 4px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: var(--text-main);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn.primary {
  background: linear-gradient(135deg, var(--primary-color), #4f46e5);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 8px 16px -6px rgba(37, 99, 235, 0.45);
}

.btn.danger {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.status-msg {
  font-size: 13px;
  font-weight: 700;
}

.status-msg.ok {
  color: #059669;
}

.status-msg.err {
  color: #dc2626;
}

.state-box {
  padding: 48px 20px;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-muted);
  gap: 10px;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 720px) {
  .actions {
    flex-direction: column;
    align-items: stretch;
  }

  .btn {
    justify-content: center;
  }
}
</style>
