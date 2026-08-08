<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">用户管理</h1>
        <p class="page-subtitle">搜索、编辑用户套餐与流量，支持生成账号、封禁与重置订阅密钥。</p>
      </div>
      <div class="header-actions">
        <button class="btn" :disabled="loading" @click="load" title="刷新">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :class="{ spinning: loading }"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
          刷新
        </button>
        <button class="btn primary" @click="openGenerate">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          生成用户
        </button>
      </div>
    </div>

    <div class="stat-row" v-if="!loading">
      <div class="stat-card">
        <span class="stat-label">用户总数</span>
        <strong class="stat-value">{{ total }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">本页封禁</span>
        <strong class="stat-value warn">{{ pageBanned }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">本页有套餐</span>
        <strong class="stat-value accent">{{ pageWithPlan }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">本页已过期</span>
        <strong class="stat-value muted">{{ pageExpired }}</strong>
      </div>
    </div>

    <div class="toolbar-card">
      <div class="search-bar">
        <select v-model="searchKey" class="search-select" @change="searchValue = ''">
          <option value="email">邮箱</option>
          <option value="remarks">备注</option>
          <option value="id">用户 ID</option>
          <option value="invite_user_id">邀请人 ID</option>
          <option value="uuid">UUID</option>
          <option value="token">Token</option>
        </select>
        <div class="search-field">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            v-model="searchValue"
            class="search-text"
            :placeholder="fuzzyKeys.has(searchKey) ? '模糊搜索…' : '精确匹配…'"
            @keydown.enter="doSearch"
          />
        </div>
        <button type="button" class="btn primary" @click="doSearch">搜索</button>
        <button
          v-if="activeFilters.length || bannedQuick !== 'all' || planQuick !== 'all' || expiredQuick !== 'all' || sortKey !== 'created_at' || sortType !== 'DESC'"
          type="button"
          class="btn"
          @click="clearSearch"
        >
          清除
        </button>
      </div>
      <div class="toolbar-bottom">
        <div class="filters">
          <button
            v-for="ft in bannedTabs"
            :key="'ban-' + String(ft.value)"
            type="button"
            class="filter-btn"
            :class="{ active: bannedQuick === ft.value }"
            @click="bannedQuick = ft.value; doSearch()"
          >
            {{ ft.label }}
          </button>
          <span class="filter-sep" />
          <button
            v-for="ft in expiredTabs"
            :key="'exp-' + String(ft.value)"
            type="button"
            class="filter-btn"
            :class="{ active: expiredQuick === ft.value }"
            @click="expiredQuick = ft.value; doSearch()"
          >
            {{ ft.label }}
          </button>
          <span class="filter-sep" />
          <button
            type="button"
            class="filter-btn"
            :class="{ active: planQuick === 'all' }"
            @click="planQuick = 'all'; doSearch()"
          >
            全部套餐
          </button>
          <button
            type="button"
            class="filter-btn"
            :class="{ active: planQuick === 'none' }"
            @click="planQuick = 'none'; doSearch()"
          >
            无套餐
          </button>
          <button
            v-for="p in plans"
            :key="p.id"
            type="button"
            class="filter-btn"
            :class="{ active: planQuick === p.id }"
            @click="planQuick = p.id!; doSearch()"
          >
            {{ p.name }}
          </button>
        </div>
      </div>
    </div>

    <div class="panel">
      <div v-if="loading" class="state-box">
        <div class="spinner"></div>
        <p>加载用户…</p>
      </div>
      <div v-else-if="!rows.length" class="state-box empty">
        <h3>暂无用户</h3>
        <p>调整筛选，或使用「生成用户」创建账号。</p>
        <button class="btn primary" @click="openGenerate">生成用户</button>
      </div>
      <template v-else>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th style="width:56px">#</th>
                <th>邮箱</th>
                <th>备注</th>
                <th>套餐</th>
                <th>
                  <button
                    type="button"
                    class="th-sort"
                    :class="{ active: sortKey === 'total_used' }"
                    @click="toggleColumnSort('total_used')"
                    title="点击按已用流量排序"
                  >
                    流量(G)
                    <span class="sort-carets" aria-hidden="true">
                      <i class="caret up" :class="{ on: sortKey === 'total_used' && sortType === 'ASC' }" />
                      <i class="caret down" :class="{ on: sortKey === 'total_used' && sortType === 'DESC' }" />
                    </span>
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    class="th-sort"
                    :class="{ active: sortKey === 't' }"
                    @click="toggleColumnSort('t')"
                    title="点击按最近使用时间排序（节点上报流量）"
                  >
                    最近使用
                    <span class="sort-carets" aria-hidden="true">
                      <i class="caret up" :class="{ on: sortKey === 't' && sortType === 'ASC' }" />
                      <i class="caret down" :class="{ on: sortKey === 't' && sortType === 'DESC' }" />
                    </span>
                  </button>
                </th>
                <th>余额</th>
                <th>
                  <button
                    type="button"
                    class="th-sort"
                    :class="{ active: sortKey === 'expired_at' }"
                    @click="toggleColumnSort('expired_at')"
                    title="点击按到期时间排序"
                  >
                    到期时间
                    <span class="sort-carets" aria-hidden="true">
                      <i class="caret up" :class="{ on: sortKey === 'expired_at' && sortType === 'ASC' }" />
                      <i class="caret down" :class="{ on: sortKey === 'expired_at' && sortType === 'DESC' }" />
                    </span>
                  </button>
                </th>
                <th>状态</th>
                <th class="col-actions sticky-right">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in rows" :key="u.id">
                <td class="id-cell">{{ u.id }}</td>
                <td>
                  <div class="name-cell">
                    <span class="name">{{ u.email }}</span>
                    <span class="meta">
                      <em v-if="u.is_admin === 1" class="badge admin">管理员</em>
                      <em v-if="u.is_staff === 1" class="badge soft">员工</em>
                      <em v-if="u.invite_user_id" class="badge soft">邀请自 #{{ u.invite_user_id }}</em>
                    </span>
                  </div>
                </td>
                <td class="remarks-cell" :title="u.remarks || ''">{{ u.remarks?.trim() || '—' }}</td>
                <td>{{ u.plan_name || (u.plan_id ? `#${u.plan_id}` : '无') }}</td>
                <td class="traffic-cell">
                  <div class="traffic-bar">
                    <i :style="{ width: trafficPct(u) + '%' }" />
                  </div>
                  <span>{{ fmtGB(u.total_used) }} / {{ fmtGB(u.transfer_enable) }} GB</span>
                </td>
                <td class="last-use-cell" :title="lastUseText(u)">{{ lastUseText(u) }}</td>
                <td class="amount">¥{{ fmtYuan(u.balance) }}</td>
                <td>
                  <span :class="{ expired: isExpired(u) }">{{ expireText(u) }}</span>
                </td>
                <td>
                  <span class="status" :class="u.banned === 1 ? 'status-ban' : 'status-ok'">
                    {{ u.banned === 1 ? '封禁' : '正常' }}
                  </span>
                </td>
                <td class="actions-td sticky-right" @click.stop>
                  <button
                    type="button"
                    class="menu-trigger"
                    :ref="(el) => setMenuTrigger(u.id, el)"
                    @click="toggleMenu(u)"
                  >
                    操作
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <span class="page-info">共 {{ total }} 条</span>
          <button class="btn-page" :disabled="currentPage <= 1" @click="goPage(currentPage - 1)">上一页</button>
          <span class="page-num">{{ currentPage }} / {{ totalPages }}</span>
          <button class="btn-page" :disabled="currentPage >= totalPages" @click="goPage(currentPage + 1)">下一页</button>
          <select v-model.number="pageSize" class="page-size" @change="currentPage = 1; load()">
            <option :value="10">10 条/页</option>
            <option :value="20">20 条/页</option>
            <option :value="50">50 条/页</option>
          </select>
        </div>
      </template>
    </div>

    <Teleport to="body">
      <div v-if="menuUser" class="user-action-menu" :style="menuStyle" @click.stop>
        <button type="button" @click="openEdit(menuUser); closeMenu()">编辑</button>
        <button type="button" @click="goSendOrder(menuUser); closeMenu()">发送订单</button>
        <button type="button" @click="doResetSecret(menuUser); closeMenu()">重置订阅链接</button>
        <div class="menu-sep" />
        <button type="button" @click="goUserOrders(menuUser); closeMenu()">TA 的订单</button>
        <button type="button" @click="goUserInvites(menuUser); closeMenu()">TA 的邀请</button>
        <button type="button" @click="openTraffic(menuUser); closeMenu()">TA 的流量</button>
        <button type="button" @click="openLoginInfo(menuUser); closeMenu()">TA 的登录</button>
        <div class="menu-sep" />
        <button type="button" @click="toggleBan(menuUser); closeMenu()">
          {{ menuUser.banned === 1 ? '解除封禁' : '封禁' }}
        </button>
        <button type="button" class="danger" @click="askDelete(menuUser); closeMenu()">删除用户</button>
      </div>
    </Teleport>

    <!-- 编辑 -->
    <Teleport to="body">
      <div v-if="showEdit" class="modal-mask" @click.self="showEdit = false">
        <div class="modal modal-edit">
          <div class="modal-header edit-header">
            <div class="edit-avatar" :style="{ background: avatarColor(editForm.id) }">
              {{ (editForm.email || '?')[0]?.toUpperCase() }}
            </div>
            <div class="edit-head-text">
              <h2>编辑用户</h2>
              <p class="modal-sub">#{{ editForm.id }} · {{ editForm.email }}</p>
            </div>
            <button class="modal-close" @click="showEdit = false">&times;</button>
          </div>
          <form class="modal-body edit-body" @submit.prevent="saveEdit">
            <section class="edit-section">
              <h3 class="section-title">账号</h3>
              <div class="form-grid">
                <label class="field">
                  <span>邮箱 <em>*</em></span>
                  <input v-model="editForm.email" class="input" required type="email" />
                </label>
                <label class="field">
                  <span>邀请人邮箱</span>
                  <input v-model="editForm.invite_user_email" class="input" placeholder="请输入邀请人邮箱" />
                </label>
                <label class="field">
                  <span>密码</span>
                  <input v-model="editForm.password" class="input" type="password" placeholder="如需修改密码请输入" />
                </label>
                <label class="field">
                  <span>账户状态</span>
                  <select v-model="editForm.banned" class="input">
                    <option :value="false">正常</option>
                    <option :value="true">封禁</option>
                  </select>
                </label>
              </div>
            </section>

            <section class="edit-section">
              <h3 class="section-title">订阅与流量</h3>
              <div class="form-grid">
                <label class="field">
                  <span>订阅计划</span>
                  <select v-model="editForm.plan_id" class="input">
                    <option :value="null">无</option>
                    <option v-for="p in plans" :key="p.id" :value="p.id">{{ p.name }}</option>
                  </select>
                </label>
                <label class="field">
                  <span>到期时间</span>
                  <DateTimePicker v-model="editForm.expired_local" placeholder="长期有效" />
                </label>
                <label class="field">
                  <span>流量</span>
                  <div class="suffix-input"><input v-model.number="editForm.transfer_gb" class="input" type="number" step="0.01" min="0" /><em>GB</em></div>
                </label>
                <label class="field">
                  <span>设备数限制</span>
                  <input v-model.number="editForm.device_limit" class="input" type="number" min="0" placeholder="留空则不限制" />
                </label>
                <label class="field">
                  <span>已用上行</span>
                  <div class="suffix-input"><input v-model.number="editForm.u_gb" class="input" type="number" step="0.01" min="0" /><em>GB</em></div>
                </label>
                <label class="field">
                  <span>已用下行</span>
                  <div class="suffix-input"><input v-model.number="editForm.d_gb" class="input" type="number" step="0.01" min="0" /><em>GB</em></div>
                </label>
                <label class="field">
                  <span>限速</span>
                  <div class="suffix-input"><input v-model.number="editForm.speed_limit" class="input" type="number" min="0" placeholder="留空则不限制" /><em>Mbps</em></div>
                </label>
              </div>
            </section>

            <section class="edit-section">
              <h3 class="section-title">资产与返利</h3>
              <div class="form-grid">
                <label class="field">
                  <span>余额</span>
                  <div class="suffix-input"><input v-model.number="editForm.balance_yuan" class="input" type="number" step="0.01" min="0" /><em>¥</em></div>
                </label>
                <label class="field">
                  <span>推广佣金</span>
                  <div class="suffix-input"><input v-model.number="editForm.commission_yuan" class="input" type="number" step="0.01" min="0" /><em>¥</em></div>
                </label>
                <label class="field">
                  <span>推荐返利类型</span>
                  <select v-model.number="editForm.commission_type" class="input">
                    <option :value="0">跟随系统设置</option>
                    <option :value="1">周期返利</option>
                    <option :value="2">一次性返利</option>
                  </select>
                </label>
                <label class="field">
                  <span>推荐返利比例</span>
                  <div class="suffix-input"><input v-model.number="editForm.commission_rate" class="input" type="number" min="0" max="100" placeholder="空则跟随系统" /><em>%</em></div>
                </label>
                <label class="field">
                  <span>专享折扣比例</span>
                  <div class="suffix-input"><input v-model.number="editForm.discount" class="input" type="number" min="0" max="100" placeholder="空则无折扣" /><em>%</em></div>
                </label>
              </div>
            </section>

            <section class="edit-section">
              <h3 class="section-title">权限与备注</h3>
              <div class="role-row">
                <label class="switch-card" :class="{ on: editForm.is_admin }">
                  <input type="checkbox" v-model="editForm.is_admin" />
                  <span class="switch-ui" /><span>是否管理员</span>
                </label>
                <label class="switch-card" :class="{ on: editForm.is_staff }">
                  <input type="checkbox" v-model="editForm.is_staff" />
                  <span class="switch-ui" /><span>是否员工</span>
                </label>
              </div>
              <label class="field block">
                <span>备注</span>
                <textarea v-model="editForm.remarks" class="textarea" rows="3" placeholder="请在这里记录…" />
              </label>
            </section>

            <p v-if="editErr" class="form-error">{{ editErr }}</p>
            <div class="modal-footer sticky-footer">
              <button type="button" class="btn" @click="showEdit = false">取消</button>
              <button type="submit" class="btn primary" :disabled="saving">{{ saving ? '保存中…' : '提交' }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- 生成 -->
    <Teleport to="body">
      <div v-if="showGenerate" class="modal-mask" @click.self="showGenerate = false">
        <div class="modal">
          <div class="modal-header">
            <div>
              <h2>生成用户</h2>
              <p class="modal-sub">按前缀+后缀生成邮箱账号。</p>
            </div>
            <button class="modal-close" @click="showGenerate = false">&times;</button>
          </div>
          <form class="modal-body" @submit.prevent="doGenerate">
            <label class="field">
              <span>邮箱前缀 <em>*</em></span>
              <input v-model="genForm.email_prefix" class="input" required placeholder="user01" />
            </label>
            <label class="field">
              <span>邮箱后缀</span>
              <input v-model="genForm.email_suffix" class="input" placeholder="gmail.com" />
            </label>
            <label class="field">
              <span>密码</span>
              <input v-model="genForm.password" class="input" type="password" placeholder="默认等于完整邮箱" />
            </label>
            <label class="field">
              <span>套餐</span>
              <select v-model="genForm.plan_id" class="input">
                <option :value="null">无套餐</option>
                <option v-for="p in plans" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </label>
            <label class="field">
              <span>到期时间</span>
              <DateTimePicker v-model="genForm.expired_local" placeholder="长期有效" />
            </label>
            <p v-if="genErr" class="form-error">{{ genErr }}</p>
            <div class="modal-footer">
              <button type="button" class="btn" @click="showGenerate = false">取消</button>
              <button type="submit" class="btn primary" :disabled="generating">{{ generating ? '生成中…' : '生成' }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="deleteTarget" class="modal-mask" @click.self="deleteTarget = null">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h2>删除用户</h2>
            <button class="modal-close" @click="deleteTarget = null">&times;</button>
          </div>
          <div class="modal-body">
            <p class="confirm-text">确认删除 <strong>{{ deleteTarget.email }}</strong>？将同时清理其订单与工单。</p>
            <div class="modal-footer">
              <button type="button" class="btn" @click="deleteTarget = null">取消</button>
              <button type="button" class="btn danger-solid" :disabled="deleting" @click="doDelete">
                {{ deleting ? '删除中…' : '确认删除' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 流量记录（按天） -->
    <Teleport to="body">
      <div v-if="showTraffic" class="modal-mask" @click.self="showTraffic = false">
        <div class="modal modal-detail traffic-modal">
          <div class="modal-header">
            <div>
              <h2>流量记录</h2>
              <p class="modal-sub">{{ trafficUser?.email }} · #{{ trafficUser?.id }} · 按天统计</p>
            </div>
            <button class="modal-close" @click="showTraffic = false">&times;</button>
          </div>
          <div class="modal-body traffic-body">
            <div v-if="trafficLoading" class="empty">加载中…</div>
            <template v-else-if="!trafficRows.length">
              <div class="empty">暂无按天流量记录</div>
              <p class="hint-text traffic-empty-hint">
                套餐用量来自用户累计字段；按天明细由节点上报写入 <code>v2_stat_user</code>。
                若用户已有用量但此处为空，说明尚未产生日统计（或历史数据未同步）。
              </p>
            </template>
            <template v-else>
              <div class="traffic-table-wrap">
                <table class="mini-table traffic-day-table">
                  <thead>
                    <tr>
                      <th>日期</th>
                      <th class="num">上行</th>
                      <th class="num">下行</th>
                      <th class="num">倍率</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in trafficRows" :key="r.record_at">
                      <td>{{ fmtDate(r.record_at) }}</td>
                      <td class="num">{{ fmtTraffic(r.u) }}</td>
                      <td class="num">{{ fmtTraffic(r.d) }}</td>
                      <td class="num">{{ fmtRate(r.server_rate) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="traffic-pager">
                <button type="button" class="page-btn" :disabled="trafficPage <= 1" @click="goTrafficPage(trafficPage - 1)">‹</button>
                <button
                  v-for="p in trafficPageButtons"
                  :key="p"
                  type="button"
                  class="page-btn"
                  :class="{ active: p === trafficPage }"
                  @click="goTrafficPage(p)"
                >{{ p }}</button>
                <button type="button" class="page-btn" :disabled="trafficPage >= trafficPages" @click="goTrafficPage(trafficPage + 1)">›</button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 登录记录 -->
    <Teleport to="body">
      <div v-if="showLogin" class="modal-mask" @click.self="showLogin = false">
        <div class="modal modal-detail traffic-modal">
          <div class="modal-header">
            <div>
              <h2>登录记录</h2>
              <p class="modal-sub">
                {{ loginEmail || loginUser?.email }} · #{{ loginUser?.id }}
                <template v-if="loginLastAt"> · 最近 {{ fmtTime(loginLastAt) }}</template>
              </p>
            </div>
            <button class="modal-close" @click="showLogin = false">&times;</button>
          </div>
          <div class="modal-body traffic-body">
            <div v-if="loginLoading" class="empty">加载中…</div>
            <template v-else-if="!loginRows.length">
              <div class="empty">暂无登录记录</div>
              <p class="hint-text traffic-empty-hint">用户下次登录后将写入记录（含 IP 与 User-Agent）。</p>
            </template>
            <template v-else>
              <div class="traffic-table-wrap">
                <table class="mini-table traffic-day-table">
                  <thead>
                    <tr>
                      <th>时间</th>
                      <th>IP</th>
                      <th>客户端</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in loginRows" :key="r.id">
                      <td>{{ fmtTime(r.created_at) }}</td>
                      <td class="mono">{{ r.ip || '—' }}</td>
                      <td class="ua-cell" :title="r.user_agent || ''">{{ shortenUa(r.user_agent) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="traffic-pager">
                <button type="button" class="page-btn" :disabled="loginPage <= 1" @click="goLoginPage(loginPage - 1)">‹</button>
                <button
                  v-for="p in loginPageButtons"
                  :key="'login-' + p"
                  type="button"
                  class="page-btn"
                  :class="{ active: p === loginPage }"
                  @click="goLoginPage(p)"
                >{{ p }}</button>
                <button type="button" class="page-btn" :disabled="loginPage >= loginPages" @click="goLoginPage(loginPage + 1)">›</button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="toastMessage" class="toast" :class="{ error: toastError }">{{ toastMessage }}</div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, type ComponentPublicInstance } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DateTimePicker from '../../components/admin/DateTimePicker.vue'
import {
  deleteAdminUser,
  fetchAdminPlans,
  fetchAdminUserLoginLog,
  fetchAdminUsers,
  fetchStatUser,
  generateAdminUser,
  getAdminUserInfo,
  resetAdminUserSecret,
  updateAdminUser,
  type AdminPlan,
  type AdminUser,
  type AdminUserLoginLog,
  type OrderFilter,
  type PageResult,
  type StatUserRecord
} from '../../api/admin'
import { adminUrl } from '../../siteBrand'

const route = useRoute()
const router = useRouter()

const GB = 1073741824
const EXACT_KEYS = new Set(['id', 'invite_user_id', 'banned', 'plan_id'])
const fuzzyKeys = new Set(['email', 'uuid', 'token', 'remarks'])

const rows = ref<AdminUser[]>([])
const plans = ref<AdminPlan[]>([])
const total = ref(0)
const loading = ref(true)
const currentPage = ref(1)
const pageSize = ref(10)
const searchKey = ref('email')
const searchValue = ref('')
const activeFilters = ref<OrderFilter[]>([])
const bannedQuick = ref<'all' | 0 | 1>('all')
const expiredQuick = ref<'all' | 0 | 1>('all')
const planQuick = ref<'all' | 'none' | number>('all')
/** 默认 created_at：未点表头排序；点箭头后才切到业务列 */
const sortKey = ref<'created_at' | 'total_used' | 'expired_at' | 't'>('created_at')
const sortType = ref<'ASC' | 'DESC'>('DESC')

const menuUser = ref<AdminUser | null>(null)
const menuStyle = ref<Record<string, string>>({})
const menuTriggers = new Map<number, HTMLElement>()

const showEdit = ref(false)
const saving = ref(false)
const editErr = ref('')
const editForm = reactive({
  id: 0,
  email: '',
  password: '',
  plan_id: null as number | null,
  expired_local: '',
  balance_yuan: 0,
  commission_yuan: 0,
  u_gb: 0,
  d_gb: 0,
  transfer_gb: 0,
  device_limit: undefined as number | undefined,
  speed_limit: undefined as number | undefined,
  invite_user_email: '',
  banned: false,
  is_admin: false,
  is_staff: false,
  commission_type: 0,
  commission_rate: undefined as number | undefined,
  discount: undefined as number | undefined,
  remarks: ''
})

const showGenerate = ref(false)
const generating = ref(false)
const genErr = ref('')
const genForm = reactive({
  email_prefix: '',
  email_suffix: 'gmail.com',
  password: '',
  plan_id: null as number | null,
  expired_local: ''
})

const deleteTarget = ref<AdminUser | null>(null)
const deleting = ref(false)

const showTraffic = ref(false)
const trafficLoading = ref(false)
const trafficUser = ref<AdminUser | null>(null)
const trafficRows = ref<StatUserRecord[]>([])
const trafficTotal = ref(0)
const trafficPage = ref(1)
const trafficPageSize = 10
const trafficPages = computed(() => Math.max(1, Math.ceil(trafficTotal.value / trafficPageSize)))
const trafficPageButtons = computed(() => {
  const total = trafficPages.value
  const cur = trafficPage.value
  const start = Math.max(1, Math.min(cur - 2, total - 4))
  const end = Math.min(total, Math.max(5, cur + 2))
  const pages: number[] = []
  for (let p = Math.max(1, start); p <= end; p++) pages.push(p)
  return pages
})

const showLogin = ref(false)
const loginLoading = ref(false)
const loginUser = ref<AdminUser | null>(null)
const loginEmail = ref('')
const loginLastAt = ref<number | null>(null)
const loginRows = ref<AdminUserLoginLog[]>([])
const loginTotal = ref(0)
const loginPage = ref(1)
const loginPageSize = 10
const loginPages = computed(() => Math.max(1, Math.ceil(loginTotal.value / loginPageSize)))
const loginPageButtons = computed(() => {
  const total = loginPages.value
  const cur = loginPage.value
  const start = Math.max(1, Math.min(cur - 2, total - 4))
  const end = Math.min(total, Math.max(5, cur + 2))
  const pages: number[] = []
  for (let p = Math.max(1, start); p <= end; p++) pages.push(p)
  return pages
})

const toastMessage = ref('')
const toastError = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | null = null

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const pageBanned = computed(() => rows.value.filter((u) => u.banned === 1).length)
const pageWithPlan = computed(() => rows.value.filter((u) => u.plan_id != null).length)
const pageExpired = computed(() => rows.value.filter((u) => isExpired(u)).length)

const bannedTabs = [
  { value: 'all' as const, label: '全部' },
  { value: 0 as const, label: '正常' },
  { value: 1 as const, label: '封禁' }
]
const expiredTabs = [
  { value: 'all' as const, label: '全部' },
  { value: 0 as const, label: '未过期' },
  { value: 1 as const, label: '已过期' }
]

function showToast(msg: string, error = false) {
  toastMessage.value = msg
  toastError.value = error
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    if (toastMessage.value === msg) toastMessage.value = ''
  }, 2600)
}

function nowSec() {
  return Math.floor(Date.now() / 1000)
}
function isExpired(u: AdminUser) {
  return !!(u.expired_at && u.expired_at < nowSec())
}
function expireText(u: AdminUser) {
  if (!u.expired_at) return '长期'
  return fmtTime(u.expired_at)
}
/** v2_user.t：节点上报流量时写入的最近使用时间 */
function lastUseText(u: AdminUser) {
  if (!u.t) return '—'
  return fmtTime(u.t)
}
function fmtTime(ts: number | null | undefined) {
  if (!ts) return '—'
  const d = new Date(ts * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function toLocal(ts: number | null | undefined) {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function fromLocal(v: string) {
  if (!v) return null
  return Math.floor(new Date(v).getTime() / 1000)
}
function fmtYuan(v: number | null | undefined) {
  return ((v || 0) / 100).toFixed(2)
}
function fmtGB(bytes: number | null | undefined) {
  return ((bytes || 0) / GB).toFixed(2)
}
function trafficPct(u: AdminUser) {
  const totalBytes = u.transfer_enable || 0
  if (!totalBytes) return 0
  return Math.min(100, Math.round(((u.total_used || 0) / totalBytes) * 100))
}

function avatarColor(id: number) {
  const hues = [210, 160, 280, 20, 340, 190]
  const h = hues[Math.abs(id) % hues.length]
  return `linear-gradient(135deg, hsl(${h} 70% 52%), hsl(${h + 24} 75% 42%))`
}

function buildFilters(): OrderFilter[] {
  const filters: OrderFilter[] = []
  const value = searchValue.value.trim()
  if (value) {
    filters.push({
      key: searchKey.value,
      condition: EXACT_KEYS.has(searchKey.value) ? '=' : '模糊',
      value
    })
  }
  if (bannedQuick.value !== 'all') {
    filters.push({ key: 'banned', condition: '=', value: String(bannedQuick.value) })
  }
  if (expiredQuick.value !== 'all') {
    filters.push({ key: 'expired', condition: '=', value: String(expiredQuick.value) })
  }
  if (planQuick.value === 'none') {
    filters.push({ key: 'plan_id', condition: '=', value: 'null' })
  } else if (typeof planQuick.value === 'number') {
    filters.push({ key: 'plan_id', condition: '=', value: String(planQuick.value) })
  }
  return filters
}

async function load() {
  loading.value = true
  try {
    const [res, planList]: [PageResult<AdminUser>, AdminPlan[]] = await Promise.all([
      fetchAdminUsers(currentPage.value, pageSize.value, activeFilters.value, sortKey.value, sortType.value),
      plans.value.length ? Promise.resolve(plans.value) : fetchAdminPlans()
    ])
    rows.value = res.data || []
    total.value = Number(res.total) || 0
    plans.value = planList
  } catch (e) {
    showToast(e instanceof Error ? e.message : '加载失败', true)
  } finally {
    loading.value = false
  }
}

function doSearch() {
  activeFilters.value = buildFilters()
  currentPage.value = 1
  load()
}

function clearSearch() {
  searchKey.value = 'email'
  searchValue.value = ''
  bannedQuick.value = 'all'
  expiredQuick.value = 'all'
  planQuick.value = 'all'
  sortKey.value = 'created_at'
  sortType.value = 'DESC'
  activeFilters.value = []
  currentPage.value = 1
  load()
}

/** 无排序 → DESC → ASC → 无排序（回默认 created_at） */
function toggleColumnSort(key: 'total_used' | 'expired_at' | 't') {
  if (sortKey.value !== key) {
    sortKey.value = key
    sortType.value = 'DESC'
  } else if (sortType.value === 'DESC') {
    sortType.value = 'ASC'
  } else {
    sortKey.value = 'created_at'
    sortType.value = 'DESC'
  }
  currentPage.value = 1
  load()
}

function goPage(p: number) {
  currentPage.value = p
  load()
}

async function openEdit(u: AdminUser) {
  editErr.value = ''
  try {
    const info = await getAdminUserInfo(u.id)
    editForm.id = info.id
    editForm.email = info.email
    editForm.password = ''
    editForm.plan_id = info.plan_id
    editForm.expired_local = toLocal(info.expired_at)
    editForm.balance_yuan = Number(((info.balance || 0) / 100).toFixed(2))
    editForm.commission_yuan = Number(((info.commission_balance || 0) / 100).toFixed(2))
    editForm.u_gb = Number(((info.u || 0) / GB).toFixed(2))
    editForm.d_gb = Number(((info.d || 0) / GB).toFixed(2))
    editForm.transfer_gb = Number(((info.transfer_enable || 0) / GB).toFixed(2))
    editForm.device_limit = info.device_limit ?? undefined
    editForm.speed_limit = info.speed_limit ?? undefined
    editForm.invite_user_email = info.invite_user?.email || ''
    editForm.banned = info.banned === 1
    editForm.is_admin = info.is_admin === 1
    editForm.is_staff = info.is_staff === 1
    editForm.commission_type = info.commission_type ?? 0
    editForm.commission_rate = info.commission_rate ?? undefined
    editForm.discount = info.discount ?? undefined
    editForm.remarks = info.remarks || ''
    showEdit.value = true
  } catch (e) {
    showToast(e instanceof Error ? e.message : '加载用户失败', true)
  }
}

async function saveEdit() {
  editErr.value = ''
  saving.value = true
  try {
    const payload: Record<string, unknown> = {
      id: editForm.id,
      email: editForm.email.trim(),
      plan_id: editForm.plan_id,
      expired_at: fromLocal(editForm.expired_local),
      balance: Math.round(Number(editForm.balance_yuan || 0) * 100),
      commission_balance: Math.round(Number(editForm.commission_yuan || 0) * 100),
      u: Math.round(Number(editForm.u_gb || 0) * GB),
      d: Math.round(Number(editForm.d_gb || 0) * GB),
      transfer_enable: Math.round(Number(editForm.transfer_gb || 0) * GB),
      device_limit: editForm.device_limit ?? null,
      speed_limit: editForm.speed_limit ?? null,
      invite_user_email: editForm.invite_user_email.trim(),
      banned: editForm.banned ? 1 : 0,
      is_admin: editForm.is_admin ? 1 : 0,
      is_staff: editForm.is_staff ? 1 : 0,
      commission_type: editForm.commission_type ?? 0,
      commission_rate: editForm.commission_rate ?? null,
      discount: editForm.discount ?? null,
      remarks: editForm.remarks
    }
    if (editForm.password) payload.password = editForm.password
    await updateAdminUser(payload)
    showEdit.value = false
    showToast('用户已保存')
    await load()
  } catch (e) {
    editErr.value = e instanceof Error ? e.message : '保存失败'
  } finally {
    saving.value = false
  }
}

function openGenerate() {
  genErr.value = ''
  genForm.email_prefix = ''
  genForm.email_suffix = 'gmail.com'
  genForm.password = ''
  genForm.plan_id = null
  genForm.expired_local = ''
  showGenerate.value = true
}

async function doGenerate() {
  genErr.value = ''
  if (!genForm.email_prefix.trim()) {
    genErr.value = '请填写邮箱前缀'
    return
  }
  generating.value = true
  try {
    await generateAdminUser({
      email_prefix: genForm.email_prefix.trim(),
      email_suffix: genForm.email_suffix.trim() || 'gmail.com',
      password: genForm.password || undefined,
      plan_id: genForm.plan_id,
      expired_at: fromLocal(genForm.expired_local)
    })
    showGenerate.value = false
    showToast('用户已生成')
    await load()
  } catch (e) {
    genErr.value = e instanceof Error ? e.message : '生成失败'
  } finally {
    generating.value = false
  }
}

async function toggleBan(u: AdminUser) {
  try {
    await updateAdminUser({ id: u.id, banned: u.banned === 1 ? 0 : 1 })
    showToast(u.banned === 1 ? '已解除封禁' : '已封禁')
    await load()
  } catch (e) {
    showToast(e instanceof Error ? e.message : '操作失败', true)
  }
}

async function doResetSecret(u: AdminUser) {
  if (!window.confirm(`确认重置 ${u.email} 的订阅链接？\n将重新生成 token 与 uuid，旧订阅立即失效。`)) return
  try {
    await resetAdminUserSecret(u.id)
    showToast('订阅链接已重置')
  } catch (e) {
    showToast(e instanceof Error ? e.message : '重置失败', true)
  }
}

function goSendOrder(u: AdminUser) {
  router.push({ path: adminUrl('/orders'), query: { assign_email: u.email } })
}

function goUserOrders(u: AdminUser) {
  router.push({ path: adminUrl('/orders'), query: { user_id: String(u.id) } })
}

function goUserInvites(u: AdminUser) {
  searchKey.value = 'invite_user_id'
  searchValue.value = String(u.id)
  bannedQuick.value = 'all'
  expiredQuick.value = 'all'
  planQuick.value = 'all'
  sortKey.value = 'created_at'
  sortType.value = 'DESC'
  activeFilters.value = [{ key: 'invite_user_id', condition: '=', value: String(u.id) }]
  currentPage.value = 1
  load()
  showToast(`已筛选由 #${u.id} 邀请的用户`)
}

async function openTraffic(u: AdminUser) {
  trafficUser.value = u
  trafficRows.value = []
  trafficTotal.value = 0
  trafficPage.value = 1
  showTraffic.value = true
  await loadTrafficPage(1)
}

async function loadTrafficPage(page: number) {
  if (!trafficUser.value) return
  trafficLoading.value = true
  try {
    const res = await fetchStatUser(trafficUser.value.id, page, trafficPageSize)
    trafficRows.value = res.data || []
    trafficTotal.value = res.total || 0
    trafficPage.value = page
  } catch (e) {
    showToast(e instanceof Error ? e.message : '加载流量失败', true)
    if (page === 1) showTraffic.value = false
  } finally {
    trafficLoading.value = false
  }
}

function goTrafficPage(page: number) {
  if (page < 1 || page > trafficPages.value || page === trafficPage.value) return
  void loadTrafficPage(page)
}

async function openLoginInfo(u: AdminUser) {
  loginUser.value = u
  loginEmail.value = u.email
  loginLastAt.value = u.last_login_at ?? null
  loginRows.value = []
  loginTotal.value = 0
  loginPage.value = 1
  showLogin.value = true
  await loadLoginPage(1)
}

async function loadLoginPage(page: number) {
  if (!loginUser.value) return
  loginLoading.value = true
  try {
    const res = await fetchAdminUserLoginLog(loginUser.value.id, page, loginPageSize)
    loginRows.value = res.data || []
    loginTotal.value = res.total || 0
    loginPage.value = page
    if (res.email) loginEmail.value = res.email
    if (res.last_login_at != null) loginLastAt.value = res.last_login_at
  } catch (e) {
    showToast(e instanceof Error ? e.message : '加载登录记录失败', true)
    if (page === 1) showLogin.value = false
  } finally {
    loginLoading.value = false
  }
}

function goLoginPage(page: number) {
  if (page < 1 || page > loginPages.value || page === loginPage.value) return
  void loadLoginPage(page)
}

function shortenUa(ua: string | null | undefined) {
  if (!ua) return '—'
  const s = ua.trim()
  if (s.length <= 72) return s
  return `${s.slice(0, 69)}…`
}

function fmtDate(ts: number | null | undefined) {
  if (ts == null) return '—'
  const d = new Date(ts > 1e12 ? ts : ts * 1000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fmtTraffic(n: number | null | undefined) {
  const v = Number(n || 0)
  if (v <= 0) return '0.00 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let x = v
  while (x >= 1024 && i < units.length - 1) {
    x /= 1024
    i += 1
  }
  return `${x.toFixed(2)} ${units[i]}`
}

function fmtRate(n: number | null | undefined) {
  return Number(n ?? 1).toFixed(2)
}

function applyRouteQuery() {
  const inviteId = route.query.invite_user_id
  if (inviteId != null && String(inviteId)) {
    searchKey.value = 'invite_user_id'
    searchValue.value = String(inviteId)
    activeFilters.value = [{ key: 'invite_user_id', condition: '=', value: String(inviteId) }]
  }
}

function askDelete(u: AdminUser) {
  deleteTarget.value = u
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await deleteAdminUser(deleteTarget.value.id)
    deleteTarget.value = null
    showToast('已删除')
    if (rows.value.length === 1 && currentPage.value > 1) currentPage.value -= 1
    await load()
  } catch (e) {
    showToast(e instanceof Error ? e.message : '删除失败', true)
  } finally {
    deleting.value = false
  }
}

function setMenuTrigger(id: number, el: Element | ComponentPublicInstance | null) {
  const node = el && '$el' in (el as ComponentPublicInstance)
    ? ((el as ComponentPublicInstance).$el as HTMLElement | null)
    : (el as HTMLElement | null)
  if (node) menuTriggers.set(id, node)
  else menuTriggers.delete(id)
}

function positionMenu(u: AdminUser) {
  const trigger = menuTriggers.get(u.id)
  if (!trigger) return
  const rect = trigger.getBoundingClientRect()
  const menuH = 360
  const menuW = 188
  const spaceBelow = window.innerHeight - rect.bottom
  const top = spaceBelow < menuH + 8 ? rect.top - menuH - 6 : rect.bottom + 6
  menuStyle.value = {
    position: 'fixed',
    top: `${Math.max(8, top)}px`,
    left: `${Math.max(8, Math.min(rect.right - menuW, window.innerWidth - menuW - 8))}px`,
    zIndex: '4000'
  }
}

function toggleMenu(u: AdminUser) {
  if (menuUser.value?.id === u.id) {
    menuUser.value = null
    return
  }
  menuUser.value = u
  positionMenu(u)
}

function closeMenu() {
  menuUser.value = null
}

function onDocClick(e: MouseEvent) {
  const t = e.target as HTMLElement
  if (t.closest('.menu-trigger') || t.closest('.user-action-menu')) return
  closeMenu()
}

function onViewportChange() {
  if (menuUser.value) positionMenu(menuUser.value)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  closeMenu()
  showEdit.value = false
  showGenerate.value = false
  showTraffic.value = false
  showLogin.value = false
  deleteTarget.value = null
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', onViewportChange)
  document.addEventListener('click', onDocClick)
  document.addEventListener('scroll', onViewportChange, true)
  applyRouteQuery()
  load()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', onViewportChange)
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('scroll', onViewportChange, true)
  if (toastTimer) clearTimeout(toastTimer)
})
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-title { margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
.page-subtitle { margin: 4px 0 0; font-size: 13px; color: #64748b; }
.header-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.stat-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.stat-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px 16px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04); display: flex; flex-direction: column; gap: 6px;
}
.stat-label { font-size: 12px; font-weight: 700; color: #94a3b8; }
.stat-value { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.03em; }
.stat-value.accent { color: #2563eb; }
.stat-value.warn { color: #d97706; }
.stat-value.muted { color: #94a3b8; }

.toolbar-card {
  display: flex; flex-direction: column; gap: 12px; padding: 14px;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.search-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.search-select {
  height: 38px; padding: 0 12px; border: 1px solid #e2e8f0; border-radius: 12px;
  background: #fff; font-size: 13px; font-weight: 600; width: auto; min-width: 110px;
}
.search-field {
  display: flex; align-items: center; gap: 8px; flex: 1 1 260px; min-width: 200px;
  height: 38px; padding: 0 12px; border: 1px solid #e2e8f0; border-radius: 12px;
  background: #f8fafc; color: #94a3b8;
}
.search-field:focus-within { border-color: #93c5fd; background: #fff; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }
.search-text { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; font-size: 13px; color: #0f172a; }
.toolbar-bottom { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.filters { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.filter-sep { width: 1px; height: 20px; background: #e2e8f0; }
.filter-btn {
  padding: 7px 12px; border: 1px solid #e2e8f0; border-radius: 999px; background: #fff;
  color: #64748b; cursor: pointer; font-size: 13px; font-weight: 600;
}
.filter-btn.active { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }

.panel {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: visible;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.state-box {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; padding: 48px 20px; text-align: center; color: #64748b;
}
.state-box h3 { margin: 0; font-size: 16px; font-weight: 800; color: #0f172a; }
.state-box p { margin: 0; font-size: 13px; color: #94a3b8; }
.spinner {
  width: 28px; height: 28px; border: 3px solid #e2e8f0; border-top-color: #2563eb;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 0.8s linear infinite; }

.table-wrap { overflow-x: auto; border-radius: 16px 16px 0 0; }
.table { width: max-content; min-width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
.table th, .table td {
  padding: 12px 14px; border-bottom: 1px solid #f1f5f9; text-align: left; vertical-align: middle; white-space: nowrap;
}
.table th { font-size: 12px; font-weight: 700; color: #94a3b8; background: #f8fafc; position: sticky; top: 0; z-index: 1; }
.th-sort {
  display: inline-flex; align-items: center; gap: 5px; padding: 0; border: 0; background: transparent;
  font: inherit; font-size: 12px; font-weight: 700; color: #94a3b8; cursor: pointer;
}
.th-sort:hover, .th-sort.active { color: #1d4ed8; }
.sort-carets {
  display: inline-flex; flex-direction: column; gap: 1px; line-height: 0;
}
.sort-carets .caret {
  display: block; width: 0; height: 0; border-left: 3.5px solid transparent; border-right: 3.5px solid transparent;
  opacity: 0.35;
}
.sort-carets .caret.up { border-bottom: 4px solid currentColor; }
.sort-carets .caret.down { border-top: 4px solid currentColor; }
.sort-carets .caret.on { opacity: 1; color: #1d4ed8; }
.table tbody tr:hover { background: #f8fafc; }
.id-cell { color: #94a3b8; font-weight: 700; }
.name-cell { display: flex; flex-direction: column; gap: 4px; }
.name { font-weight: 700; color: #0f172a; }
.meta { display: flex; gap: 6px; flex-wrap: wrap; }
.remarks-cell {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #475569;
  font-weight: 600;
}
.last-use-cell { color: #64748b; font-variant-numeric: tabular-nums; }
.badge {
  font-style: normal; font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 999px;
}
.badge.admin { background: #fef3c7; color: #b45309; }
.badge.soft { background: #f1f5f9; color: #64748b; }

.traffic-cell { min-width: 140px; }
.traffic-bar {
  height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin-bottom: 4px; width: 120px;
}
.traffic-bar i { display: block; height: 100%; background: #2563eb; border-radius: 999px; }
.traffic-cell span { font-size: 11px; color: #64748b; font-weight: 600; }
.amount { font-weight: 800; font-variant-numeric: tabular-nums; }
.expired { color: #dc2626; font-weight: 700; }

.status {
  display: inline-flex; padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: 800;
}
.status-ok { background: #ecfdf5; color: #059669; }
.status-ban { background: #fef2f2; color: #dc2626; }

.col-actions, .actions-td.sticky-right {
  position: sticky; right: 0; background: #fff; z-index: 2;
  box-shadow: -8px 0 12px -10px rgba(15, 23, 42, 0.18);
}
.table thead .col-actions { background: #f8fafc; z-index: 3; }
.menu-trigger {
  display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px;
  border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; color: #334155;
  font-size: 13px; font-weight: 600; cursor: pointer;
}
.menu-trigger:hover { border-color: #bfdbfe; color: #1d4ed8; }

.pagination {
  display: flex; align-items: center; gap: 10px; padding: 12px 16px;
  border-top: 1px solid #f1f5f9; flex-wrap: wrap;
}
.page-info { font-size: 12px; color: #94a3b8; font-weight: 600; margin-right: auto; }
.page-num { font-size: 13px; font-weight: 700; color: #334155; }
.btn-page {
  padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff;
  font-size: 13px; font-weight: 600; color: #334155; cursor: pointer;
}
.btn-page:disabled { opacity: 0.45; cursor: not-allowed; }
.page-size {
  width: 110px; height: 32px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0 8px; font-size: 12px;
}

.btn {
  display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px;
  border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; color: #334155;
  font-size: 13px; font-weight: 700; cursor: pointer;
}
.btn:disabled { opacity: 0.55; cursor: not-allowed; }
.btn.primary { background: #2563eb; border-color: #2563eb; color: #fff; }
.btn.danger-solid { background: #dc2626; border-color: #dc2626; color: #fff; }

.input {
  width: 100%; height: 40px; padding: 0 12px; border: 1px solid #e2e8f0; border-radius: 12px;
  font-size: 13px; color: #0f172a; background: #fff; box-sizing: border-box;
}
.input:focus { outline: none; border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }

@media (max-width: 900px) {
  .stat-row { grid-template-columns: 1fr 1fr; }
  .page-header { flex-direction: column; }
}
</style>

<style>
.user-action-menu {
  min-width: 188px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.14); padding: 6px; display: flex; flex-direction: column; gap: 2px;
}
.user-action-menu button {
  border: 0; background: transparent; text-align: left; padding: 9px 12px; border-radius: 8px;
  font-size: 13px; font-weight: 600; color: #334155; cursor: pointer;
}
.user-action-menu button:hover { background: #f1f5f9; }
.user-action-menu button.danger { color: #dc2626; }
.user-action-menu button.danger:hover { background: #fef2f2; }
.user-action-menu .menu-sep { height: 1px; margin: 4px 6px; background: #f1f5f9; }

.modal-mask {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45);
  display: grid; place-items: center; z-index: 3500; padding: 20px;
}
.modal {
  width: min(520px, 100%); background: #fff; border-radius: 18px;
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.22); overflow: hidden; max-height: 90vh; overflow-y: auto;
}
.modal.modal-wide { width: min(760px, 100%); }
/* 需压过 admin.css 的 body.admin-theme .modal { width: 480px } */
body.admin-theme .modal.modal-edit,
.admin-page .modal.modal-edit,
.modal.modal-edit {
  width: min(1080px, 96vw) !important;
  max-width: 96vw !important;
  display: flex;
  flex-direction: column;
  max-height: 92vh;
}
body.admin-theme .modal.modal-detail,
.admin-page .modal.modal-detail,
.modal.modal-detail {
  width: min(720px, 96vw) !important;
  max-width: 96vw !important;
}
.modal.modal-sm,
.modal.confirm-modal { width: min(420px, 100%); }
.traffic-modal .traffic-body { padding-bottom: 16px; }
.traffic-table-wrap { overflow: auto; max-height: 52vh; border: 1px solid #e2e8f0; border-radius: 12px; }
.mini-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.mini-table th, .mini-table td {
  padding: 12px 14px; border-bottom: 1px solid #f1f5f9; text-align: left; white-space: nowrap;
}
.mini-table th { background: #f8fafc; color: #64748b; font-weight: 700; position: sticky; top: 0; }
.mini-table tbody tr:hover { background: #f0f7ff; }
.mini-table .num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; color: #334155; }
.mini-table .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; }
.mini-table .ua-cell {
  max-width: 360px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-size: 12px; color: #64748b; font-weight: 500;
}
.traffic-pager {
  display: flex; justify-content: flex-end; align-items: center; gap: 6px; margin-top: 14px;
}
.traffic-pager .page-btn {
  min-width: 32px; height: 32px; padding: 0 8px; border: 1px solid #e2e8f0; border-radius: 8px;
  background: #fff; color: #64748b; font-size: 13px; font-weight: 700; cursor: pointer;
}
.traffic-pager .page-btn:hover:not(:disabled) { border-color: #93c5fd; color: #2563eb; }
.traffic-pager .page-btn.active { border-color: #2563eb; color: #2563eb; background: #eff6ff; }
.traffic-pager .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.traffic-empty-hint { text-align: center; max-width: 420px; margin: 0 auto; }
.hint-text { margin: 8px 0 0; font-size: 12px; color: #94a3b8; line-height: 1.45; }
.modal-body .empty { text-align: center; padding: 28px 12px; color: #94a3b8; font-size: 13px; }
.modal-header {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  padding: 18px 20px 14px; position: sticky; top: 0; background: #fff; z-index: 1;
  border-bottom: 1px solid #f1f5f9; flex-shrink: 0;
}
.edit-header { align-items: center; }
.edit-avatar {
  width: 42px; height: 42px; border-radius: 12px; color: #fff;
  display: grid; place-items: center; font-weight: 800; font-size: 16px; flex-shrink: 0;
}
.edit-head-text { flex: 1; min-width: 0; }
.modal-header h2 { margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; }
.modal-sub { margin: 4px 0 0; font-size: 12px; color: #94a3b8; }
.modal-close {
  border: 0; background: #f1f5f9; width: 32px; height: 32px; border-radius: 10px;
  font-size: 20px; line-height: 1; cursor: pointer; color: #64748b;
}
.modal-body { padding: 16px 20px 20px; display: flex; flex-direction: column; gap: 12px; }
.edit-body { overflow-y: auto; gap: 14px; padding-bottom: 0; }
.edit-section {
  padding: 14px; border: 1px solid #eef2f7; border-radius: 14px; background: #fafbfc;
}
.section-title {
  margin: 0 0 12px; font-size: 13px; font-weight: 800; color: #0f172a;
}
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 700; color: #64748b; }
.field.block { margin-top: 4px; }
.field > span em { color: #ef4444; font-style: normal; }
.suffix-input { position: relative; }
.suffix-input .input { padding-right: 44px; }
.suffix-input em {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  color: #94a3b8; font-style: normal; font-weight: 700; font-size: 12px; pointer-events: none;
}
.textarea {
  width: 100%; box-sizing: border-box; min-height: 84px; padding: 10px 12px;
  border: 1px solid #e2e8f0; border-radius: 12px; font-size: 13px; color: #0f172a;
  font-family: inherit; resize: vertical; background: #fff;
}
.textarea:focus { outline: none; border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }
.role-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
.switch-card {
  display: inline-flex; align-items: center; gap: 10px; padding: 10px 14px;
  border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; cursor: pointer;
  font-size: 13px; font-weight: 700; color: #475569; user-select: none;
}
.switch-card input { display: none; }
.switch-ui {
  width: 36px; height: 20px; border-radius: 999px; background: #cbd5e1; position: relative;
  transition: background 0.2s;
}
.switch-ui::after {
  content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px;
  border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(15,23,42,.2); transition: transform .2s;
}
.switch-card.on { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }
.switch-card.on .switch-ui { background: #2563eb; }
.switch-card.on .switch-ui::after { transform: translateX(16px); }
.form-error { margin: 0; color: #dc2626; font-size: 13px; font-weight: 600; }
.confirm-text { margin: 0; font-size: 14px; color: #334155; line-height: 1.6; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px; }
.sticky-footer {
  position: sticky; bottom: 0; margin: 0 -20px; padding: 14px 20px 18px;
  background: linear-gradient(180deg, rgba(255,255,255,0.75), #fff 30%);
  border-top: 1px solid #f1f5f9;
}
.toast {
  position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%);
  background: #0f172a; color: #fff; padding: 10px 16px; border-radius: 12px;
  font-size: 13px; font-weight: 600; z-index: 5000; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.25);
}
.toast.error { background: #b91c1c; }
@media (max-width: 720px) { .form-grid { grid-template-columns: 1fr; } }
</style>
