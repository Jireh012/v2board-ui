<template>
  <div class="server-status-page">
    <h1 class="page-title">节点状态</h1>
    <p class="hint">查看当前可用节点的在线状态，便于选择稳定节点使用。</p>

    <div class="toolbar">
      <button class="btn-refresh" type="button" :disabled="loading" @click="load">
        {{ loading ? '加载中...' : '刷新' }}
      </button>
    </div>

    <div v-if="loading && !servers.length" class="loading">加载中...</div>

    <div v-else-if="servers.length" class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th style="width: 6%">#</th>
            <th style="width: 30%">节点名称</th>
            <th style="width: 14%">类型</th>
            <th style="width: 12%">倍率</th>
            <th style="width: 22%">地址</th>
            <th style="width: 16%">状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(s, index) in servers" :key="s.cache_key || `${s.type}-${s.id}-${index}`">
            <td>{{ index + 1 }}</td>
            <td class="node-name">{{ s.name || '-' }}</td>
            <td>{{ typeLabel(s.type) }}</td>
            <td class="node-rate">{{ rateDisplay(s.rate) }}</td>
            <td class="node-addr">{{ nodeAddr(s) }}</td>
            <td>
              <span class="status-chip">
                <span class="status-dot" :class="s.is_online ? 'status-online' : 'status-offline'" />
                {{ s.is_online ? '在线' : '离线' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-else class="empty">暂无可用节点。请先购买订阅或联系管理员。</p>
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
    console.error('Failed to fetch servers', e)
  } finally {
    loading.value = false
  }
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    shadowsocks: 'Shadowsocks',
    vmess: 'VMess',
    trojan: 'Trojan',
    vless: 'VLESS',
    hysteria: 'Hysteria',
    v2node: 'V2Node',
    anytls: 'AnyTLS',
    tuic: 'Tuic'
  }
  return map[type] || type || '-'
}

function nodeAddr(s: ServerNode): string {
  const host = s.host
  const port = s.port
  if (!host) return '-'
  if (port != null && port !== '') return `${host}:${port}`
  return host
}

function rateDisplay(rate: string | undefined): string {
  if (rate == null || rate === '') return '1'
  const n = parseFloat(rate)
  if (Number.isNaN(n)) return rate
  return n === 1 ? '1' : String(n)
}

onMounted(load)
</script>

<style scoped>
.server-status-page {
  width: 100%;
  padding: 24px 16px;
  background: #f8fafd;
  box-sizing: border-box;
}

.page-title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.hint {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 16px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.btn-refresh {
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #374151;
  font-size: 13px;
  cursor: pointer;
}

.btn-refresh:hover:not(:disabled) {
  background: #f3f4f6;
}

.btn-refresh:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading {
  font-size: 14px;
  color: #6b7280;
  padding: 24px 0;
}

.table-wrapper {
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table th {
  text-align: left;
  padding: 12px 14px;
  background: #f9fafb;
  color: #6b7280;
  font-weight: 500;
  border-bottom: 1px solid #e5e7eb;
}

.table td {
  padding: 12px 14px;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
}

.table tbody tr:last-child td {
  border-bottom: none;
}

.table tbody tr:hover {
  background: #f9fafb;
}

.node-name {
  font-weight: 500;
  color: #111827;
}

.node-rate {
  font-size: 14px;
  color: #374151;
}

.node-addr {
  font-family: ui-monospace, monospace;
  font-size: 13px;
  color: #6b7280;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.status-online {
  background: #10b981;
}

.status-dot.status-offline {
  background: #9ca3af;
}

.empty {
  font-size: 14px;
  color: #6b7280;
  text-align: center;
  padding: 40px 0;
}
</style>
