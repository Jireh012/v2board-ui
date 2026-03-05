<template>
  <div class="traffic-page">
    <div class="header-section animate-fade-in">
      <h1 class="page-title">流量使用明细</h1>
      <p class="page-subtitle">查看您每日在不同节点上产生的下行与上行流量消耗。</p>
    </div>

    <!-- 汇总卡片 -->
    <div class="summary-grid animate-fade-in delay-100">
      <div class="stat-card">
        <div class="icon-box icon-blue">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
        </div>
        <div class="stat-main">
          <span class="l">总计消耗流量</span>
          <div class="v">{{ totalTraffic }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon-box icon-green">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </div>
        <div class="stat-main">
          <span class="l">总下行流量</span>
          <div class="v">{{ totalDown }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon-box icon-orange">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </div>
        <div class="stat-main">
          <span class="l">总上行流量</span>
          <div class="v">{{ totalUp }}</div>
        </div>
      </div>
    </div>

    <!-- 数据列表 -->
    <div class="card table-card animate-fade-in delay-200">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>正在拉取明细记录...</p>
      </div>
      
      <div v-else-if="logs.length" class="table-container">
        <table class="premium-table">
          <thead>
            <tr>
              <th>结算时间</th>
              <th>倍率</th>
              <th>上行 (UP)</th>
              <th>下行 (DOWN)</th>
              <th style="text-align: right">合计消耗</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td class="time-cell">{{ formatDate(log.record_at) }}</td>
              <td><span class="rate-badge">{{ log.server_rate }}x</span></td>
              <td class="traffic-up">{{ formatTraffic(log.u) }}</td>
              <td class="traffic-down">{{ formatTraffic(log.d) }}</td>
              <td class="traffic-total" style="text-align: right">{{ formatTraffic(log.u + log.d) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>暂无流量使用记录</h3>
        <p>当您开始使用节点产生连接后，明细将显示在这里。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { getTrafficLog, type TrafficLog } from '../api/user'

const logs = ref<TrafficLog[]>([])
const loading = ref(false)

async function loadLogs() {
  loading.value = true
  try {
    const res = await getTrafficLog()
    logs.value = res
  } catch (e) {
    console.error('Fetch traffic logs error:', e)
  } finally {
    loading.value = false
  }
}

const totalUpRaw = computed(() => logs.value.reduce((sum: number, log: TrafficLog) => sum + (log.u || 0), 0))
const totalDownRaw = computed(() => logs.value.reduce((sum: number, log: TrafficLog) => sum + (log.d || 0), 0))

const totalUp = computed(() => formatTraffic(totalUpRaw.value))
const totalDown = computed(() => formatTraffic(totalDownRaw.value))
const totalTraffic = computed(() => formatTraffic(totalUpRaw.value + totalDownRaw.value))

function formatTraffic(bytes: number | null | undefined): string {
  if (!bytes) return '0.00 B'
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

function formatDate(ts: number | null | undefined): string {
  if (!ts) return '-'
  // 兼容秒级和毫秒级时间戳
  const date = new Date(ts > 100000000000 ? ts : ts * 1000)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(loadLogs)
</script>

<style scoped>
.traffic-page { max-width: 1100px; margin: 0 auto; }
.header-section { margin-bottom: 32px; }
.page-title { font-size: 32px; font-weight: 800; color: var(--text-main); margin-bottom: 8px; }
.page-subtitle { font-size: 16px; color: var(--text-muted); }

.summary-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-bottom: 32px;
}

.stat-card {
  background: white; border-radius: 20px; padding: 24px; border: 1px solid var(--border-color);
  display: flex; align-items: center; gap: 20px; box-shadow: var(--shadow-sm);
}

.icon-box {
  width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center;
}
.icon-blue { background: #eff6ff; color: #2563eb; }
.icon-green { background: #ecfdf5; color: #10b981; }
.icon-orange { background: #fff7ed; color: #f97316; }

.stat-main .l { font-size: 13px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px; display: block; }
.stat-main .v { font-size: 22px; font-weight: 800; color: var(--text-main); letter-spacing: -0.5px; }

.table-card { padding: 4px; border-radius: 20px; background: white; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); overflow: hidden; }

.table-container { width: 100%; overflow-x: auto; }

.premium-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.premium-table th {
  padding: 20px 24px; text-align: left; background: #f8fafc; color: #94a3b8; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-color);
}
.premium-table td { padding: 20px 24px; color: var(--text-main); font-weight: 600; border-bottom: 1px solid #f8fafc; }
.premium-table tr:last-child td { border-bottom: none; }

.time-cell { color: var(--text-muted); font-weight: 500; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
.rate-badge {
  background: #f1f5f9; color: #475569; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 800;
}

.traffic-up { color: #f97316; }
.traffic-down { color: #10b981; }
.traffic-total { font-weight: 800; color: var(--text-main); }

.loading-state { padding: 100px 0; text-align: center; color: var(--text-muted); }
.spinner {
  width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: var(--primary-color);
  border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state { padding: 100px 40px; text-align: center; }
.empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
.empty-state h3 { font-size: 18px; font-weight: 800; color: var(--text-main); margin-bottom: 8px; }
.empty-state p { color: var(--text-muted); font-size: 15px; }

.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; opacity: 0; }
.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 800px) { .header-section { text-align: center; } }
</style>
