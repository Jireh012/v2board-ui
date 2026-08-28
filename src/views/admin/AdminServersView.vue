<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">节点管理</h1>
        <p class="page-subtitle">统一管理各协议节点，查看运行状态、可见性与倍率。</p>
      </div>
      <div class="header-actions">
        <button class="btn" :disabled="loading" @click="load" title="刷新">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :class="{ spinning: loading }"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
          刷新
        </button>
        <button class="btn primary" @click="showTypePicker = true">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          添加节点
        </button>
      </div>
    </div>

    <!-- 选择节点类型 -->
    <Teleport to="body">
      <div v-if="showTypePicker" class="modal-mask type-picker-mask" @click.self="showTypePicker = false">
        <div class="type-picker">
          <div class="type-picker-header">
            <div>
              <h2>选择节点类型</h2>
              <p>请选择要添加的协议，随后进入节点配置。</p>
            </div>
            <button type="button" class="modal-close" @click="showTypePicker = false">&times;</button>
          </div>
          <div class="type-picker-grid">
            <button
              v-for="t in serverTypes"
              :key="t.value"
              type="button"
              class="type-card"
              :class="'type-' + t.value"
              @click="pickTypeAndAdd(t.value as ServerType)"
            >
              <span class="type-badge">{{ t.short || t.value }}</span>
              <span class="type-name">{{ t.label }}</span>
              <span class="type-desc">{{ t.desc || '点击继续配置' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <div class="stat-row" v-if="!loading && rows.length">
      <div class="stat-card">
        <span class="stat-label">节点总数</span>
        <strong class="stat-value">{{ rows.length }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">运行正常</span>
        <strong class="stat-value status-ok">{{ statusCount(2) }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">上报异常 / 空闲</span>
        <strong class="stat-value status-warn">{{ statusCount(1) }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">未运行</span>
        <strong class="stat-value status-down">{{ statusCount(0) }}</strong>
      </div>
    </div>

    <div v-if="!loading && rows.length" class="status-legend" title="与原版 V2Board 节点状态灯一致（300 秒阈值）">
      <span class="legend-item"><i class="status-dot s2"></i>运行正常</span>
      <span class="legend-item"><i class="status-dot s1"></i>无人使用或服务端上报异常</span>
      <span class="legend-item"><i class="status-dot s0"></i>未运行</span>
    </div>

    <div class="filters">
      <button
        v-for="ft in filterTabs"
        :key="ft.value"
        class="filter-btn"
        :class="{ active: filterType === ft.value }"
        @click="filterType = ft.value"
      >
        <span>{{ ft.label }}</span>
        <em>{{ ft.count }}</em>
      </button>
    </div>

    <div class="panel">
      <div v-if="loading" class="state-box">
        <div class="spinner"></div>
        <p>加载节点…</p>
      </div>
      <div v-else-if="!filtered.length" class="state-box empty">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><path d="M9 9h6v6H9z"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>
        </div>
        <h3>{{ filterType === 'all' ? '暂无节点' : '该类型暂无节点' }}</h3>
        <p>选择协议类型后添加节点，即可在此统一管理。</p>
        <button class="btn primary" @click="showTypePicker = true">添加第一个节点</button>
      </div>
      <div v-else class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th style="width:56px">#</th>
              <th style="width:72px">状态</th>
              <th>节点名称</th>
              <th>类型</th>
              <th>地址</th>
              <th>端口</th>
              <th>倍率</th>
              <th>在线</th>
              <th>显示</th>
              <th style="width:148px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in filtered" :key="`${s.type}-${s.id}`">
              <td class="id-cell">{{ s.id }}</td>
              <td>
                <span
                  class="status-cell"
                  :title="statusTitle(s)"
                >
                  <i class="status-dot" :class="'s' + statusCode(s)"></i>
                  <span class="status-text">{{ statusLabel(s) }}</span>
                </span>
              </td>
              <td>
                <div class="name-cell">
                  <span class="name">{{ s.name }}</span>
                  <span v-if="s.type === 'v2node' && s.protocol" class="meta">{{ v2nodeMeta(s) }}</span>
                </div>
              </td>
              <td>
                <span class="tag" :class="'tag-' + s.type">{{ typeLabel(s.type) }}</span>
              </td>
              <td>
                <code class="host-chip" :title="String(s.host)">{{ s.host }}</code>
              </td>
              <td class="num-cell">{{ s.port }}</td>
              <td>
                <span class="rate-badge">{{ s.rate }}x</span>
              </td>
              <td class="num-cell">{{ Number(s.online) || 0 }}</td>
              <td>
                <button
                  class="pill"
                  :class="s.show === 1 ? 'pill-on' : 'pill-off'"
                  :title="s.show === 1 ? '点击隐藏' : '点击显示'"
                  @click="doToggle(s)"
                >
                  <i class="dot"></i>
                  {{ s.show === 1 ? '显示' : '隐藏' }}
                </button>
              </td>
              <td>
                <div class="actions-cell">
                  <button class="icon-btn edit" title="编辑" @click="openEdit(s)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                  </button>
                  <button class="icon-btn copy" title="复制" @click="doCopy(s)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16V4a2 2 0 0 1 2-2h12"/></svg>
                  </button>
                  <button class="icon-btn danger" title="删除" @click="doDrop(s)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-mask" @click.self="showModal = false">
        <div class="modal modal-wide">
          <div class="modal-header">
            <div class="modal-heading">
              <div class="modal-title-row">
                <h2>{{ editId ? '编辑节点' : '添加节点' }}</h2>
                <span class="type-chip" :class="`tag-${currentType}`">{{ typeLabel(currentType) }}</span>
              </div>
              <p class="modal-sub">{{ editId ? `正在编辑 #${editId}` : '填写基础信息与协议参数后保存' }}</p>
            </div>
            <button class="modal-close" type="button" @click="showModal = false" aria-label="关闭">&times;</button>
          </div>
          <form class="modal-form" @submit.prevent="doSave">
            <div class="modal-body">
            <section class="form-section">
              <div class="section-head">
                <h3>基础信息</h3>
                <p>名称、地址与倍率等通用字段</p>
              </div>
              <div class="form-grid">
                <div class="form-row">
                  <label>节点名称 <span class="req">*</span></label>
                  <input v-model="form.name" class="input" placeholder="例如：US_California" required />
                </div>
                <div class="form-row">
                  <label>节点地址 <span class="req">*</span></label>
                  <input v-model="form.host" class="input" placeholder="域名或 IP" required />
                </div>
                <div class="form-row">
                  <label>连接端口 <span class="req">*</span></label>
                  <input v-model="form.port" class="input" placeholder="443" required />
                </div>
                <div class="form-row" v-if="hasField('server_port')">
                  <label>服务端口</label>
                  <input v-model="form.server_port" class="input" type="number" placeholder="可选" />
                </div>
                <div class="form-row">
                  <label>倍率 <span class="req">*</span></label>
                  <input v-model="form.rate" class="input" type="number" step="0.1" placeholder="1" required />
                </div>
              </div>
            </section>

            <section class="form-section">
              <div class="section-head">
                <h3>权限与路由</h3>
                <p>勾选可见权限组，可选绑定路由规则</p>
              </div>
              <div class="form-grid">
                <div class="form-row full-width">
                  <label>权限组 <span class="req">*</span></label>
                  <div v-if="groupsLoading" class="check-hint">权限组加载中…</div>
                  <div v-else-if="!groups.length" class="check-hint warn">暂无权限组，请先在「权限组管理」中创建。</div>
                  <div v-else class="check-grid">
                    <label
                      v-for="g in groups"
                      :key="g.id"
                      class="check-item"
                      :class="{ selected: selectedGroupIds.includes(g.id) }"
                    >
                      <input v-model="selectedGroupIds" type="checkbox" :value="g.id" />
                      <span class="check-name">{{ g.name }}</span>
                      <span class="check-id">#{{ g.id }}</span>
                    </label>
                  </div>
                </div>
                <div class="form-row full-width">
                  <label>路由</label>
                  <div v-if="routesLoading" class="check-hint">路由加载中…</div>
                  <div v-else-if="!routes.length" class="check-hint warn">暂无路由规则，请先在「路由管理」中创建。</div>
                  <div v-else class="check-grid">
                    <label
                      v-for="r in routes"
                      :key="r.id"
                      class="check-item"
                      :class="{ selected: selectedRouteIds.includes(r.id) }"
                    >
                      <input v-model="selectedRouteIds" type="checkbox" :value="r.id" />
                      <span class="check-name">{{ r.remarks || `路由 #${r.id}` }}</span>
                      <span class="check-meta">{{ r.action }}</span>
                      <span class="check-id">#{{ r.id }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </section>

            <section class="form-section">
              <div class="section-head">
                <h3>展示与关联</h3>
                <p>标签、父节点与前台显示控制</p>
              </div>
              <div class="form-grid">
                <div class="form-row">
                  <label>标签</label>
                  <input v-model="tagsText" class="input" placeholder="逗号分隔，如 premium,cn" />
                </div>
                <div class="form-row">
                  <label>父节点</label>
                  <select v-model="parentIdSelect" class="input">
                    <option value="">无</option>
                    <option
                      v-for="n in parentNodeOptions"
                      :key="`${n.type}-${n.id}`"
                      :value="String(n.id)"
                    >
                      {{ n.name }}（{{ typeLabel(n.type) }} #{{ n.id }}）
                    </option>
                  </select>
                </div>
                <div class="form-row">
                  <label>排序</label>
                  <input v-model.number="form.sort" class="input" type="number" placeholder="0" />
                </div>
                <div class="form-row">
                  <label>显示</label>
                  <select v-model.number="form.show" class="input">
                    <option :value="1">显示</option>
                    <option :value="0">隐藏</option>
                  </select>
                </div>
              </div>
            </section>

            <!-- V2node 特有字段（对齐 wyx2685/v2board） -->
            <template v-if="currentType === 'v2node'">
              <section class="form-section">
              <div class="section-head">
                <h3>协议配置</h3>
                <p>{{ showV2Network ? 'V2Node 协议、传输层与安全性' : 'V2Node 协议与安全性（QUIC 无需传输层）' }}</p>
              </div>
              <div class="form-grid">
                <div class="form-row">
                  <label>节点协议 <span class="req">*</span></label>
                  <select v-model="form.protocol" class="input" @change="onProtocolChange">
                    <option v-for="p in protocols" :key="p" :value="p">{{ p }}</option>
                  </select>
                </div>
                <div class="form-row" v-if="showV2Network">
                  <label>传输层 <span class="req">*</span></label>
                  <select v-model="form.network" class="input">
                    <option v-for="n in networks" :key="n" :value="n">{{ n }}</option>
                  </select>
                </div>
                <div class="form-row">
                  <label>
                    安全性
                    <button v-if="Number(form.tls) > 0" type="button" class="link-btn" @click="openTlsPanel">说明/配置</button>
                  </label>
                  <select v-model.number="form.tls" class="input" :disabled="tlsForced" @change="onTlsModeChange">
                    <option :value="0">None</option>
                    <option :value="1">TLS</option>
                    <option :value="2">Reality</option>
                  </select>
                  <p v-if="tlsForced" class="hint">当前协议强制开启 TLS。</p>
                </div>
                <div class="form-row">
                  <label>服务地址 / 监听 IP</label>
                  <input v-model="form.listen_ip" class="input" placeholder="0.0.0.0" />
                </div>
                <div class="form-row" v-if="showV2Flow">
                  <label>Flow</label>
                  <select v-model="form.flow" class="input">
                    <option value="">无</option>
                    <option value="xtls-rprx-vision">xtls-rprx-vision</option>
                  </select>
                </div>
                <div class="form-row" v-if="form.protocol === 'shadowsocks'">
                  <label>加密方式</label>
                  <select v-model="form.cipher" class="input">
                    <option v-for="c in ciphers" :key="c" :value="c">{{ c }}</option>
                  </select>
                </div>
                <div class="form-row" v-if="showV2Obfs">
                  <label>混淆方式 obfs</label>
                  <input v-model="form.obfs" class="input" placeholder="如 salamander" />
                </div>
                <div class="form-row" v-if="showV2Obfs">
                  <label>混淆密码 obfs_password</label>
                  <input v-model="form.obfs_password" class="input" />
                </div>
                <div class="form-row" v-if="showV2Bandwidth">
                  <label>上行带宽 Mbps</label>
                  <input v-model.number="form.up_mbps" class="input" type="number" min="0" />
                </div>
                <div class="form-row" v-if="showV2Bandwidth">
                  <label>下行带宽 Mbps</label>
                  <input v-model.number="form.down_mbps" class="input" type="number" min="0" />
                </div>
                <div class="form-row full-width">
                  <label>信任的 XFF 头部</label>
                  <input v-model="xffText" class="input" placeholder="常见头部: X-Forwarded-For，逗号分隔" />
                </div>
                <div class="form-row full-width" v-if="showV2Network">
                  <label>传输层设置 (JSON)</label>
                  <textarea v-model="networkSettingsText" class="input textarea" rows="6"
                    :placeholder="networkSettingsPlaceholder" />
                </div>
                <div class="form-row full-width" v-if="displayInstallCommand">
                  <label>一键安装命令</label>
                  <textarea class="input textarea install-cmd" rows="3" readonly :value="displayInstallCommand" />
                </div>
              </div>
              </section>
            </template>

            <!-- Vmess 特有字段 -->
            <template v-if="currentType === 'vmess'">
              <section class="form-section">
              <div class="section-head">
                <h3>VMess 配置</h3>
                <p>传输层与安全性</p>
              </div>
              <div class="form-grid">
                <div class="form-row">
                  <label>传输层</label>
                  <select v-model="form.network" class="input">
                    <option v-for="n in networks" :key="n" :value="n">{{ n }}</option>
                  </select>
                </div>
                <div class="form-row">
                  <label>
                    安全性
                    <button v-if="Number(form.tls) > 0" type="button" class="link-btn" @click="openTlsPanel">说明/配置</button>
                  </label>
                  <select v-model.number="form.tls" class="input" @change="onTlsModeChange">
                    <option :value="0">None</option>
                    <option :value="1">TLS</option>
                  </select>
                </div>
              </div>
              </section>
            </template>

            <!-- Vless 特有字段 -->
            <template v-if="currentType === 'vless'">
              <section class="form-section">
              <div class="section-head">
                <h3>VLESS 配置</h3>
                <p>传输层、安全性与 Flow</p>
              </div>
              <div class="form-grid">
                <div class="form-row">
                  <label>传输层 <span class="req">*</span></label>
                  <select v-model="form.network" class="input">
                    <option v-for="n in networks" :key="n" :value="n">{{ n }}</option>
                  </select>
                </div>
                <div class="form-row">
                  <label>
                    安全性 <span class="req">*</span>
                    <button v-if="Number(form.tls) > 0" type="button" class="link-btn" @click="openTlsPanel">说明/配置</button>
                  </label>
                  <select v-model.number="form.tls" class="input" @change="onTlsModeChange">
                    <option :value="0">None</option>
                    <option :value="1">TLS</option>
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
              </section>
            </template>

            <!-- Trojan 特有字段 -->
            <template v-if="currentType === 'trojan'">
              <section class="form-section">
              <div class="section-head">
                <h3>Trojan 配置</h3>
                <p>TLS 安全性参数</p>
              </div>
              <div class="form-grid">
                <div class="form-row full-width">
                  <label>
                    安全性 / TLS
                    <button type="button" class="link-btn" @click="openTlsPanel">说明/配置</button>
                  </label>
                  <div class="tls-summary">
                    <span>SNI：{{ tlsForm.server_name || form.server_name || '未设置' }}</span>
                    <span>·</span>
                    <span>{{ Number(tlsForm.allow_insecure || form.allow_insecure) === 1 ? '允许不安全' : '校验证书' }}</span>
                  </div>
                </div>
              </div>
              </section>
            </template>

            <!-- Shadowsocks 特有字段 -->
            <template v-if="currentType === 'shadowsocks'">
              <section class="form-section">
              <div class="section-head">
                <h3>Shadowsocks 配置</h3>
                <p>加密与混淆</p>
              </div>
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
              </section>
            </template>

            <!-- Hysteria 特有字段 -->
            <template v-if="currentType === 'hysteria'">
              <section class="form-section">
              <div class="section-head">
                <h3>Hysteria 配置</h3>
                <p>版本、带宽与 TLS</p>
              </div>
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
                <div class="form-row full-width">
                  <label>
                    安全性 / TLS
                    <button type="button" class="link-btn" @click="openTlsPanel">说明/配置</button>
                  </label>
                  <div class="tls-summary">
                    <span>SNI：{{ tlsForm.server_name || form.server_name || '未设置' }}</span>
                    <span>·</span>
                    <span>{{ Number(tlsForm.allow_insecure || form.insecure) === 1 ? '允许不安全' : '校验证书' }}</span>
                  </div>
                </div>
              </div>
              </section>
            </template>

            <!-- Tuic 特有字段 -->
            <template v-if="currentType === 'tuic'">
              <section class="form-section">
              <div class="section-head">
                <h3>TUIC 配置</h3>
                <p>拥塞控制与 TLS</p>
              </div>
              <div class="form-grid">
                <div class="form-row">
                  <label>拥塞控制</label>
                  <input v-model="form.congestion_control" class="input" placeholder="bbr" />
                </div>
                <div class="form-row full-width">
                  <label>
                    安全性 / TLS
                    <button type="button" class="link-btn" @click="openTlsPanel">说明/配置</button>
                  </label>
                  <div class="tls-summary">
                    <span>SNI：{{ tlsForm.server_name || form.server_name || '未设置' }}</span>
                    <span>·</span>
                    <span>{{ Number(tlsForm.allow_insecure || form.insecure) === 1 ? '允许不安全' : '校验证书' }}</span>
                  </div>
                </div>
              </div>
              </section>
            </template>

            <!-- AnyTLS 特有字段 -->
            <template v-if="currentType === 'anytls'">
              <section class="form-section">
              <div class="section-head">
                <h3>AnyTLS 配置</h3>
                <p>TLS 安全性参数</p>
              </div>
              <div class="form-grid">
                <div class="form-row full-width">
                  <label>
                    安全性 / TLS
                    <button type="button" class="link-btn" @click="openTlsPanel">说明/配置</button>
                  </label>
                  <div class="tls-summary">
                    <span>SNI：{{ tlsForm.server_name || form.server_name || '未设置' }}</span>
                    <span>·</span>
                    <span>{{ Number(tlsForm.allow_insecure || form.insecure) === 1 ? '允许不安全' : '校验证书' }}</span>
                  </div>
                </div>
              </div>
              </section>
            </template>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn" @click="showModal = false">取消</button>
              <button type="submit" class="btn primary" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
            </div>
          </form>
        </div>
      </div>

      <!-- 可视化 TLS / Reality 配置（对齐原版「编辑安全性配置」） -->
      <div v-if="showTlsPanel" class="drawer-mask" @click.self="closeTlsPanel">
        <aside class="tls-drawer">
          <div class="drawer-header">
            <div>
              <h2>编辑安全性配置</h2>
              <p class="modal-sub">{{ tlsPanelSubtitle }}</p>
            </div>
            <button type="button" class="modal-close" @click="closeTlsPanel">&times;</button>
          </div>
          <div class="drawer-body">
            <div class="form-row">
              <label>Server Name (SNI)</label>
              <input v-model="tlsForm.server_name" class="input" placeholder="证书域名 / SNI" />
              <p v-if="tlsUiKind === 'v2node' && (tlsForm.cert_mode === 'dns' || tlsForm.cert_mode === 'http' || tlsForm.cert_mode === 'self')" class="hint">
                须与节点实际证书域名一致。Host 可为 CDN 地址；SNI 不要填成 CDN 域名，否则校验证书会失败。修改 SNI 后节点会按新域名重签（需 DNS/HTTP 校验可用）。
              </p>
              <p v-else-if="tlsUiKind === 'v2node' && tlsForm.cert_mode === 'remote'" class="hint">
                面板生成自签证书并下发到节点。已有 PIN 后不会因修改 SNI 自动换证。
              </p>
            </div>

            <template v-if="tlsUiKind === 'v2node' && Number(form.tls) === 1">
              <div class="form-row">
                <label>证书模式 Cert Mode</label>
                <select v-model="tlsForm.cert_mode" class="input">
                  <option value="">不处理</option>
                  <option value="self">自签 / 本地证书</option>
                  <option value="http">HTTP 申请</option>
                  <option value="dns">DNS 申请</option>
                  <option value="remote">自签名(面板下发)</option>
                </select>
              </div>
              <div class="form-row" v-if="tlsForm.cert_mode === 'dns'">
                <label>
                  DNS 解析提供商 Provider
                  <a class="link-btn" href="https://github.com/wyx2685/v2node" target="_blank" rel="noreferrer">填写参考</a>
                </label>
                <input v-model="tlsForm.provider" class="input" placeholder="cloudflare" />
              </div>
              <div class="form-row" v-if="tlsForm.cert_mode === 'dns'">
                <label>DNS env</label>
                <input v-model="tlsForm.dns_env" class="input" placeholder="CF_DNS_API_TOKEN=xxxxx" />
              </div>
              <div class="form-row" v-if="tlsForm.cert_mode === 'remote'">
                <label>证书指纹 PIN (pcs)</label>
                <input :value="tlsForm.pinned_peer_cert_sha256" class="input" readonly placeholder="保存后由面板生成" />
              </div>
              <div class="form-row">
                <label>证书公钥文件地址 Cert File</label>
                <input v-model="tlsForm.cert_file" class="input" placeholder="留空在 /etc/v2node/ 目录自动生成" />
              </div>
              <div class="form-row">
                <label>证书私钥文件地址 Key File</label>
                <input v-model="tlsForm.key_file" class="input" placeholder="留空在 /etc/v2node/ 目录自动生成" />
              </div>
            </template>

            <template v-if="supportsRealityPanel && Number(form.tls) === 2">
              <div class="form-row" v-if="tlsUiKind === 'v2node'">
                <label>Dest（回落目标）</label>
                <input v-model="tlsForm.dest" class="input" placeholder="如 www.microsoft.com:443" />
              </div>
              <div class="form-row">
                <label>Reality Server Port</label>
                <input v-model="tlsForm.server_port" class="input" placeholder="443" />
              </div>
              <div class="form-row">
                <label>Public Key</label>
                <input v-model="tlsForm.public_key" class="input" placeholder="留空保存时由服务端自动生成" />
              </div>
              <div class="form-row">
                <label>Private Key</label>
                <input v-model="tlsForm.private_key" class="input" placeholder="留空保存时由服务端自动生成" />
              </div>
              <div class="form-row">
                <label>Short ID</label>
                <input v-model="tlsForm.short_id" class="input" placeholder="留空自动生成" />
              </div>
            </template>

            <div class="form-row" v-if="supportsFingerprint">
              <label>FingerPrint</label>
              <select v-model="tlsForm.fingerprint" class="input">
                <option v-for="fp in fingerprints" :key="fp" :value="fp">{{ fp }}</option>
              </select>
            </div>

            <div class="toggle-row" v-if="tlsUiKind === 'v2node'">
              <div>
                <strong>Reject unknown SNI</strong>
                <p>拒绝未知 SNI 握手</p>
              </div>
              <button type="button" class="switch" :class="{ on: tlsForm.reject_unknown_sni === '1' }"
                @click="tlsForm.reject_unknown_sni = tlsForm.reject_unknown_sni === '1' ? '0' : '1'" />
            </div>
            <div class="toggle-row">
              <div>
                <strong>Allow Insecure</strong>
                <p>客户端允许跳过证书校验</p>
              </div>
              <button type="button" class="switch" :class="{ on: tlsForm.allow_insecure === '1' }"
                @click="tlsForm.allow_insecure = tlsForm.allow_insecure === '1' ? '0' : '1'" />
            </div>

            <template v-if="supportsEchPanel">
              <div class="form-row">
                <label>ECH (Encrypted Client Hello)</label>
                <select v-model="tlsForm.ech" class="input">
                  <option value="">关闭</option>
                  <option value="cloudflare">Cloudflare</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div v-if="tlsForm.ech === 'cloudflare'" class="info-box ok">
                Cloudflare 托管 ECH，密钥由 Cloudflare 自动管理，客户端从 DNS 自动获取配置，服务端无需配置。
              </div>
              <template v-if="tlsForm.ech === 'custom'">
                <div class="form-row">
                  <label>ECH Server Name（外层伪装 SNI）</label>
                  <input v-model="tlsForm.ech_server_name" class="input" placeholder="必填，否则保存时会清空 ECH" />
                </div>
                <div class="form-row">
                  <label>ECH Key</label>
                  <textarea v-model="tlsForm.ech_key" class="input textarea" rows="3" placeholder="留空由服务端自动生成" />
                </div>
                <div class="form-row">
                  <label>ECH Config</label>
                  <textarea v-model="tlsForm.ech_config" class="input textarea" rows="3" placeholder="留空由服务端自动生成" />
                </div>
              </template>
            </template>
          </div>
          <div class="drawer-footer">
            <button type="button" class="btn primary" @click="closeTlsPanel">完成</button>
          </div>
        </aside>
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
import { fetchGroups, type ServerGroup } from '../../api/admin/group'
import { fetchRoutes, type ServerRoute } from '../../api/admin/route'

const serverTypes = [
  { value: 'v2node', label: 'V2Node (通用)', short: 'V2N', desc: '多协议统一节点' },
  { value: 'vmess', label: 'VMess', short: 'VM', desc: '经典 VMess 协议' },
  { value: 'vless', label: 'VLESS', short: 'VL', desc: '支持 Reality / Flow' },
  { value: 'trojan', label: 'Trojan', short: 'TJ', desc: 'TLS 伪装传输' },
  { value: 'shadowsocks', label: 'Shadowsocks', short: 'SS', desc: '轻量加密代理' },
  { value: 'hysteria', label: 'Hysteria', short: 'HY', desc: 'UDP 抗丢包协议' },
  { value: 'tuic', label: 'TUIC', short: 'TU', desc: '基于 QUIC' },
  { value: 'anytls', label: 'AnyTLS', short: 'AT', desc: 'AnyTLS 协议' }
]

const protocols = ['shadowsocks', 'vmess', 'vless', 'trojan', 'tuic', 'hysteria2', 'anytls']
const networks = ['tcp', 'ws', 'grpc', 'http', 'httpupgrade', 'xhttp']
const ciphers = ['aes-128-gcm', 'aes-256-gcm', 'chacha20-ietf-poly1305', '2022-blake3-aes-128-gcm', '2022-blake3-aes-256-gcm']
const fingerprints = ['chrome', 'firefox', 'safari', 'ios', 'android', 'edge', '360', 'qq', 'random']
const TLS_FORCE_PROTOCOLS = new Set(['hysteria2', 'trojan', 'tuic'])
/** HY2 / TUIC 走 QUIC，不使用 VMess 系 tcp/ws/grpc 传输层 */
const V2_QUIC_PROTOCOLS = new Set(['hysteria2', 'tuic'])

type TlsForm = {
  server_name: string
  cert_mode: string
  provider: string
  dns_env: string
  cert_file: string
  key_file: string
  fingerprint: string
  reject_unknown_sni: string
  allow_insecure: string
  ech: string
  ech_server_name: string
  ech_key: string
  ech_config: string
  dest: string
  server_port: string
  public_key: string
  private_key: string
  short_id: string
  pinned_peer_cert_sha256: string
  tls_cert: string
  tls_key: string
}

function emptyTlsForm(): TlsForm {
  return {
    server_name: '',
    cert_mode: '',
    provider: '',
    dns_env: '',
    cert_file: '',
    key_file: '',
    fingerprint: 'chrome',
    reject_unknown_sni: '0',
    allow_insecure: '0',
    ech: '',
    ech_server_name: '',
    ech_key: '',
    ech_config: '',
    dest: '',
    server_port: '443',
    public_key: '',
    private_key: '',
    short_id: '',
    pinned_peer_cert_sha256: '',
    tls_cert: '',
    tls_key: ''
  }
}

const rows = ref<ServerNode[]>([])
const loading = ref(true)
const filterType = ref('all')
const addType = ref<ServerType>('v2node')
const showTypePicker = ref(false)
const showModal = ref(false)
const showTlsPanel = ref(false)
const saving = ref(false)
const editId = ref<number | null>(null)
const currentType = ref<ServerType>('v2node')
const form = ref<Record<string, any>>({})
const groups = ref<ServerGroup[]>([])
const groupsLoading = ref(false)
const selectedGroupIds = ref<number[]>([])
const routes = ref<ServerRoute[]>([])
const routesLoading = ref(false)
const selectedRouteIds = ref<number[]>([])
const tagsText = ref('')
const xffText = ref('')
const tlsForm = ref<TlsForm>(emptyTlsForm())
const networkSettingsText = ref('')

/**
 * Fill empty --api-host when config URLs are blank.
 * Prefer API origin: Vite UI (5173) is not reachable by v2node — map to :8080 in local dev.
 */
function resolveInstallApiHost(): string {
  if (typeof window === 'undefined') return ''
  const { protocol, hostname, port } = window.location
  // Common Vite ports → Spring Boot default in this monorepo
  if (port === '5173' || port === '5174' || port === '4173') {
    return `${protocol}//${hostname}:8080`
  }
  return window.location.origin
}

const displayInstallCommand = computed(() => {
  const raw = String(form.value.install_command || '')
  if (!raw) return ''
  const host = resolveInstallApiHost()
  if (!host) return raw
  const quoted = "'" + host.replace(/'/g, "'\\''") + "'"
  return raw
    .replace(/--api-host\s+''/g, `--api-host ${quoted}`)
    .replace(/--api-host\s+""/g, `--api-host ${quoted}`)
    // Already filled with Vite origin by mistake — rewrite to API port
    .replace(
      /--api-host\s+'https?:\/\/[^']+:517[34]'/g,
      `--api-host ${quoted}`
    )
    .replace(
      /--api-host\s+'https?:\/\/[^']+:4173'/g,
      `--api-host ${quoted}`
    )
})

const networkSettingsPlaceholder = computed(() => {
  const n = form.value.network || 'tcp'
  if (n === 'xhttp') {
    return '{"path":"/","host":"xtls.github.io","mode":"auto","extra":{}}'
  }
  if (n === 'ws') return '{"path":"/","headers":{"Host":""}}'
  if (n === 'grpc') return '{"serviceName":""}'
  return '{}'
})

const tlsForced = computed(() => TLS_FORCE_PROTOCOLS.has(String(form.value.protocol || '')))
const showV2Flow = computed(() => ['vless', 'vmess'].includes(String(form.value.protocol || '')))
const showV2Obfs = computed(() => ['hysteria2', 'shadowsocks'].includes(String(form.value.protocol || '')))
const showV2Bandwidth = computed(() => V2_QUIC_PROTOCOLS.has(String(form.value.protocol || '')))
const showV2Network = computed(() => !V2_QUIC_PROTOCOLS.has(String(form.value.protocol || '')))

/** TLS UI 形态：对齐各协议存储差异 */
const tlsUiKind = computed(() => {
  switch (currentType.value) {
    case 'v2node': return 'v2node'
    case 'vless': return 'vless'
    case 'vmess': return 'vmess'
    case 'trojan': return 'flat-allow'
    case 'hysteria':
    case 'tuic':
    case 'anytls': return 'flat-insecure'
    default: return 'none'
  }
})
const supportsRealityPanel = computed(() => tlsUiKind.value === 'v2node' || tlsUiKind.value === 'vless')
const supportsFingerprint = computed(() => ['v2node', 'vless', 'vmess'].includes(tlsUiKind.value))
const supportsEchPanel = computed(() => tlsUiKind.value === 'v2node' || tlsUiKind.value === 'vless')
const tlsPanelSubtitle = computed(() => {
  if (tlsUiKind.value === 'flat-allow' || tlsUiKind.value === 'flat-insecure') {
    return `${typeLabel(currentType.value)} · 证书域名 / Allow Insecure`
  }
  if (Number(form.value.tls) === 2) return `${typeLabel(currentType.value)} · Reality`
  return `${typeLabel(currentType.value)} · TLS`
})

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

/** 父节点下拉：排除当前编辑节点，按名称排序 */
const parentNodeOptions = computed(() =>
  rows.value
    .filter(s => s.id !== editId.value)
    .slice()
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN'))
)

const parentIdSelect = computed({
  get: () => {
    const id = form.value.parent_id
    return id != null && Number(id) > 0 ? String(id) : ''
  },
  set: (v: string) => {
    form.value.parent_id = v ? Number(v) : null
  }
})

function statusCode(s: ServerNode): 0 | 1 | 2 {
  const v = Number(s.available_status)
  if (v === 1 || v === 2) return v
  return 0
}

function statusLabel(s: ServerNode): string {
  switch (statusCode(s)) {
    case 2: return '正常'
    case 1: return '异常'
    default: return '未运行'
  }
}

function statusTitle(s: ServerNode): string {
  const check = Number(s.last_check_at) || 0
  const push = Number(s.last_push_at) || 0
  const online = Number(s.online) || 0
  const checkText = check > 0 ? new Date(check * 1000).toLocaleString() : '无'
  const pushText = push > 0 ? new Date(push * 1000).toLocaleString() : '无'
  const detail =
    statusCode(s) === 2
      ? '运行正常'
      : statusCode(s) === 1
        ? '无人使用或服务端上报异常'
        : '未运行（节点未在 300 秒内拉取配置）'
  return `${detail}\n在线用户：${online}\n最近检测：${checkText}\n最近上报：${pushText}`
}

function statusCount(code: 0 | 1 | 2) {
  return rows.value.filter((s) => statusCode(s) === code).length
}

function typeLabel(type: string) {
  return serverTypes.find(t => t.value === type)?.label || type
}

function hasField(_field: string) {
  return ['v2node', 'vless', 'hysteria', 'tuic', 'anytls'].includes(currentType.value)
}

async function load() {
  loading.value = true
  try { rows.value = await fetchNodes() } finally { loading.value = false }
}

async function loadGroups() {
  groupsLoading.value = true
  try {
    groups.value = await fetchGroups()
  } catch {
    groups.value = []
  } finally {
    groupsLoading.value = false
  }
}

async function loadRoutes() {
  routesLoading.value = true
  try {
    routes.value = await fetchRoutes()
  } catch {
    routes.value = []
  } finally {
    routesLoading.value = false
  }
}

function normalizeIdList(raw: unknown): number[] {
  if (Array.isArray(raw)) {
    return raw.map(v => Number(v)).filter(n => Number.isFinite(n))
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.map(v => Number(v)).filter(n => Number.isFinite(n))
      }
    } catch { /* ignore */ }
    return raw.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !Number.isNaN(n))
  }
  return []
}

function jsonToText(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') {
    try { return JSON.stringify(JSON.parse(v), null, 2) } catch { return v }
  }
  try { return JSON.stringify(v, null, 2) } catch { return '' }
}

function textToJson(text: string): unknown | undefined {
  const t = text.trim()
  if (!t) return undefined
  return JSON.parse(t)
}

function parseJsonObject(v: unknown): Record<string, unknown> {
  if (v == null || v === '') return {}
  if (typeof v === 'object' && !Array.isArray(v)) return { ...(v as Record<string, unknown>) }
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }
  return {}
}

function flag01(v: unknown, fallback = '0'): string {
  if (v === true || v === 1 || v === '1') return '1'
  if (v === false || v === 0 || v === '0') return '0'
  return fallback
}

function loadTlsForm(raw: unknown) {
  const src = parseJsonObject(raw)
  const next = emptyTlsForm()
  next.server_name = String(src.server_name ?? src.serverName ?? '')
  next.cert_mode = String(src.cert_mode ?? '')
  next.provider = src.provider == null ? '' : String(src.provider)
  next.dns_env = src.dns_env == null ? '' : String(src.dns_env)
  next.cert_file = String(src.cert_file ?? '')
  next.key_file = String(src.key_file ?? '')
  next.fingerprint = String(src.fingerprint || 'chrome')
  next.reject_unknown_sni = flag01(src.reject_unknown_sni)
  next.allow_insecure = flag01(src.allow_insecure ?? src.allowInsecure)
  next.ech = src.ech == null ? '' : String(src.ech)
  next.ech_server_name = String(src.ech_server_name ?? '')
  next.ech_key = String(src.ech_key ?? '')
  next.ech_config = String(src.ech_config ?? '')
  next.dest = String(src.dest ?? '')
  next.server_port = String(src.server_port ?? '443')
  next.public_key = String(src.public_key ?? '')
  next.private_key = String(src.private_key ?? '')
  next.short_id = String(src.short_id ?? '')
  next.pinned_peer_cert_sha256 = String(src.pinned_peer_cert_sha256 ?? '')
  next.tls_cert = String(src.tls_cert ?? '')
  next.tls_key = String(src.tls_key ?? '')
  tlsForm.value = next
}

function loadFlatTlsFromForm() {
  const next = emptyTlsForm()
  next.server_name = String(form.value.server_name || form.value.host || '')
  const insecure = form.value.allow_insecure ?? form.value.insecure ?? 0
  next.allow_insecure = flag01(insecure)
  tlsForm.value = next
}

function buildTlsSettings(): Record<string, unknown> | null {
  if (!Number(form.value.tls)) return null
  const t = tlsForm.value
  const kind = tlsUiKind.value

  if (kind === 'vmess') {
    return {
      serverName: t.server_name || '',
      allowInsecure: Number(t.allow_insecure) === 1 ? 1 : 0
    }
  }

  const out: Record<string, unknown> = {
    server_name: t.server_name || '',
    fingerprint: t.fingerprint || 'chrome',
    allow_insecure: t.allow_insecure || '0'
  }
  if (kind === 'v2node') {
    out.reject_unknown_sni = t.reject_unknown_sni || '0'
    out.ech = t.ech || null
  } else if (kind === 'vless' && t.ech) {
    out.ech = t.ech
  }

  if (kind === 'v2node' && Number(form.value.tls) === 1) {
    out.cert_mode = t.cert_mode || ''
    out.provider = t.cert_mode === 'dns' ? (t.provider || null) : null
    out.dns_env = t.cert_mode === 'dns' ? (t.dns_env || null) : null
    if (t.cert_file) out.cert_file = t.cert_file
    if (t.key_file) out.key_file = t.key_file
    if (t.cert_mode === 'remote') {
      if (t.tls_cert) out.tls_cert = t.tls_cert
      if (t.tls_key) out.tls_key = t.tls_key
      if (t.pinned_peer_cert_sha256) out.pinned_peer_cert_sha256 = t.pinned_peer_cert_sha256
    }
  }
  if (supportsRealityPanel.value && Number(form.value.tls) === 2) {
    if (kind === 'v2node') out.dest = t.dest || ''
    out.server_port = t.server_port || '443'
    if (t.public_key) out.public_key = t.public_key
    if (t.private_key) out.private_key = t.private_key
    if (t.short_id) out.short_id = t.short_id
  }
  if (supportsEchPanel.value && t.ech === 'custom') {
    out.ech_server_name = t.ech_server_name || ''
    if (t.ech_key) out.ech_key = t.ech_key
    if (t.ech_config) out.ech_config = t.ech_config
  }
  return out
}

function applyFlatTlsToForm() {
  form.value.server_name = tlsForm.value.server_name || ''
  const insecure = Number(tlsForm.value.allow_insecure) === 1 ? 1 : 0
  if (tlsUiKind.value === 'flat-allow') {
    form.value.allow_insecure = insecure
  } else if (tlsUiKind.value === 'flat-insecure') {
    form.value.insecure = insecure
  }
}

function onProtocolChange() {
  const p = String(form.value.protocol || '')
  if (TLS_FORCE_PROTOCOLS.has(p) || p === 'anytls') {
    form.value.tls = 1
  }
  if (p === 'shadowsocks' && !form.value.cipher) {
    form.value.cipher = 'aes-128-gcm'
  }
  if (V2_QUIC_PROTOCOLS.has(p)) {
    form.value.network = 'tcp'
    networkSettingsText.value = ''
  }
}

function v2nodeMeta(s: { protocol?: string; network?: string }) {
  const protocol = String(s.protocol || '')
  if (V2_QUIC_PROTOCOLS.has(protocol)) return protocol
  return `${protocol} · ${s.network || 'tcp'}`
}

function openTlsPanel() {
  if (tlsUiKind.value === 'flat-allow' || tlsUiKind.value === 'flat-insecure') {
    loadFlatTlsFromForm()
  } else if (!tlsForm.value.server_name && form.value.host) {
    tlsForm.value.server_name = String(form.value.host)
  }
  showTlsPanel.value = true
}

function closeTlsPanel() {
  if (tlsUiKind.value === 'flat-allow' || tlsUiKind.value === 'flat-insecure') {
    applyFlatTlsToForm()
  }
  showTlsPanel.value = false
}

function onTlsModeChange() {
  if (Number(form.value.tls) > 0) {
    openTlsPanel()
  } else {
    showTlsPanel.value = false
  }
}

function pickTypeAndAdd(type: ServerType) {
  addType.value = type
  showTypePicker.value = false
  openAdd()
}

function openAdd() {
  editId.value = null
  currentType.value = addType.value
  form.value = { name: '', host: '', port: '', rate: '1', show: 0, sort: 0, parent_id: null }
  if (currentType.value === 'v2node') {
    form.value.protocol = 'vless'
    form.value.network = 'tcp'
    form.value.tls = 0
    form.value.listen_ip = '0.0.0.0'
    form.value.server_port = ''
    form.value.up_mbps = 0
    form.value.down_mbps = 0
    form.value.obfs = ''
    form.value.obfs_password = ''
    form.value.flow = ''
  }
  selectedGroupIds.value = []
  selectedRouteIds.value = []
  tagsText.value = ''
  xffText.value = ''
  loadTlsForm(null)
  if (['trojan', 'hysteria', 'tuic', 'anytls'].includes(currentType.value)) {
    loadFlatTlsFromForm()
  }
  networkSettingsText.value = ''
  showTlsPanel.value = false
  void loadGroups()
  void loadRoutes()
  showModal.value = true
}

function openEdit(s: ServerNode) {
  editId.value = s.id
  currentType.value = s.type as ServerType
  form.value = { ...s, parent_id: s.parent_id && Number(s.parent_id) > 0 ? Number(s.parent_id) : null }
  selectedGroupIds.value = normalizeIdList(s.group_id)
  selectedRouteIds.value = normalizeIdList(s.route_id)
  tagsText.value = Array.isArray(s.tags) ? s.tags.join(',') : ''
  const xff = s.trusted_x_forwarded_for
  xffText.value = Array.isArray(xff) ? xff.join(',') : (typeof xff === 'string' ? xff : '')
  const tlsRaw = s.tls_settings ?? s.tlsSettings
  if (['v2node', 'vless', 'vmess'].includes(s.type)) {
    loadTlsForm(tlsRaw)
  } else {
    loadFlatTlsFromForm()
  }
  networkSettingsText.value = jsonToText(s.network_settings ?? s.networkSettings)
  showTlsPanel.value = false
  void loadGroups()
  void loadRoutes()
  showModal.value = true
}

async function doSave() {
  if (!selectedGroupIds.value.length) {
    alert('请至少选择一个权限组')
    return
  }
  if (tlsUiKind.value === 'flat-allow' || tlsUiKind.value === 'flat-insecure') {
    applyFlatTlsToForm()
  }
  saving.value = true
  try {
    const body: Record<string, unknown> = { ...form.value }
    body.group_id = [...selectedGroupIds.value]
    const parentId = form.value.parent_id
    body.parent_id = parentId != null && Number(parentId) > 0 ? Number(parentId) : null
    body.route_id = [...selectedRouteIds.value]
    body.tags = tagsText.value ? tagsText.value.split(',').map(s => s.trim()).filter(Boolean) : []
    if (currentType.value === 'v2node') {
      onProtocolChange()
      body.tls = form.value.tls
      body.tls_settings = buildTlsSettings()
      body.trusted_x_forwarded_for = xffText.value
        ? xffText.value.split(',').map(s => s.trim()).filter(Boolean)
        : []
      if (V2_QUIC_PROTOCOLS.has(String(form.value.protocol || ''))) {
        body.network = 'tcp'
        body.network_settings = null
      } else {
        try {
          if (networkSettingsText.value.trim()) body.network_settings = textToJson(networkSettingsText.value)
          else body.network_settings = null
        } catch {
          alert('传输层 JSON 格式无效')
          return
        }
      }
    } else if (currentType.value === 'vless' || currentType.value === 'vmess') {
      body.tls = form.value.tls
      body.tls_settings = buildTlsSettings()
    } else if (currentType.value === 'trojan') {
      body.server_name = form.value.server_name || ''
      body.allow_insecure = Number(form.value.allow_insecure) === 1 ? 1 : 0
    } else if (currentType.value === 'hysteria' || currentType.value === 'tuic' || currentType.value === 'anytls') {
      body.server_name = form.value.server_name || ''
      body.insecure = Number(form.value.insecure) === 1 ? 1 : 0
    }
    // getNodes runtime fields — not entity columns (openEdit spreads the whole row)
    delete body.type
    delete body.online
    delete body.is_online
    delete body.last_check_at
    delete body.last_push_at
    delete body.available_status
    delete body.install_command
    if (editId.value) body.id = editId.value
    await saveNode(currentType.value, body)
    showModal.value = false
    showTlsPanel.value = false
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

onMounted(() => {
  void load()
  void loadGroups()
  void loadRoutes()
})
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: var(--text-main, #0f172a);
  letter-spacing: -0.02em;
}

.page-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--text-muted, #64748b);
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

.type-picker-mask {
  align-items: center;
  padding: 24px 16px;
}

.type-picker {
  width: min(720px, 96vw);
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
  overflow: hidden;
  animation: pickerIn 0.18s ease;
}

@keyframes pickerIn {
  from { transform: translateY(8px) scale(0.98); opacity: 0.6; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

.type-picker-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 22px 16px;
  border-bottom: 1px solid #f1f5f9;
  background: linear-gradient(180deg, #ffffff, #f8fafc);
}

.type-picker-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: var(--text-main, #0f172a);
}

.type-picker-header p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #94a3b8;
}

.type-picker-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 18px 20px 22px;
}

.type-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.type-card:hover {
  border-color: #bfdbfe;
  background: #f8fbff;
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.08);
}

.type-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.type-name {
  font-size: 14px;
  font-weight: 800;
  color: var(--text-main, #0f172a);
}

.type-desc {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
}

.type-v2node .type-badge { background: #f5f3ff; color: #6d28d9; }
.type-vmess .type-badge { background: #eff6ff; color: #2563eb; }
.type-vless .type-badge { background: #ecfdf5; color: #059669; }
.type-trojan .type-badge { background: #fffbeb; color: #d97706; }
.type-shadowsocks .type-badge { background: #fdf4ff; color: #a21caf; }
.type-hysteria .type-badge { background: #fef2f2; color: #dc2626; }
.type-tuic .type-badge { background: #ecfeff; color: #0891b2; }
.type-anytls .type-badge { background: #f7fee7; color: #65a30d; }

@media (max-width: 640px) {
  .type-picker-grid { grid-template-columns: 1fr; }
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
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.04));
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-label {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-main, #0f172a);
  letter-spacing: -0.03em;
}

.stat-value.accent { color: var(--primary-color, #2563eb); }
.stat-value.ok { color: #059669; }
.stat-value.muted { color: #94a3b8; }
.stat-value.status-ok { color: #2563eb; }
.stat-value.status-warn { color: #d97706; }
.stat-value.status-down { color: #dc2626; }

.status-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 18px;
  margin: -4px 0 14px;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.status-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.status-text {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.15);
}

.status-dot.s0 {
  background: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.status-dot.s1 {
  background: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.18);
}

.status-dot.s2 {
  background: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
}

.filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px 7px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #fff;
  color: #64748b;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.15s ease;
}

.filter-btn em {
  font-style: normal;
  min-width: 22px;
  padding: 1px 7px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  text-align: center;
}

.filter-btn:hover:not(.active) {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.filter-btn.active {
  background: var(--primary-color, #2563eb);
  border-color: var(--primary-color, #2563eb);
  color: #fff;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.22);
}

.filter-btn.active em {
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
}

.panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.04));
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
  white-space: nowrap;
}

.table td {
  padding: 14px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  color: var(--text-main, #0f172a);
  white-space: nowrap;
}

.table tbody tr {
  transition: background 0.15s ease;
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
  min-width: 140px;
}

.name {
  font-weight: 800;
  color: var(--text-main, #0f172a);
}

.meta {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
}

.host-chip {
  display: inline-block;
  max-width: 220px;
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

.num-cell {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  color: #334155;
}

.rate-badge {
  display: inline-flex;
  padding: 3px 8px;
  border-radius: 8px;
  background: #eff6ff;
  color: var(--primary-color, #2563eb);
  font-size: 12px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.01em;
}

.tag-vmess { background: #eff6ff; color: #2563eb; }
.tag-vless { background: #ecfdf5; color: #059669; }
.tag-trojan { background: #fffbeb; color: #d97706; }
.tag-shadowsocks { background: #fdf4ff; color: #a21caf; }
.tag-hysteria { background: #fef2f2; color: #dc2626; }
.tag-tuic { background: #ecfeff; color: #0891b2; }
.tag-anytls { background: #f7fee7; color: #65a30d; }
.tag-v2node { background: #f5f3ff; color: #6d28d9; }

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border: none;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.12s ease, filter 0.12s ease;
}

.pill:hover { filter: brightness(0.97); transform: translateY(-1px); }

.pill .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.pill-on { background: #ecfdf5; color: #059669; }
.pill-off { background: #f1f5f9; color: #64748b; }

.actions-cell {
  display: flex;
  gap: 6px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  display: inline-grid;
  place-items: center;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s ease;
}

.icon-btn.edit { color: #2563eb; background: #eff6ff; border-color: #bfdbfe; }
.icon-btn.copy { color: #7c3aed; background: #f5f3ff; border-color: #ddd6fe; }
.icon-btn.danger { color: #dc2626; background: #fef2f2; border-color: #fecaca; }

.icon-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.08);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  color: var(--text-main, #0f172a);
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
}

.btn.primary {
  background: var(--primary-color, #2563eb);
  border-color: var(--primary-color, #2563eb);
  color: #fff;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.22);
}

.btn.primary:hover { filter: brightness(1.05); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.state-box {
  padding: 52px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: var(--text-muted, #64748b);
  text-align: center;
}

.state-box h3 {
  margin: 0;
  color: var(--text-main, #0f172a);
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
  color: var(--primary-color, #2563eb);
  display: grid;
  place-items: center;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--primary-color, #2563eb);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinning { animation: spin 0.8s linear infinite; }

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.48);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 1000;
  padding: 32px 16px;
  overflow-y: auto;
}

.modal {
  background: #fff;
  border-radius: 22px;
  width: 680px;
  max-width: 95vw;
  margin-bottom: 32px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 28px 60px -18px rgba(15, 23, 42, 0.32);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 64px);
}

.modal-wide { width: 780px; }

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 22px;
  border-bottom: 1px solid #eef2f7;
  background:
    radial-gradient(120% 140% at 0% 0%, rgba(37, 99, 235, 0.08), transparent 55%),
    linear-gradient(180deg, #ffffff, #f8fafc);
  flex-shrink: 0;
}

.modal-heading { min-width: 0; }

.modal-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 800;
  margin: 0;
  color: var(--text-main, #0f172a);
  letter-spacing: -0.02em;
}

.type-chip {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}

.modal-sub {
  margin: 6px 0 0;
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
}

.modal-close {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 11px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
}

.modal-close:hover {
  background: #e2e8f0;
  color: var(--text-main, #0f172a);
}

.modal-form {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.modal-body {
  padding: 18px 22px 8px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: #f8fafc;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 22px 18px;
  border-top: 1px solid #eef2f7;
  background: #ffffff;
  flex-shrink: 0;
}

.form-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px 16px 14px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
}

.section-head {
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f1f5f9;
}

.section-head h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: var(--text-main, #0f172a);
}

.section-head p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
}

.section-title {
  font-size: 13px;
  font-weight: 800;
  color: #64748b;
  margin: 18px 0 10px;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
  letter-spacing: 0.02em;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}

.form-row { margin-bottom: 0; }

.form-row label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 7px;
}

.form-row.full-width { grid-column: 1 / -1; }

.check-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
  gap: 8px;
  padding: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  max-height: 168px;
  overflow-y: auto;
}

.check-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 11px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-main, #0f172a);
  margin: 0;
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}

.check-item:hover {
  border-color: #93c5fd;
  background: #eff6ff;
}

.check-item.selected {
  border-color: #93c5fd;
  background: #eff6ff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}

.check-item input {
  width: 15px;
  height: 15px;
  accent-color: var(--primary-color, #2563eb);
  flex-shrink: 0;
}

.check-name {
  font-weight: 700;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.check-meta {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  flex-shrink: 0;
}

.check-id {
  margin-left: auto;
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  flex-shrink: 0;
}

.check-hint {
  font-size: 12px;
  color: #64748b;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px dashed #e2e8f0;
  border-radius: 10px;
}

.check-hint.warn {
  color: #b45309;
  background: #fffbeb;
  border-color: #fde68a;
}

@media (max-width: 720px) {
  .modal-wide { width: 100%; }
  .form-grid { grid-template-columns: 1fr; }
  .modal-body { padding: 14px 14px 8px; }
  .modal-header,
  .modal-footer { padding-left: 16px; padding-right: 16px; }
}

.textarea {
  min-height: 120px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  resize: vertical;
}

.hint {
  font-size: 11px;
  color: #94a3b8;
  margin: 6px 0 0;
  line-height: 1.5;
}

.req { color: #ef4444; }

.input {
  width: 100%;
  padding: 9px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: var(--text-main, #0f172a);
  font-size: 13px;
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.input:focus {
  outline: none;
  border-color: var(--primary-color, #2563eb);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  background: #fff;
}

.link-btn {
  margin-left: 8px;
  border: none;
  background: none;
  color: var(--primary-color, #2563eb);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  text-decoration: none;
}

.link-btn:hover { text-decoration: underline; }

.tls-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 12px;
  background: linear-gradient(180deg, #f8fafc, #f1f5f9);
  border: 1px solid #e2e8f0;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
}

.install-cmd {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  color: #475569;
  background: #f8fafc;
}

.drawer-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  backdrop-filter: blur(2px);
  z-index: 1100;
  display: flex;
  justify-content: flex-end;
}

.tls-drawer {
  width: min(440px, 100vw);
  height: 100%;
  background: #fff;
  border-left: 1px solid #e2e8f0;
  box-shadow: -12px 0 40px rgba(15, 23, 42, 0.12);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.18s ease;
}

@keyframes slideIn {
  from { transform: translateX(16px); opacity: 0.6; }
  to { transform: translateX(0); opacity: 1; }
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px;
  border-bottom: 1px solid #f1f5f9;
  background: linear-gradient(180deg, #ffffff, #f8fafc);
}

.drawer-header h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  color: var(--text-main, #0f172a);
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.drawer-footer {
  padding: 14px 20px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border: 1px solid #eef2f7;
  border-radius: 12px;
  background: #f8fafc;
}

.toggle-row strong {
  display: block;
  font-size: 13px;
  color: var(--text-main, #0f172a);
}

.toggle-row p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #94a3b8;
}

.switch {
  width: 44px;
  height: 26px;
  border: none;
  border-radius: 999px;
  background: #cbd5e1;
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease;
}

.switch::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.2);
  transition: transform 0.15s ease;
}

.switch.on {
  background: #22c55e;
}

.switch.on::after {
  transform: translateX(18px);
}

.info-box {
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 12px;
  line-height: 1.55;
  font-weight: 600;
}

.info-box.ok {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #047857;
}

@media (max-width: 900px) {
  .stat-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .page-header { flex-direction: column; }
  .header-actions { width: 100%; }
  .tls-drawer { width: 100vw; }
}
</style>
