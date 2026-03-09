<template>
  <div class="page">
    <h1>套餐管理</h1>
    <p class="hint">数据来自 /api/v1/admin/plan/fetch，支持创建/编辑/删除。</p>

    <section class="toolbar">
      <button class="btn" @click="onCreate">新建套餐</button>
      <button class="btn secondary" :disabled="sorting" @click="onSaveSort">保存排序</button>
    </section>

    <section v-if="editing" class="card">
      <h2>{{ editing.id ? '编辑套餐' : '新建套餐' }}</h2>
      <form @submit.prevent="onSave">
        <label class="field">
          <span>名称</span>
          <input v-model="editing.name" required />
        </label>
        <label class="field">
          <span>总流量（GB）</span>
          <input v-model.number="editing.transferEnableGb" type="number" min="0" step="1" />
        </label>
        <label class="field">
          <span>月付价格（元）</span>
          <input v-model.number="editing.monthPriceYuan" type="number" min="0" step="0.01" />
        </label>
        <label class="field">
          <span>年付价格（元）</span>
          <input v-model.number="editing.yearPriceYuan" type="number" min="0" step="0.01" />
        </label>
        <label class="field checkbox">
          <input v-model="editing.show" type="checkbox" />
          <span>前台显示</span>
        </label>
        <label class="field checkbox">
          <input v-model="editing.renew" type="checkbox" />
          <span>允许续费</span>
        </label>
        <label class="field checkbox">
          <input v-model="editing.forceUpdate" type="checkbox" />
          <span>同步更新当前套餐下所有用户的流量配置（force_update）</span>
        </label>
        <button class="btn" type="submit" :disabled="saving">
          {{ saving ? '保存中...' : '保存套餐' }}
        </button>
        <span v-if="error" class="error-text">{{ error }}</span>
      </form>
    </section>

    <table v-if="plans.length" class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>名称</th>
          <th>流量（GB）</th>
          <th>排序</th>
          <th>显示</th>
          <th>允许续费</th>
          <th>当前用户数</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(p, index) in plans" :key="p.id">
          <td>{{ p.id }}</td>
          <td>{{ p.name }}</td>
          <td>{{ formatGb(p.transferEnable) }}</td>
          <td>
            <button class="btn-small" @click="moveUp(index)">上移</button>
            <button class="btn-small" @click="moveDown(index)">下移</button>
            <span class="sort-index">#{{ p.sort }}</span>
          </td>
          <td>{{ p.show ? '是' : '否' }}</td>
          <td>{{ p.renew ? '是' : '否' }}</td>
          <td>{{ p.count ?? 0 }}</td>
          <td>
            <button class="btn-small" @click="onEdit(p)">编辑</button>
            <button class="btn-small danger" @click="onDrop(p)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else>暂无套餐数据。</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue'
import { fetchAdminPlans, saveAdminPlan, dropAdminPlan, sortAdminPlans, type AdminPlan } from '../../api/admin'

interface PlanForm {
  id?: number
  name: string
  transferEnableGb: number
  monthPriceYuan: number
  yearPriceYuan: number
  show: boolean
  renew: boolean
  forceUpdate: boolean
}

const plans = ref<AdminPlan[]>([])
const editing = ref<PlanForm | null>(null)
const saving = ref(false)
const error = ref('')
const sorting = ref(false)

function formatGb(bytes?: number): string {
  if (!bytes) return '0'
  const gb = bytes / 1073741824
  return gb.toFixed(2)
}

async function load() {
  const list = await fetchAdminPlans()
  plans.value = list.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
}

function onCreate() {
  editing.value = reactive<PlanForm>({
    name: '',
    transferEnableGb: 0,
    monthPriceYuan: 0,
    yearPriceYuan: 0,
    show: true,
    renew: true,
    forceUpdate: false
  })
  error.value = ''
}

function onEdit(p: AdminPlan) {
  editing.value = reactive<PlanForm>({
    id: p.id,
    name: p.name,
    transferEnableGb: p.transferEnable ? p.transferEnable / 1073741824 : 0,
    monthPriceYuan: p.monthPrice ? p.monthPrice / 100 : 0,
    yearPriceYuan: p.yearPrice ? p.yearPrice / 100 : 0,
    show: p.show === 1,
    renew: p.renew === 1,
    forceUpdate: false
  })
  error.value = ''
}

async function onDrop(p: AdminPlan) {
  if (!p.id) return
  if (!window.confirm(`确定要删除套餐「${p.name}」吗？`)) return
  try {
    await dropAdminPlan(p.id)
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '删除失败'
  }
}

async function onSave() {
  if (!editing.value) return
  saving.value = true
  error.value = ''
  try {
    const payload: AdminPlan = {
      id: editing.value.id,
      name: editing.value.name,
      transferEnable: Math.round(editing.value.transferEnableGb * 1073741824),
      monthPrice: Math.round(editing.value.monthPriceYuan * 100),
      yearPrice: Math.round(editing.value.yearPriceYuan * 100),
      show: editing.value.show ? 1 : 0,
      renew: editing.value.renew ? 1 : 0
    }
    await saveAdminPlan(payload, editing.value.forceUpdate)
    editing.value = null
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '保存失败'
  } finally {
    saving.value = false
  }
}

onMounted(load)

function moveUp(index: number) {
  if (index <= 0) return
  const tmp = plans.value[index - 1]
  plans.value[index - 1] = plans.value[index]
  plans.value[index] = tmp
  plans.value.forEach((p, i) => {
    p.sort = i + 1
  })
}

function moveDown(index: number) {
  if (index >= plans.value.length - 1) return
  const tmp = plans.value[index + 1]
  plans.value[index + 1] = plans.value[index]
  plans.value[index] = tmp
  plans.value.forEach((p, i) => {
    p.sort = i + 1
  })
}

async function onSaveSort() {
  sorting.value = true
  error.value = ''
  try {
    const ids = plans.value.map(p => p.id!).filter(Boolean)
    await sortAdminPlans(ids)
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '保存排序失败'
  } finally {
    sorting.value = false
  }
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hint {
  font-size: 13px;
  color: #9ca3af;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.table th,
.table td {
  border: 1px solid #1f2937;
  padding: 6px 8px;
}

.table th {
  background: #020617;
  text-align: left;
}

.toolbar {
  display: flex;
  justify-content: flex-start;
}

.btn {
  padding: 6px 12px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #f9fafb;
  font-size: 13px;
  cursor: pointer;
}

.btn.secondary {
  margin-left: 8px;
  background: transparent;
  border: 1px solid #4b5563;
}

.btn-small {
  padding: 4px 8px;
  border-radius: 999px;
  border: none;
  font-size: 12px;
  cursor: pointer;
  margin-right: 4px;
}

.btn-small.danger {
  background: #b91c1c;
  color: #fef2f2;
}

.card {
  background: rgba(15, 23, 42, 0.95);
  border-radius: 12px;
  padding: 14px 16px;
  border: 1px solid #1f2937;
}

.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
  font-size: 13px;
}

.field span {
  margin-bottom: 4px;
}

.field input {
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid #374151;
  background: #020617;
  color: #e5e7eb;
}

.field.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 6px;
}

.error-text {
  margin-left: 10px;
  font-size: 12px;
  color: #fb7185;
}

.sort-index {
  margin-left: 4px;
  font-size: 12px;
  color: #9ca3af;
}
</style>

