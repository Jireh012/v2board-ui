<template>
  <div class="server-status-page">
    <div class="header-section animate-fade-in">
      <div class="header-main">
        <h1 class="page-title">节点状态</h1>
        <p class="page-subtitle">实时监控节点健康状况，为您提供最稳定的连接保证。</p>
      </div>
      <div class="header-actions">
        <button class="btn-refresh-premium" :disabled="loading" @click="load">
          <svg :class="{ 'spin': loading }" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
          {{ loading ? '同步中' : '刷新状态' }}
        </button>
      </div>
    </div>

    <div v-if="loading && !servers.length" class="loading-state">
      <div class="spinner"></div>
      <p>检测节点存活情况...</p>
    </div>

    <div v-else-if="servers.length" class="nodes-grid animate-fade-in delay-100">
      <div v-for="(s, index) in servers" :key="s.cache_key || `${s.type}-${s.id}-${index}`" class="node-card">
        <div class="node-header">
          <div class="node-icon-box" :class="s.is_online ? 'online' : 'offline'">
            <svg v-if="s.type === 'shadowsocks'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="12" x="2" y="9" rx="2"/><path d="M15 5h.01"/><path d="M4 9V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M9 5h.01"/><path d="M12 5h.01"/></svg>
          </div>
          <div class="node-title-group">
            <h3 class="node-name">{{ s.name || '未命名节点' }}</h3>
            <div class="node-tags">
               <span class="tag-type">{{ typeLabel(s.type) }}</span>
               <span class="tag-rate" v-if="rateDisplay(s.rate) !== '1'">{{ rateDisplay(s.rate) }}x 流量倍率</span>
            </div>
          </div>
          <div class="status-indicator" :class="{ 'is-online': s.is_online }">
             <div class="pulse-dot" v-if="s.is_online"></div>
             <span class="status-text">{{ s.is_online ? '在线' : '离线' }}</span>
          </div>
        </div>

        <div class="node-details">
           <div class="detail-item">
              <span class="label">连接地址</span>
              <span class="value code-font">{{ nodeAddr(s) }}</span>
           </div>
           <div class="detail-item">
              <span class="label">最近检测</span>
              <span class="value">{{ s.last_check_at ? formatTime(s.last_check_at) : '从未' }}</span>
           </div>
        </div>
        
        <div class="node-footer">
           <div class="progress-mini-bg">
              <div class="progress-mini-bar" :style="{ width: s.is_online ? '100%' : '0%' }"></div>
           </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
       <div class="empty-icon">📡</div>
       <h3>暂无可用节点</h3>
       <p>目前没有为您分配任何可用节点，这可能是由于您的订阅已到期或管理员尚未分配。</p>
       <button class="btn-primary-mini" @click="$router.push('/plan')">前往选购订阅</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchServers, type ServerNode } from '../api/server'

const servers = ref<ServerNode[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    servers.value = await fetchServers()
  } catch (e) {
    servers.value = []
  } finally {
    loading.value = false
  }
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    shadowsocks: 'Shadowsocks', vmess: 'VMess', trojan: 'Trojan', vless: 'VLESS',
    hysteria: 'Hysteria', v2node: 'V2Node', anytls: 'AnyTLS', tuic: 'Tuic'
  }
  return map[type] || type.toUpperCase() || '-'
}

function nodeAddr(s: ServerNode): string {
  return s.host ? (s.port ? `${s.host}:${s.port}` : s.host) : '隐藏地址'
}

function rateDisplay(rate: string | undefined): string {
  if (!rate) return '1'
  const n = parseFloat(rate)
  return Number.isNaN(n) ? rate : (n === 1 ? '1' : String(n))
}

function formatTime(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

onMounted(load)
</script>

<style scoped>
.server-status-page { max-width: 1100px; margin: 0 auto; }
.header-section { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
.page-title { font-size: 32px; font-weight: 800; color: var(--text-main); margin-bottom: 8px; }
.page-subtitle { font-size: 16px; color: var(--text-muted); margin: 0; }

.btn-refresh-premium {
  display: flex; align-items: center; gap: 8px; padding: 10px 20px;
  background: white; border: 1px solid var(--border-color); border-radius: 12px;
  font-size: 14px; font-weight: 700; color: var(--text-main); cursor: pointer;
  transition: all 0.2s; box-shadow: var(--shadow-sm);
}
.btn-refresh-premium:hover { border-color: #cbd5e1; background: #f8fafc; }
.btn-refresh-premium:disabled { opacity: 0.6; cursor: not-allowed; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.nodes-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px;
}

.node-card {
  background: white; border-radius: 20px; border: 1px solid var(--border-color);
  padding: 24px; box-shadow: var(--shadow-sm); transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.node-card:hover { transform: translateY(-4px); border-color: #cbd5e1; box-shadow: var(--shadow-md); }

.node-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }

.node-icon-box {
  width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center;
}
.node-icon-box.online { background: #ecfdf5; color: #10b981; }
.node-icon-box.offline { background: #f1f5f9; color: #94a3b8; }
.node-icon-box svg { width: 24px; height: 24px; }

.node-title-group { flex: 1; min-width: 0; }
.node-name { font-size: 16px; font-weight: 800; color: var(--text-main); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.node-tags { display: flex; gap: 6px; }
.tag-type { font-size: 11px; font-weight: 800; padding: 2px 8px; background: #f1f5f9; color: #64748b; border-radius: 6px; text-transform: uppercase; }
.tag-rate { font-size: 11px; font-weight: 800; padding: 2px 8px; background: #fff7ed; color: #f97316; border-radius: 6px; }

.status-indicator { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 800; color: #94a3b8; }
.status-indicator.is-online { color: #10b981; }

.pulse-dot {
  width: 8px; height: 8px; background: #10b981; border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); animation: pulse 2s infinite;
}
@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }

.node-details { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
.detail-item { display: flex; justify-content: space-between; align-items: center; }
.detail-item .label { font-size: 12px; font-weight: 700; color: var(--text-muted); }
.detail-item .value { font-size: 13px; font-weight: 700; color: var(--text-main); }
.code-font { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }

.node-footer { padding-top: 4px; }
.progress-mini-bg { height: 4px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
.progress-mini-bar { height: 100%; background: #10b981; border-radius: 99px; transition: width 0.5s ease; }

.loading-state { padding: 100px 0; text-align: center; }
.spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }

.empty-state { padding: 80px 40px; text-align: center; background: white; border-radius: 24px; border: 2px dashed var(--border-color); }
.empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
.empty-state h3 { font-size: 18px; font-weight: 800; margin-bottom: 8px; }
.empty-state p { color: var(--text-muted); font-size: 14px; margin-bottom: 24px; }
.btn-primary-mini { padding: 10px 24px; background: var(--text-main); color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; }

.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; opacity: 0; }
.delay-100 { animation-delay: 0.1s; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 800px) { .header-section { flex-direction: column; align-items: flex-start; gap: 20px; } .nodes-grid { grid-template-columns: 1fr; } }
</style>
