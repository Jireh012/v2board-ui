<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">节点管理</h1>
      <div class="header-actions">
        <select v-model="addType" class="input select-type">
          <option v-for="t in serverTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
        <button class="btn primary" @click="openAdd">添加节点</button>
      </div>
    </div>

    <!-- 过滤 -->
    <div class="filters">
      <button v-for="ft in filterTabs" :key="ft.value" class="filter-btn"
        :class="{ active: filterType === ft.value }" @click="filterType = ft.value">
        {{ ft.label }} ({{ ft.count }})
      </button>
    </div>

    <div class="panel">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="!filtered.length" class="empty">暂无节点。</div>
      <table v-else class="table">
        <thead>
          <tr>
            <th style="width:50px">#</th>
            <th>节点名称</th>
            <th>类型</th>
            <th>地址</th>
            <th>端口</th>
            <th>倍率</th>
            <th>显示</th>
            <th style="width:220px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in filtered" :key="`${s.type}-${s.id}`">
            <td>{{ s.id }}</td>
            <td>{{ s.name }}</td>
            <td><span class="tag" :class="'tag-' + s.type">{{ s.type }}</span></td>
            <td>{{ s.host }}</td>
            <td>{{ s.port }}</td>
            <td>{{ s.rate }}x</td>
            <td>
              <button class="btn-sm" :class="s.show === 1 ? 'on' : 'off'" @click="doToggle(s)">
                {{ s.show === 1 ? '显示' : '隐藏' }}
              </button>
            </td>
            <td class="actions-cell">
              <button class="btn-sm edit" @click="openEdit(s)">编辑</button>
              <button class="btn-sm copy" @click="doCopy(s)">复制</button>
              <button class="btn-sm danger" @click="doDrop(s)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 编辑弹窗 -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-mask" @click.self="showModal = false">
        <div class="modal modal-wide">
          <div class="modal-header">
            <h2>{{ editId ? '编辑节点' : '添加节点' }} ({{ currentType }})</h2>
            <button class="modal-close" @click="showModal = false">&times;</button>
          </div>
          <form class="modal-body" @submit.prevent="doSave">
            <!-- 通用字段 -->
            <div class="form-grid">
              <div class="form-row">
                <label>节点名称 <span class="req">*</span></label>
                <input v-model="form.name" class="input" required />
              </div>
              <div class="form-row">
                <label>节点地址 <span class="req">*</span></label>
                <input v-model="form.host" class="input" required />
              </div>
              <div class="form-row">
                <label>连接端口 <span class="req">*</span></label>
                <input v-model="form.port" class="input" required />
              </div>
              <div class="form-row" v-if="hasField('server_port')">
                <label>服务端口</label>
                <input v-model="form.server_port" class="input" type="number" />
              </div>
              <div class="form-row">
                <label>倍率 <span class="req">*</span></label>
                <input v-model="form.rate" class="input" type="number" step="0.1" required />
              </div>
              <div class="form-row">
                <label>权限组 <span class="req">*</span></label>
                <input v-model="groupIdText" class="input" placeholder="逗号分隔的组ID，如 1,2,3" />
              </div>
              <div class="form-row">
                <label>路由ID</label>
                <input v-model="routeIdText" class="input" placeholder="逗号分隔，如 1,2" />
              </div>
              <div class="form-row">
                <label>标签</label>
                <input v-model="tagsText" class="input" placeholder="逗号分隔，如 premium,cn" />
              </div>
              <div class="form-row">
                <label>父节点ID</label>
                <input v-model.number="form.parent_id" class="input" type="number" />
              </div>
              <div class="form-row">
                <label>排序</label>
                <input v-model.number="form.sort" class="input" type="number" />
              </div>
              <div class="form-row">
                <label>显示</label>
                <select v-model.number="form.show" class="input">
                  <option :value="1">显示</option>
                  <option :value="0">隐藏</option>
                </select>
              </div>
            </div>

            <!-- V2node 特有字段 -->
            <template v-if="currentType === 'v2node'">
              <h3 class="section-title">协议配置</h3>
              <div class="form-grid">
                <div class="form-row">
                  <label>协议 <span class="req">*</span></label>
                  <select v-model="form.protocol" class="input">
                    <option v-for="p in protocols" :key="p" :value="p">{{ p }}</option>
                  </select>
                </div>
                <div class="form-row">
                  <label>传输层 <span class="req">*</span></label>
                  <select v-model="form.network" class="input">
                    <option v-for="n in networks" :key="n" :value="n">{{ n }}</option>
                  </select>
                </div>
                <div class="form-row">
                  <label>TLS</label>
                  <select v-model.number="form.tls" class="input">
                    <option :value="0">关闭</option>
                    <option :value="1">开启</option>
                    <option :value="2">Reality</option>
                  </select>
                </div>
              </div>
            </template>

            <!-- Vmess 特有字段 -->
            <template v-if="currentType === 'vmess'">
              <h3 class="section-title">VMess 配置</h3>
              <div class="form-grid">
                <div class="form-row">
                  <label>传输层</label>
                  <select v-model="form.network" class="input">
                    <option v-for="n in networks" :key="n" :value="n">{{ n }}</option>
                  </select>
                </div>
                <div class="form-row">
                  <label>TLS</label>
                  <select v-model.number="form.tls" class="input">
                    <option :value="0">关闭</option>
                    <option :value="1">开启</option>
                  </select>
                </div>
              </div>
            </template>

            <!-- Vless 特有字段 -->
            <template v-if="currentType === 'vless'">
              <h3 class="section-title">VLESS 配置</h3>
              <div class="form-grid">
                <div class="form-row">
                  <label>传输层 <span class="req">*</span></label>
                  <select v-model="form.network" class="input">
                    <option v-for="n in networks" :key="n" :value="n">{{ n }}</option>
                  </select>
                </div>
                <div class="form-row">
                  <label>TLS <span class="req">*</span></label>
                  <select v-model.number="form.tls" class="input">
                    <option :value="0">关闭</option>
                    <option :value="1">开启</option>
                    <option :value="2">Reality</option>
                  </select>
                </div>
                <div class="form-row">
                  <label>Flow</label>
                  <select v-model="form.flow" class="input">
                    <option value="">无</option>
                    <option value="xtls-rprx-vision">xtls-rprx-vision</option>
                  </select>
                </div>
              </div>
            </template>

            <!-- Trojan 特有字段 -->
            <template v-if="currentType === 'trojan'">
              <h3 class="section-title">Trojan 配置</h3>
              <div class="form-grid">
                <div class="form-row">
                  <label>证书域名</label>
                  <input v-model="form.server_name" class="input" />
                </div>
                <div class="form-row">
                  <label>允许不安全</label>
                  <select v-model.number="form.allow_insecure" class="input">
                    <option :value="0">否</option>
                    <option :value="1">是</option>
                  </select>
                </div>
              </div>
            </template>

            <!-- Shadowsocks 特有字段 -->
            <template v-if="currentType === 'shadowsocks'">
              <h3 class="section-title">Shadowsocks 配置</h3>
              <div class="form-grid">
                <div class="form-row">
                  <label>加密方式</label>
                  <select v-model="form.cipher" class="input">
                    <option v-for="c in ciphers" :key="c" :value="c">{{ c }}</option>
                  </select>
                </div>
                <div class="form-row">
                  <label>混淆</label>
                  <input v-model="form.obfs" class="input" placeholder="如 http" />
                </div>
              </div>
            </template>

            <!-- Hysteria 特有字段 -->
            <template v-if="currentType === 'hysteria'">
              <h3 class="section-title">Hysteria 配置</h3>
              <div class="form-grid">
                <div class="form-row">
                  <label>版本 <span class="req">*</span></label>
                  <select v-model.number="form.version" class="input">
                    <option :value="1">1</option>
                    <option :value="2">2</option>
                  </select>
                </div>
                <div class="form-row">
                  <label>上行 Mbps</label>
                  <input v-model.number="form.up_mbps" class="input" type="number" />
                </div>
                <div class="form-row">
                  <label>下行 Mbps</label>
                  <input v-model.number="form.down_mbps" class="input" type="number" />
                </div>
                <div class="form-row">
                  <label>混淆</label>
                  <input v-model="form.obfs" class="input" />
                </div>
                <div class="form-row">
                  <label>证书域名</label>
                  <input v-model="form.server_name" class="input" />
                </div>
                <div class="form-row">
                  <label>允许不安全</label>
                  <select v-model.number="form.insecure" class="input">
                    <option :value="0">否</option>
                    <option :value="1">是</option>
                  </select>
                </div>
              </div>
            </template>

            <!-- Tuic 特有字段 -->
            <template v-if="currentType === 'tuic'">
              <h3 class="section-title">TUIC 配置</h3>
              <div class="form-grid">
                <div class="form-row">
                  <label>证书域名</label>
                  <input v-model="form.server_name" class="input" />
                </div>
                <div class="form-row">
                  <label>拥塞控制</label>
                  <input v-model="form.congestion_control" class="input" placeholder="bbr" />
                </div>
                <div class="form-row">
                  <label>允许不安全</label>
                  <select v-model.number="form.insecure" class="input">
                    <option :value="0">否</option>
                    <option :value="1">是</option>
                  </select>
                </div>
              </div>
            </template>

            <!-- AnyTLS 特有字段 -->
            <template v-if="currentType === 'anytls'">
              <h3 class="section-title">AnyTLS 配置</h3>
              <div class="form-grid">
                <div class="form-row">
                  <label>证书域名</label>
                  <input v-model="form.server_name" class="input" />
                </div>
                <div class="form-row">
                  <label>允许不安全</label>
                  <select v-model.number="form.insecure" class="input">
                    <option :value="0">否</option>
                    <option :value="1">是</option>
                  </select>
                </div>
              </div>
            </template>

            <div class="modal-footer">
              <button type="button" class="btn" @click="showModal = false">取消</button>
              <button type="submit" class="btn primary" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  fetchNodes, saveNode, dropNode, updateNode, copyNode,
  type ServerNode, type ServerType
} from '../../api/admin/server'

const serverTypes = [
  { value: 'v2node', label: 'V2Node (通用)' },
  { value: 'vmess', label: 'VMess' },
  { value: 'vless', label: 'VLESS' },
  { value: 'trojan', label: 'Trojan' },
  { value: 'shadowsocks', label: 'Shadowsocks' },
  { value: 'hysteria', label: 'Hysteria' },
  { value: 'tuic', label: 'TUIC' },
  { value: 'anytls', label: 'AnyTLS' }
]

const protocols = ['shadowsocks', 'vmess', 'vless', 'trojan', 'tuic', 'hysteria2', 'anytls']
const networks = ['tcp', 'ws', 'grpc', 'http', 'httpupgrade', 'xhttp']
const ciphers = ['aes-128-gcm', 'aes-256-gcm', 'chacha20-ietf-poly1305', '2022-blake3-aes-128-gcm', '2022-blake3-aes-256-gcm']

const rows = ref<ServerNode[]>([])
const loading = ref(true)
const filterType = ref('all')
const addType = ref<ServerType>('v2node')
const showModal = ref(false)
const saving = ref(false)
const editId = ref<number | null>(null)
const currentType = ref<ServerType>('v2node')
const form = ref<Record<string, any>>({})
const groupIdText = ref('')
const routeIdText = ref('')
const tagsText = ref('')

const filterTabs = computed(() => {
  const counts: Record<string, number> = { all: rows.value.length }
  for (const s of rows.value) {
    counts[s.type] = (counts[s.type] || 0) + 1
  }
  const tabs = [{ value: 'all', label: '全部', count: counts.all }]
  for (const t of serverTypes) {
    if (counts[t.value]) tabs.push({ value: t.value, label: t.label, count: counts[t.value] })
  }
  return tabs
})

const filtered = computed(() => {
  if (filterType.value === 'all') return rows.value
  return rows.value.filter(s => s.type === filterType.value)
})

function hasField(_field: string) {
  return ['v2node', 'vless', 'hysteria', 'tuic', 'anytls'].includes(currentType.value)
}

async function load() {
  loading.value = true
  try { rows.value = await fetchNodes() } finally { loading.value = false }
}

function openAdd() {
  editId.value = null
  currentType.value = addType.value
  form.value = { name: '', host: '', port: '', rate: '1', show: 0, sort: 0 }
  groupIdText.value = ''
  routeIdText.value = ''
  tagsText.value = ''
  showModal.value = true
}

function openEdit(s: ServerNode) {
  editId.value = s.id
  currentType.value = s.type as ServerType
  form.value = { ...s }
  groupIdText.value = Array.isArray(s.group_id) ? s.group_id.join(',') : ''
  routeIdText.value = Array.isArray(s.route_id) ? s.route_id.join(',') : ''
  tagsText.value = Array.isArray(s.tags) ? s.tags.join(',') : ''
  showModal.value = true
}

async function doSave() {
  saving.value = true
  try {
    const body: Record<string, unknown> = { ...form.value }
    body.group_id = groupIdText.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
    body.route_id = routeIdText.value ? routeIdText.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)) : []
    body.tags = tagsText.value ? tagsText.value.split(',').map(s => s.trim()).filter(Boolean) : []
    delete body.type
    if (editId.value) body.id = editId.value
    await saveNode(currentType.value, body)
    showModal.value = false
    await load()
  } catch (e: any) {
    alert(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function doToggle(s: ServerNode) {
  try {
    await updateNode(s.type as ServerType, { id: s.id, show: s.show === 1 ? 0 : 1 })
    await load()
  } catch (e: any) { alert(e.message || '操作失败') }
}

async function doCopy(s: ServerNode) {
  if (!confirm(`复制节点「${s.name}」？`)) return
  try { await copyNode(s.type as ServerType, s.id); await load() }
  catch (e: any) { alert(e.message || '复制失败') }
}

async function doDrop(s: ServerNode) {
  if (!confirm(`确定删除节点「${s.name}」？`)) return
  try { await dropNode(s.type as ServerType, s.id); await load() }
  catch (e: any) { alert(e.message || '删除失败') }
}

onMounted(load)
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: center; justify-content: space-between; }
.page-title { font-size: 20px; font-weight: 600; }
.header-actions { display: flex; gap: 8px; align-items: center; }
.select-type { width: 160px; }

.filters { display: flex; gap: 6px; flex-wrap: wrap; }
.filter-btn { padding: 5px 12px; border: 1px solid #334155; border-radius: 6px; background: #1e293b; color: #94a3b8; cursor: pointer; font-size: 12px; }
.filter-btn.active { background: #2563eb; border-color: #2563eb; color: #fff; }
.filter-btn:hover:not(.active) { background: #334155; }

.panel { background: #111827; border: 1px solid #1e293b; border-radius: 10px; padding: 16px; overflow-x: auto; }
.loading, .empty { padding: 32px; text-align: center; color: #9ca3af; }

.table { width: 100%; border-collapse: collapse; font-size: 13px; }
.table th, .table td { border: 1px solid #1e293b; padding: 8px 12px; text-align: left; white-space: nowrap; }
.table th { background: #0f172a; color: #94a3b8; font-weight: 500; }
.table td { color: #e5e7eb; }
.actions-cell { display: flex; gap: 5px; }

.tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
.tag-vmess { background: #1e3a5f; color: #93c5fd; }
.tag-vless { background: #1a3a2f; color: #86efac; }
.tag-trojan { background: #3b2f1a; color: #fcd34d; }
.tag-shadowsocks { background: #3b1a3b; color: #f0abfc; }
.tag-hysteria { background: #3b1a1a; color: #fca5a5; }
.tag-tuic { background: #1a2f3b; color: #7dd3fc; }
.tag-anytls { background: #2f3b1a; color: #bef264; }
.tag-v2node { background: #2d1b69; color: #c4b5fd; }

.btn { padding: 6px 16px; border: 1px solid #334155; border-radius: 6px; background: #1e293b; color: #e5e7eb; cursor: pointer; font-size: 13px; }
.btn.primary { background: #2563eb; border-color: #2563eb; color: #fff; }
.btn.primary:hover { background: #1d4ed8; }
.btn:disabled { opacity: .5; cursor: not-allowed; }

.btn-sm { padding: 3px 8px; border: none; border-radius: 4px; font-size: 11px; cursor: pointer; color: #fff; }
.btn-sm.on { background: #16a34a; }
.btn-sm.off { background: #6b7280; }
.btn-sm.edit { background: #2563eb; }
.btn-sm.copy { background: #8b5cf6; }
.btn-sm.danger { background: #dc2626; }

.modal-mask { position: fixed; inset: 0; background: rgba(0,0,0,.55); display: flex; align-items: flex-start; justify-content: center; z-index: 1000; padding-top: 40px; overflow-y: auto; }
.modal { background: #1e293b; border-radius: 12px; width: 680px; max-width: 95vw; margin-bottom: 40px; }
.modal-wide { width: 680px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #334155; }
.modal-header h2 { font-size: 16px; font-weight: 600; margin: 0; }
.modal-close { background: none; border: none; color: #94a3b8; font-size: 22px; cursor: pointer; }
.modal-body { padding: 20px; max-height: 70vh; overflow-y: auto; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }

.section-title { font-size: 14px; font-weight: 600; color: #94a3b8; margin: 18px 0 10px; padding-top: 12px; border-top: 1px solid #334155; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px; }
.form-row { margin-bottom: 4px; }
.form-row label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 3px; }
.req { color: #ef4444; }
.input { width: 100%; padding: 7px 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #e5e7eb; font-size: 13px; box-sizing: border-box; }
.input:focus { outline: none; border-color: #2563eb; }
</style>
