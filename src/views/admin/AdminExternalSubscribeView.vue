<template>
  <div class="ext-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">第三方订阅源</h1>
        <p class="page-subtitle">定时拉取外部订阅，经 sing-box 连通探测后并入用户订阅列表。</p>
      </div>
      <div class="header-actions">
        <button class="btn" :disabled="loading" @click="load" title="刷新列表">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :class="{ spinning: loading }"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
          刷新
        </button>
        <button class="btn" :disabled="syncingAll || loading" @click="doSyncAll">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          {{ syncingAll ? '同步中…' : '同步全部' }}
        </button>
        <button class="btn primary" @click="openAdd">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          添加订阅源
        </button>
      </div>
    </div>

    <div class="stat-row" v-if="!loading && rows.length">
      <div class="stat-card">
        <span class="stat-label">订阅源</span>
        <strong class="stat-value">{{ rows.length }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">已启用</span>
        <strong class="stat-value accent">{{ enabledCount }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">可达节点</span>
        <strong class="stat-value ok">{{ totalReachable }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">节点总数</span>
        <strong class="stat-value">{{ totalNodes }}</strong>
      </div>
    </div>

    <div class="panel">
      <div v-if="loading" class="state-box">
        <div class="spinner"></div>
        <p>加载订阅源…</p>
      </div>
      <div v-else-if="!rows.length" class="state-box empty">
        <div class="empty-icon">🔗</div>
        <h3>暂无第三方订阅源</h3>
        <p>添加订阅地址后，系统将定期探测并导入可达节点。</p>
        <button class="btn primary" @click="openAdd">添加第一个订阅源</button>
      </div>
      <div v-else class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th style="width:56px">#</th>
              <th>名称</th>
              <th>地址</th>
              <th>状态</th>
              <th>节点</th>
              <th>上次同步</th>
              <th style="width:260px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in rows" :key="s.id">
              <td class="id-cell">{{ s.id }}</td>
              <td>
                <div class="name-cell">
                  <span class="name">{{ s.name }}</span>
                  <span v-if="s.remark" class="remark">{{ s.remark }}</span>
                </div>
              </td>
              <td>
                <code class="url-chip" :title="s.url">{{ s.url }}</code>
              </td>
              <td>
                <div class="status-stack">
                  <span class="pill" :class="s.enable === 1 ? 'pill-on' : 'pill-off'">
                    <i class="dot"></i>
                    {{ s.enable === 1 ? '启用' : '停用' }}
                  </span>
                  <span v-if="s.pre_proxy_enable === 1" class="pill pill-proxy">前置代理</span>
                </div>
              </td>
              <td>
                <div class="node-metric">
                  <span class="reachable">{{ s.reachable_count ?? 0 }}</span>
                  <span class="sep">/</span>
                  <span class="total">{{ s.node_count ?? 0 }}</span>
                  <span class="metric-label">可达</span>
                </div>
              </td>
              <td>
                <div class="sync-cell">
                  <div class="sync-top">
                    <span class="sync-badge" :class="s.last_sync_status || 'none'">
                      {{ syncLabel(s.last_sync_status) }}
                    </span>
                    <span class="sync-time">{{ fmtTime(s.last_sync_at) }}</span>
                  </div>
                  <span v-if="s.last_sync_message" class="sync-msg" :title="s.last_sync_message">
                    {{ s.last_sync_message }}
                  </span>
                </div>
              </td>
              <td>
                <div class="actions-cell">
                  <button class="btn-sm" :class="s.enable === 1 ? 'warn' : 'ok'" @click="doToggle(s)">
                    {{ s.enable === 1 ? '停用' : '启用' }}
                  </button>
                  <button class="btn-sm" :disabled="syncingId === s.id" @click="doSync(s)">
                    {{ syncingId === s.id ? '同步中' : '同步' }}
                  </button>
                  <button class="btn-sm edit" @click="openNodes(s)">节点</button>
                  <button class="btn-sm edit" @click="openEdit(s)">编辑</button>
                  <button class="btn-sm danger" @click="doDrop(s)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showModal" class="modal-mask" @click.self="showModal = false">
        <div class="modal">
          <div class="modal-header">
            <div>
              <h2>{{ editId ? '编辑订阅源' : '添加订阅源' }}</h2>
              <p class="modal-sub">支持 Base64 URI / Clash YAML / sing-box JSON</p>
            </div>
            <button class="modal-close" @click="showModal = false">&times;</button>
          </div>
          <form class="modal-body" @submit.prevent="doSave">
            <div class="form-row">
              <label>名称 <span class="req">*</span></label>
              <input v-model="form.name" class="input" placeholder="例如：备用线路" required />
            </div>
            <div class="form-row">
              <label>订阅地址 <span class="req">*</span></label>
              <input v-model="form.url" class="input" placeholder="https://..." required />
            </div>
            <div class="form-row">
              <label>备注</label>
              <input v-model="form.remark" class="input" placeholder="可选说明" />
            </div>
            <div class="form-row">
              <div class="filter-head">
                <label>名称过滤</label>
                <button type="button" class="btn-sm edit" @click="addFilterRule">添加规则</button>
              </div>
              <p class="filter-hint">同步时按顺序对节点名做「匹配 → 替换」；替换可留空表示删除。支持正则与 <code>$1</code> 捕获组。</p>
              <div v-if="!form.name_filters.length" class="filter-empty">暂无规则</div>
              <div v-else class="filter-list">
                <div v-for="(rule, idx) in form.name_filters" :key="idx" class="filter-row">
                  <input v-model="rule.pattern" class="input" placeholder="匹配内容 / 正则" />
                  <input v-model="rule.replacement" class="input" placeholder="替换为（可空）" />
                  <label class="filter-regex">
                    <input v-model="rule.regex" type="checkbox" />
                    正则
                  </label>
                  <button type="button" class="btn-sm danger" @click="removeFilterRule(idx)">删除</button>
                </div>
              </div>
            </div>
            <label class="switch-row">
              <input v-model="form.enable" type="checkbox" />
              <span>保存后立即启用该订阅源</span>
            </label>
            <label class="switch-row">
              <input v-model="form.pre_proxy_enable" type="checkbox" />
              <span>前置代理拉取（自动选用节点库其它源的可达节点）</span>
            </label>
            <p class="filter-hint">开启后同步不再直连订阅地址；若库中无可用前置节点将同步失败。</p>
            <div class="modal-footer">
              <button type="button" class="btn" @click="showModal = false">取消</button>
              <button type="submit" class="btn primary" :disabled="saving">
                {{ saving ? '保存中...' : '保存' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showNodes" class="modal-mask" @click.self="showNodes = false">
        <div class="modal nodes-modal">
          <div class="modal-header">
            <div>
              <h2>节点列表</h2>
              <p class="modal-sub">{{ nodesSource?.name }} · 共 {{ nodes.length }} 个 · 可达 {{ nodesReachable }}</p>
            </div>
            <button class="modal-close" @click="showNodes = false">&times;</button>
          </div>
          <div class="nodes-toolbar">
            <div class="search-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input v-model="nodeQuery" class="search-input" placeholder="搜索节点名称 / 协议" />
            </div>
            <div class="filter-tabs">
              <button type="button" class="tab" :class="{ active: nodeFilter === 'all' }" @click="nodeFilter = 'all'">全部</button>
              <button type="button" class="tab" :class="{ active: nodeFilter === 'up' }" @click="nodeFilter = 'up'">可达</button>
              <button type="button" class="tab" :class="{ active: nodeFilter === 'down' }" @click="nodeFilter = 'down'">不可达</button>
            </div>
          </div>
          <div class="modal-body nodes-body">
            <div v-if="nodesLoading" class="state-box">
              <div class="spinner"></div>
              <p>加载节点…</p>
            </div>
            <div v-else-if="!filteredNodes.length" class="state-box empty compact">
              <p>{{ nodes.length ? '没有匹配的节点' : '暂无节点，请先执行同步' }}</p>
            </div>
            <div v-else class="nodes-table-shell">
              <div class="nodes-head-row" aria-hidden="false">
                <div class="col-id">#</div>
                <div class="col-name">名称</div>
                <div class="col-proto">协议</div>
                <div class="col-reach">连通</div>
                <div class="col-time">检测时间</div>
              </div>
              <div class="nodes-scroll">
                <div v-for="n in filteredNodes" :key="n.id" class="nodes-data-row">
                  <div class="col-id id-cell">{{ n.id }}</div>
                  <div class="col-name">
                    <div class="node-name">
                      <span class="flag">{{ regionEmoji(n.name) }}</span>
                      <span class="name-text" :title="n.name">{{ n.name }}</span>
                    </div>
                  </div>
                  <div class="col-proto">
                    <span class="proto" :class="protoClass(n.protocol)">{{ n.protocol || '-' }}</span>
                  </div>
                  <div class="col-reach">
                    <span class="pill" :class="n.reachable === 1 ? 'pill-on' : 'pill-off'">
                      <i class="dot"></i>
                      {{ n.reachable === 1 ? '可达' : '不可达' }}
                    </span>
                  </div>
                  <div class="col-time time-cell">{{ fmtTime(n.last_check_at) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  dropExternalSource,
  fetchExternalNodes,
  fetchExternalSources,
  saveExternalSource,
  syncAllExternalSources,
  syncExternalSource,
  updateExternalSource,
  type ExternalNameFilterRule,
  type ExternalSubscribeNode,
  type ExternalSubscribeSource
} from '../../api/admin/externalSubscribe'

const loading = ref(true)
const rows = ref<ExternalSubscribeSource[]>([])
const showModal = ref(false)
const saving = ref(false)
const editId = ref<number | null>(null)
const syncingId = ref<number | null>(null)
const syncingAll = ref(false)

const form = reactive({
  name: '',
  url: '',
  remark: '',
  enable: true,
  pre_proxy_enable: false,
  name_filters: [] as ExternalNameFilterRule[]
})

const showNodes = ref(false)
const nodesLoading = ref(false)
const nodes = ref<ExternalSubscribeNode[]>([])
const nodesSource = ref<ExternalSubscribeSource | null>(null)
const nodeQuery = ref('')
const nodeFilter = ref<'all' | 'up' | 'down'>('all')

const enabledRows = computed(() => rows.value.filter((s) => s.enable === 1))
const enabledCount = computed(() => enabledRows.value.length)
const totalReachable = computed(() => enabledRows.value.reduce((n, s) => n + (s.reachable_count ?? 0), 0))
const totalNodes = computed(() => enabledRows.value.reduce((n, s) => n + (s.node_count ?? 0), 0))
const nodesReachable = computed(() => nodes.value.filter((n) => n.reachable === 1).length)

const filteredNodes = computed(() => {
  const q = nodeQuery.value.trim().toLowerCase()
  return nodes.value.filter((n) => {
    if (nodeFilter.value === 'up' && n.reachable !== 1) return false
    if (nodeFilter.value === 'down' && n.reachable === 1) return false
    if (!q) return true
    return (n.name || '').toLowerCase().includes(q) || (n.protocol || '').toLowerCase().includes(q)
  })
})

async function load() {
  loading.value = true
  try {
    rows.value = await fetchExternalSources()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
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

function syncLabel(status?: string | null) {
  if (status === 'success') return 'SUCCESS'
  if (status === 'failed') return 'FAILED'
  if (status === 'running') return 'RUNNING'
  return status ? status.toUpperCase() : '-'
}

function protoClass(protocol?: string | null) {
  const p = (protocol || '').toLowerCase()
  if (p.includes('vless')) return 'vless'
  if (p.includes('vmess')) return 'vmess'
  if (p.includes('trojan')) return 'trojan'
  if (p.includes('shadowsocks') || p === 'ss') return 'ss'
  if (p.includes('hysteria')) return 'hy'
  if (p.includes('tuic')) return 'tuic'
  return 'other'
}

function regionEmoji(name?: string | null) {
  const text = name || ''
  const map: Array<[RegExp, string]> = [
    [/\b(AT|奥地利|Austria)\b/i, '🇦🇹'],
    [/\b(AU|澳大利亚|Australia)\b/i, '🇦🇺'],
    [/\b(BR|巴西|Brazil)\b/i, '🇧🇷'],
    [/\b(CA|加拿大|Canada)\b/i, '🇨🇦'],
    [/\b(CH|瑞士|Switzerland)\b/i, '🇨🇭'],
    [/\b(DE|德国|Germany)\b/i, '🇩🇪'],
    [/\b(FR|法国|France)\b/i, '🇫🇷'],
    [/\b(GB|UK|英国|United Kingdom)\b/i, '🇬🇧'],
    [/\b(HK|香港)\b/i, '🇭🇰'],
    [/\b(JP|日本|Japan)\b/i, '🇯🇵'],
    [/\b(KR|韩国|Korea)\b/i, '🇰🇷'],
    [/\b(NL|荷兰|Netherlands)\b/i, '🇳🇱'],
    [/\b(RU|俄罗斯|Russia)\b/i, '🇷🇺'],
    [/\b(SG|新加坡|Singapore)\b/i, '🇸🇬'],
    [/\b(TW|台湾|Taiwan)\b/i, '🇹🇼'],
    [/\b(US|美国|United States|America)\b/i, '🇺🇸'],
    [/\b(VN|越南|Vietnam)\b/i, '🇻🇳']
  ]
  for (const [re, emoji] of map) {
    if (re.test(text)) return emoji
  }
  return '🌐'
}

function openAdd() {
  editId.value = null
  form.name = ''
  form.url = ''
  form.remark = ''
  form.enable = true
  form.pre_proxy_enable = false
  form.name_filters = []
  showModal.value = true
}

function openEdit(s: ExternalSubscribeSource) {
  editId.value = s.id
  form.name = s.name
  form.url = s.url
  form.remark = s.remark || ''
  form.enable = s.enable === 1
  form.pre_proxy_enable = s.pre_proxy_enable === 1
  form.name_filters = (s.name_filters || []).map((r) => ({
    pattern: r.pattern || '',
    replacement: r.replacement ?? '',
    regex: !!r.regex
  }))
  showModal.value = true
}

function addFilterRule() {
  form.name_filters.push({ pattern: '', replacement: '', regex: false })
}

function removeFilterRule(idx: number) {
  form.name_filters.splice(idx, 1)
}

async function doSave() {
  saving.value = true
  try {
    const name_filters = form.name_filters
      .map((r) => ({
        pattern: (r.pattern || '').trim(),
        replacement: r.replacement ?? '',
        regex: !!r.regex
      }))
      .filter((r) => r.pattern.length > 0)
    await saveExternalSource({
      id: editId.value ?? undefined,
      name: form.name.trim(),
      url: form.url.trim(),
      remark: form.remark.trim(),
      enable: form.enable ? 1 : 0,
      pre_proxy_enable: form.pre_proxy_enable ? 1 : 0,
      name_filters
    })
    showModal.value = false
    await load()
  } catch (e: any) {
    alert(e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function doToggle(s: ExternalSubscribeSource) {
  try {
    await updateExternalSource({ id: s.id, enable: s.enable === 1 ? 0 : 1 })
    await load()
  } catch (e: any) {
    alert(e?.message || '操作失败')
  }
}

async function doDrop(s: ExternalSubscribeSource) {
  if (!confirm(`确认删除订阅源「${s.name}」？`)) return
  try {
    await dropExternalSource(s.id)
    await load()
  } catch (e: any) {
    alert(e?.message || '删除失败')
  }
}

async function doSync(s: ExternalSubscribeSource) {
  syncingId.value = s.id
  try {
    await syncExternalSource(s.id)
    await load()
  } catch (e: any) {
    alert(e?.message || '同步失败')
  } finally {
    syncingId.value = null
  }
}

async function doSyncAll() {
  syncingAll.value = true
  try {
    await syncAllExternalSources()
    await load()
  } catch (e: any) {
    alert(e?.message || '同步失败')
  } finally {
    syncingAll.value = false
  }
}

async function openNodes(s: ExternalSubscribeSource) {
  nodesSource.value = s
  showNodes.value = true
  nodesLoading.value = true
  nodeQuery.value = ''
  nodeFilter.value = 'all'
  try {
    nodes.value = await fetchExternalNodes(s.id)
  } catch (e) {
    console.error(e)
    nodes.value = []
  } finally {
    nodesLoading.value = false
  }
}

load()
</script>

<style scoped>
.ext-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
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
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.header-actions .spinning {
  animation: ext-spin 0.8s linear infinite;
}

@keyframes ext-spin {
  to { transform: rotate(360deg); }
}

.header-actions .btn,
.modal-footer .btn,
.state-box .btn {
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
}

.header-actions .btn.primary,
.modal-footer .btn.primary,
.state-box .btn.primary {
  background: linear-gradient(135deg, var(--primary-color), #4f46e5);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 8px 16px -6px rgba(37, 99, 235, 0.45);
}

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
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.03em;
}

.stat-value.accent { color: var(--primary-color); }
.stat-value.ok { color: #059669; }

.panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.table-wrap { overflow-x: auto; }

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.table th {
  text-align: left;
  padding: 12px 14px;
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  border-bottom: 1px solid #eef2f7;
}

.table td {
  padding: 14px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  color: var(--text-main);
}

.table tbody tr:hover {
  background: #f8fbff;
}

.id-cell {
  color: #94a3b8;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.name-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.name {
  font-weight: 800;
  color: var(--text-main);
}

.remark {
  font-size: 12px;
  color: #94a3b8;
}

.url-chip {
  display: inline-block;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 5px 8px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #eef2f7;
  color: #64748b;
  font-size: 12px;
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

.pill-on {
  background: #ecfdf5;
  color: #059669;
}

.pill-off {
  background: #f1f5f9;
  color: #64748b;
}

.status-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.pill-proxy {
  background: #eff6ff;
  color: #2563eb;
}

.node-metric {
  display: inline-flex;
  align-items: baseline;
  flex-wrap: nowrap;
  gap: 4px;
  white-space: nowrap;
  min-width: max-content;
  font-variant-numeric: tabular-nums;
}

.node-metric .reachable {
  font-size: 16px;
  font-weight: 800;
  color: #059669;
}

.node-metric .sep,
.node-metric .total {
  color: #94a3b8;
  font-weight: 700;
}

.node-metric .metric-label {
  margin-left: 4px;
  font-size: 11px;
  color: #94a3b8;
  font-weight: 700;
  flex-shrink: 0;
}

.sync-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 168px;
}

.sync-top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.sync-badge {
  display: inline-flex;
  width: fit-content;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.sync-badge.success { background: #ecfdf5; color: #059669; }
.sync-badge.failed { background: #fef2f2; color: #dc2626; }
.sync-badge.running { background: #fffbeb; color: #d97706; }
.sync-badge.none { background: #f1f5f9; color: #94a3b8; }

.sync-time {
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.sync-msg {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #94a3b8;
  font-size: 12px;
}

.actions-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.btn-sm {
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: var(--text-main);
  font-size: 12px;
  font-weight: 700;
}

.btn-sm.edit {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: var(--primary-color);
}

.btn-sm.ok {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #059669;
}

.btn-sm.warn {
  background: #fffbeb;
  border-color: #fde68a;
  color: #d97706;
}

.btn-sm.danger {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.btn-sm:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.state-box {
  padding: 48px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: var(--text-muted);
  text-align: center;
}

.state-box.compact { padding: 36px 16px; }

.state-box h3 {
  margin: 0;
  color: var(--text-main);
  font-size: 16px;
}

.state-box p {
  margin: 0;
  font-size: 13px;
}

.empty-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: #eff6ff;
  display: grid;
  place-items: center;
  font-size: 24px;
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
  to { transform: rotate(360deg); }
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal {
  width: min(520px, 94vw);
  background: #fff;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
  overflow: hidden;
}

.nodes-modal {
  width: min(1320px, 96vw) !important;
  max-width: 96vw !important;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
}

.nodes-modal .nodes-body {
  flex: 1;
  min-height: 0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px;
  border-bottom: 1px solid #f1f5f9;
  background: linear-gradient(180deg, #ffffff, #f8fafc);
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: var(--text-main);
}

.modal-sub {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--text-muted);
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 10px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 20px;
  line-height: 1;
}

.modal-close:hover {
  background: #e2e8f0;
  color: var(--text-main);
}

.modal-body {
  padding: 18px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.nodes-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid #f1f5f9;
  background: #fff;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  color: #94a3b8;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: var(--text-main);
}

.filter-tabs {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.tab {
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.tab.active {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: var(--primary-color);
}

.nodes-body {
  overflow: hidden;
  padding: 0;
  min-height: 240px;
  display: flex;
  flex-direction: column;
}

.nodes-table-shell {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.nodes-head-row,
.nodes-data-row {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) 140px 110px 190px;
  gap: 0 12px;
  align-items: center;
  padding: 0 20px;
}

.nodes-head-row {
  flex-shrink: 0;
  height: 44px;
  background: #f8fafc;
  border-bottom: 1px solid #eef2f7;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.nodes-scroll {
  overflow: auto;
  min-height: 0;
  flex: 1;
  max-height: calc(88vh - 220px);
}

.nodes-data-row {
  min-height: 52px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
}

.nodes-data-row:hover {
  background: #f8fbff;
}

.col-id { font-variant-numeric: tabular-nums; }
.col-proto,
.col-reach,
.col-time { white-space: nowrap; }

.node-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  min-width: 0;
}

.name-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flag {
  flex-shrink: 0;
  font-size: 16px;
  line-height: 1;
}

.proto {
  display: inline-flex;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  text-transform: lowercase;
  letter-spacing: 0.02em;
}

.proto.vless { background: #eff6ff; color: #2563eb; }
.proto.vmess { background: #f5f3ff; color: #7c3aed; }
.proto.trojan { background: #fff7ed; color: #ea580c; }
.proto.ss { background: #ecfeff; color: #0891b2; }
.proto.hy { background: #fdf2f8; color: #db2777; }
.proto.tuic { background: #f0fdf4; color: #16a34a; }
.proto.other { background: #f1f5f9; color: #64748b; }

.time-cell {
  color: #94a3b8;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
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

.filter-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.filter-hint {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.45;
}

.filter-hint code {
  font-size: 11px;
  background: #f1f5f9;
  padding: 1px 4px;
  border-radius: 4px;
}

.filter-empty {
  font-size: 12px;
  color: #cbd5e1;
  padding: 8px 0;
}

.filter-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto auto;
  gap: 8px;
  align-items: center;
}

.filter-regex {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  white-space: nowrap;
}

@media (max-width: 720px) {
  .filter-row {
    grid-template-columns: 1fr;
  }
}

.req { color: #dc2626; }

.input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  color: var(--text-main);
  font-size: 13px;
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.switch-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-main);
  font-weight: 600;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
}

@media (max-width: 900px) {
  .stat-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .page-header { flex-direction: column; align-items: stretch; }
  .nodes-toolbar { flex-direction: column; align-items: stretch; }
}
</style>
