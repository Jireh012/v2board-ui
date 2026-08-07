<template>
  <div class="dtp" ref="rootEl">
    <button
      type="button"
      class="dtp-trigger"
      :class="{ open: open, empty: !modelValue }"
      @click.stop="toggle"
    >
      <span class="dtp-value">{{ displayText }}</span>
      <span class="dtp-icons">
        <button
          v-if="modelValue && clearable"
          type="button"
          class="dtp-icon-btn"
          title="清除"
          @click.stop="clear"
        >
          ×
        </button>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
      </span>
    </button>

    <Teleport to="body">
      <div v-if="open" class="dtp-pop" :style="popStyle" @click.stop>
        <div class="dtp-panel">
          <div class="dtp-cal">
            <div class="dtp-cal-head">
              <button type="button" class="nav" @click="shiftMonth(-1)" aria-label="上一月">‹</button>
              <div class="ym">
                <select v-model.number="viewYear" class="ym-select">
                  <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}年</option>
                </select>
                <select v-model.number="viewMonth" class="ym-select">
                  <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
                </select>
              </div>
              <button type="button" class="nav" @click="shiftMonth(1)" aria-label="下一月">›</button>
            </div>
            <div class="dtp-week">
              <span v-for="w in weekLabels" :key="w">{{ w }}</span>
            </div>
            <div class="dtp-days">
              <button
                v-for="(cell, idx) in dayCells"
                :key="idx"
                type="button"
                class="day"
                :class="{
                  mute: !cell.inMonth,
                  today: cell.isToday,
                  selected: cell.isSelected
                }"
                @click="pickDay(cell.date)"
              >
                {{ cell.day }}
              </button>
            </div>
            <div class="dtp-cal-foot">
              <button type="button" class="link" @click="clear">清除</button>
              <button type="button" class="link primary" @click="pickToday">今天</button>
            </div>
          </div>

          <div class="dtp-time">
            <div class="dtp-time-title">时间</div>
            <div class="dtp-time-cols">
              <div class="col" ref="hourCol">
                <button
                  v-for="h in 24"
                  :key="'h' + h"
                  type="button"
                  class="slot"
                  :class="{ active: hour === h - 1 }"
                  @click="setHour(h - 1)"
                >
                  {{ pad(h - 1) }}
                </button>
              </div>
              <div class="col" ref="minCol">
                <button
                  v-for="m in 60"
                  :key="'m' + m"
                  type="button"
                  class="slot"
                  :class="{ active: minute === m - 1 }"
                  @click="setMinute(m - 1)"
                >
                  {{ pad(m - 1) }}
                </button>
              </div>
            </div>
            <div class="dtp-time-now">{{ pad(hour) }}:{{ pad(minute) }}</div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    clearable?: boolean
  }>(),
  {
    modelValue: '',
    placeholder: '长期有效',
    clearable: true
  }
)

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const weekLabels = ['日', '一', '二', '三', '四', '五', '六']
const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)
const hourCol = ref<HTMLElement | null>(null)
const minCol = ref<HTMLElement | null>(null)
const popStyle = ref<Record<string, string>>({})

const now = new Date()
const viewYear = ref(now.getFullYear())
const viewMonth = ref(now.getMonth() + 1)
const hour = ref(now.getHours())
const minute = ref(now.getMinutes())
const selectedYmd = ref<string | null>(null)

const yearOptions = computed(() => {
  const y = now.getFullYear()
  const list: number[] = []
  for (let i = y - 5; i <= y + 15; i++) list.push(i)
  return list
})

const displayText = computed(() => {
  if (!props.modelValue) return props.placeholder
  const d = parseLocal(props.modelValue)
  if (!d) return props.placeholder
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
})

type DayCell = { date: Date; day: number; inMonth: boolean; isToday: boolean; isSelected: boolean }

const dayCells = computed((): DayCell[] => {
  const y = viewYear.value
  const m = viewMonth.value
  const first = new Date(y, m - 1, 1)
  const start = new Date(first)
  start.setDate(1 - first.getDay())
  const todayKey = ymd(now)
  const selectedKey = selectedYmd.value
  const cells: DayCell[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const key = ymd(d)
    cells.push({
      date: d,
      day: d.getDate(),
      inMonth: d.getMonth() === m - 1,
      isToday: key === todayKey,
      isSelected: !!selectedKey && key === selectedKey
    })
  }
  return cells
})

function pad(n: number) {
  return String(n).padStart(2, '0')
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function parseLocal(v: string): Date | null {
  if (!v) return null
  // YYYY-MM-DDTHH:mm
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]))
}
function toLocal(d: Date) {
  return `${ymd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function syncFromModel() {
  const d = parseLocal(props.modelValue || '')
  if (!d) {
    selectedYmd.value = null
    const n = new Date()
    viewYear.value = n.getFullYear()
    viewMonth.value = n.getMonth() + 1
    hour.value = 23
    minute.value = 59
    return
  }
  selectedYmd.value = ymd(d)
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth() + 1
  hour.value = d.getHours()
  minute.value = d.getMinutes()
}

function emitValue() {
  if (!selectedYmd.value) {
    emit('update:modelValue', '')
    return
  }
  const [y, m, day] = selectedYmd.value.split('-').map(Number)
  const d = new Date(y, m - 1, day, hour.value, minute.value)
  emit('update:modelValue', toLocal(d))
}

function positionPop() {
  const el = rootEl.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const popW = 360
  const popH = 340
  let left = rect.left
  let top = rect.bottom + 8
  if (left + popW > window.innerWidth - 12) left = window.innerWidth - popW - 12
  if (left < 12) left = 12
  if (top + popH > window.innerHeight - 12) top = Math.max(12, rect.top - popH - 8)
  popStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    zIndex: '4600'
  }
}

async function scrollTime() {
  await nextTick()
  const scrollToActive = (col: HTMLElement | null, index: number) => {
    if (!col) return
    const btn = col.children[index] as HTMLElement | undefined
    if (!btn) return
    col.scrollTop = btn.offsetTop - col.clientHeight / 2 + btn.clientHeight / 2
  }
  scrollToActive(hourCol.value, hour.value)
  scrollToActive(minCol.value, minute.value)
}

async function toggle() {
  open.value = !open.value
  if (open.value) {
    syncFromModel()
    positionPop()
    await scrollTime()
  }
}

function close() {
  open.value = false
}

function clear() {
  selectedYmd.value = null
  emit('update:modelValue', '')
  close()
}

function pickToday() {
  const n = new Date()
  selectedYmd.value = ymd(n)
  viewYear.value = n.getFullYear()
  viewMonth.value = n.getMonth() + 1
  hour.value = n.getHours()
  minute.value = n.getMinutes()
  emitValue()
  scrollTime()
}

function pickDay(d: Date) {
  selectedYmd.value = ymd(d)
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth() + 1
  emitValue()
}

function setHour(h: number) {
  hour.value = h
  if (!selectedYmd.value) selectedYmd.value = ymd(new Date())
  emitValue()
}

function setMinute(m: number) {
  minute.value = m
  if (!selectedYmd.value) selectedYmd.value = ymd(new Date())
  emitValue()
}

function shiftMonth(delta: number) {
  const d = new Date(viewYear.value, viewMonth.value - 1 + delta, 1)
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth() + 1
}

function onDocClick(e: MouseEvent) {
  const t = e.target as HTMLElement
  if (t.closest('.dtp') || t.closest('.dtp-pop')) return
  close()
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

watch(() => props.modelValue, syncFromModel, { immediate: true })

onMounted(() => {
  document.addEventListener('click', onDocClick)
  window.addEventListener('keydown', onKey)
  window.addEventListener('resize', () => open.value && positionPop())
  document.addEventListener('scroll', () => open.value && positionPop(), true)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  window.removeEventListener('keydown', onKey)
})
</script>

<style scoped>
.dtp { width: 100%; position: relative; }

.dtp-trigger {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  box-sizing: border-box;
  text-align: left;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.dtp-trigger:hover { border-color: #cbd5e1; }
.dtp-trigger.open {
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.dtp-value {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}
.dtp-trigger.empty .dtp-value { color: #94a3b8; font-weight: 500; }

.dtp-icons {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #94a3b8;
  flex-shrink: 0;
}

.dtp-icon-btn {
  border: 0;
  background: #f1f5f9;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  color: #64748b;
  cursor: pointer;
  line-height: 1;
  font-size: 14px;
}
.dtp-icon-btn:hover { background: #e2e8f0; color: #0f172a; }
</style>

<style>
.dtp-pop {
  animation: dtp-in 0.16s ease-out;
}

@keyframes dtp-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.dtp-panel {
  display: flex;
  width: 360px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.16);
  overflow: hidden;
}

.dtp-cal {
  flex: 1;
  padding: 12px;
  border-right: 1px solid #f1f5f9;
}

.dtp-cal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 10px;
}

.dtp-cal-head .nav {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 8px;
  background: #f8fafc;
  color: #475569;
  cursor: pointer;
  font-size: 16px;
  font-weight: 700;
}
.dtp-cal-head .nav:hover { background: #eff6ff; color: #2563eb; }

.ym { display: flex; gap: 4px; }
.ym-select {
  border: 0;
  background: #f8fafc;
  border-radius: 8px;
  padding: 4px 6px;
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
  cursor: pointer;
}

.dtp-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 4px;
}
.dtp-week span {
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  padding: 4px 0;
}

.dtp-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.day {
  height: 32px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #0f172a;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.day:hover { background: #f1f5f9; }
.day.mute { color: #cbd5e1; font-weight: 500; }
.day.today { box-shadow: inset 0 0 0 1.5px #93c5fd; color: #1d4ed8; }
.day.selected {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #fff;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.35);
}
.day.selected.today { box-shadow: 0 4px 10px rgba(37, 99, 235, 0.35); }

.dtp-cal-foot {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
}

.dtp-cal-foot .link {
  border: 0;
  background: transparent;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
}
.dtp-cal-foot .link:hover { background: #f1f5f9; color: #0f172a; }
.dtp-cal-foot .link.primary { color: #2563eb; }
.dtp-cal-foot .link.primary:hover { background: #eff6ff; }

.dtp-time {
  width: 108px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  background: #fafbfc;
}

.dtp-time-title {
  font-size: 11px;
  font-weight: 800;
  color: #94a3b8;
  text-align: center;
  margin-bottom: 8px;
}

.dtp-time-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  flex: 1;
  min-height: 220px;
}

.dtp-time .col {
  overflow-y: auto;
  max-height: 220px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #eef2f7;
  scrollbar-width: thin;
}

.slot {
  display: block;
  width: 100%;
  border: 0;
  background: transparent;
  padding: 7px 0;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  font-variant-numeric: tabular-nums;
}
.slot:hover { background: #f1f5f9; color: #0f172a; }
.slot.active {
  background: #2563eb;
  color: #fff;
}

.dtp-time-now {
  margin-top: 8px;
  text-align: center;
  font-size: 13px;
  font-weight: 800;
  color: #1d4ed8;
  background: #eff6ff;
  border-radius: 8px;
  padding: 6px 0;
  font-variant-numeric: tabular-nums;
}
</style>
