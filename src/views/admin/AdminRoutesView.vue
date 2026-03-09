<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">路由管理</h1>
      <button class="btn primary" @click="openAdd">添加路由</button>
    </div>

    <div class="panel">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="!rows.length" class="empty">暂无路由规则，请点击上方按钮添加。</div>
      <table v-else class="table">
        <thead>
          <tr>
            <th style="width:60px">#</th>
            <th>备注</th>
            <th>动作</th>
            <th>动作值</th>
            <th>匹配规则</th>
            <th style="width:180px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.id">
            <td>{{ r.id }}</td>
            <td>{{ r.remarks }}</td>
            <td><span class="tag">{{ r.action }}</span></td>
            <td>{{ r.action_value || '-' }}</td>
            <td class="match-cell">{{ fmtMatch(r.match) }}</td>
            <td class="actions-cell">
              <button class="btn-sm edit" @click="openEdit(r)">编辑</button>
              <button class="btn-sm danger" @click="doDrop(r)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-mask" @click.self="showModal = false">
        <div class="modal">
          <div class="modal-header">
            <h2>{{ editId ? '编辑路由' : '添加路由' }}</h2>
            <button class="modal-close" @click="showModal = false">&times;</button>
          </div>
          <form class="modal-body" @submit.prevent="doSave">
            <div class="form-row">
              <label>备注 <span class="req">*</span></label>
              <input v-model="form.remarks" class="input" placeholder="路由备注" required />
            </div>
            <div class="form-row">
              <label>动作类型 <span class="req">*</span></label>
              <select v-model="form.action" class="input" required>
                <option value="">-- 请选择 --</option>
                <option v-for="a in actions" :key="a" :value="a">{{ a }}</option>
              </select>
            </div>
            <div class="form-row" v-if="form.action !== 'default_out'">
              <label>匹配规则（每行一个）</label>
              <textarea v-model="matchText" class="input textarea" rows="4"
                placeholder="每行一个匹配规则，如 geoip:cn"></textarea>
            </div>
            <div class="form-row">
              <label>动作值</label>
              <input v-model="form.action_value" class="input" placeholder="可选" />
            </div>
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
import { onMounted, ref } from 'vue'
import { fetchRoutes, saveRoute, dropRoute, ROUTE_ACTIONS, type ServerRoute } from '../../api/admin/route'

const rows = ref<ServerRoute[]>([])
const loading = ref(true)
const showModal = ref(false)
const saving = ref(false)
const editId = ref<number | null>(null)
const form = ref({ remarks: '', action: '', action_value: '' })
const matchText = ref('')
const actions = ROUTE_ACTIONS

async function load() {
  loading.value = true
  try { rows.value = await fetchRoutes() } finally { loading.value = false }
}

function fmtMatch(match: string[]) {
  if (!match || !match.length) return '-'
  return match.join(', ')
}

function openAdd() {
  editId.value = null
  form.value = { remarks: '', action: '', action_value: '' }
  matchText.value = ''
  showModal.value = true
}

function openEdit(r: ServerRoute) {
  editId.value = r.id
  form.value = { remarks: r.remarks, action: r.action, action_value: r.action_value || '' }
  matchText.value = Array.isArray(r.match) ? r.match.join('\n') : ''
  showModal.value = true
}

async function doSave() {
  saving.value = true
  try {
    const matchArr = form.value.action === 'default_out' ? [] :
      matchText.value.split('\n').map(s => s.trim()).filter(Boolean)
    await saveRoute({
      id: editId.value ?? undefined,
      remarks: form.value.remarks,
      match: matchArr,
      action: form.value.action,
      action_value: form.value.action_value || null
    })
    showModal.value = false
    await load()
  } catch (e: any) {
    alert(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function doDrop(r: ServerRoute) {
  if (!confirm(`确定删除路由「${r.remarks}」？`)) return
  try { await dropRoute(r.id); await load() } catch (e: any) { alert(e.message || '删除失败') }
}

onMounted(load)
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: center; justify-content: space-between; }
.page-title { font-size: 20px; font-weight: 600; }
.panel { background: #111827; border: 1px solid #1e293b; border-radius: 10px; padding: 16px; }
.loading, .empty { padding: 32px; text-align: center; color: #9ca3af; }

.table { width: 100%; border-collapse: collapse; font-size: 13px; }
.table th, .table td { border: 1px solid #1e293b; padding: 8px 12px; text-align: left; }
.table th { background: #0f172a; color: #94a3b8; font-weight: 500; }
.table td { color: #e5e7eb; }
.match-cell { max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.actions-cell { display: flex; gap: 6px; }

.tag { display: inline-block; padding: 2px 8px; background: #1e3a5f; border-radius: 4px; font-size: 12px; color: #93c5fd; }

.btn { padding: 6px 16px; border: 1px solid #334155; border-radius: 6px; background: #1e293b; color: #e5e7eb; cursor: pointer; font-size: 13px; }
.btn.primary { background: #2563eb; border-color: #2563eb; color: #fff; }
.btn.primary:hover { background: #1d4ed8; }
.btn:disabled { opacity: .5; cursor: not-allowed; }

.btn-sm { padding: 4px 10px; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; color: #fff; }
.btn-sm.edit { background: #2563eb; }
.btn-sm.edit:hover { background: #1d4ed8; }
.btn-sm.danger { background: #dc2626; }
.btn-sm.danger:hover { background: #b91c1c; }

.modal-mask { position: fixed; inset: 0; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #1e293b; border-radius: 12px; width: 500px; max-width: 90vw; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #334155; }
.modal-header h2 { font-size: 16px; font-weight: 600; margin: 0; }
.modal-close { background: none; border: none; color: #94a3b8; font-size: 22px; cursor: pointer; }
.modal-body { padding: 20px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }

.form-row { margin-bottom: 14px; }
.form-row label { display: block; font-size: 13px; color: #94a3b8; margin-bottom: 4px; }
.req { color: #ef4444; }
.input { width: 100%; padding: 8px 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #e5e7eb; font-size: 13px; box-sizing: border-box; }
.input:focus { outline: none; border-color: #2563eb; }
.textarea { resize: vertical; font-family: monospace; }
</style>
