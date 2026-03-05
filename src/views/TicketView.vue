<template>
  <div class="ticket-page">
    <div class="header-section animate-fade-in">
      <div class="header-main">
        <h1 class="page-title">工单中心</h1>
        <p class="page-subtitle">遇到网络或账户问题？我们的专业团队随时为您提供技术支持。</p>
      </div>
      <div class="header-actions">
        <button class="btn-primary-premium" @click="showCreate = true">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          发起新工单
        </button>
      </div>
    </div>

    <!-- 过滤器汇总 -->
    <div class="status-summary animate-fade-in delay-100">
       <div class="status-pill active">
          全部工单 <span class="count">{{ tickets.length }}</span>
       </div>
    </div>

    <div v-if="loading && !tickets.length" class="loading-state">
      <div class="spinner"></div>
      <p>正在获取响应记录...</p>
    </div>

    <div v-else-if="tickets.length" class="tickets-grid animate-fade-in delay-200">
      <div v-for="t in tickets" :key="t.id" class="ticket-card" @click="openDetail(t)">
        <div class="t-badge-group">
           <span class="t-id">#{{ t.id }}</span>
           <div class="t-status" :class="statusClass(t.status)">
              {{ statusLabel(t.status) }}
           </div>
        </div>
        
        <h3 class="t-subject">{{ t.subject }}</h3>
        
        <div class="t-meta">
           <div class="t-level" :class="levelClass(t.level)">
              <div class="dot-level"></div>
              {{ levelLabel(t.level) }}优先级
           </div>
           <div class="t-time">
              已同步
           </div>
        </div>

        <div class="t-footer">
           <button class="btn-t-action">查看对话详情</button>
           <button 
             v-if="t.status === 0" 
             class="btn-t-close" 
             @click.stop="handleCloseInList(t)"
           >关闭</button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
       <div class="empty-icon">📂</div>
       <h3>暂无活跃工单</h3>
       <p>目前还没有发起任何技术支持请求。如果您遇到问题，请点击右上角发起工单。</p>
    </div>

    <!-- 新建工单弹窗 -->
    <transition name="modal">
      <div v-if="showCreate" class="modal-mask" @click.self="showCreate = false">
        <div class="modal">
          <div class="modal-header">
            <h3>发起技术支持</h3>
            <button class="close-btn" @click="showCreate = false">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>您遇到了什么问题？</label>
              <input v-model="form.subject" placeholder="简洁描述您的主题 (如: 节点无法连接)" required>
            </div>
            <div class="form-group">
              <label>紧迫程度</label>
              <div class="level-selector">
                 <button class="l-item" :class="{ active: form.level === 1 }" @click="form.level = 1">
                    <div class="dot normal"></div> 一般问题
                 </button>
                 <button class="l-item" :class="{ active: form.level === 2 }" @click="form.level = 2">
                    <div class="dot high"></div> 紧急故障
                 </button>
              </div>
            </div>
            <div class="form-group">
              <label>详细说明</label>
              <textarea v-model="form.message" rows="5" placeholder="请提供报错截图的相关描述或客户端日志，以便我们快速为您定位问题..." required></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showCreate = false">返回</button>
            <button class="btn-confirm" @click="handleCreate" :disabled="creating">
              {{ creating ? '提交中...' : '提交技术反馈' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 工单对话抽屉 -->
    <transition name="drawer">
      <div v-if="detailVisible" class="drawer-mask" @click.self="closeDetail">
        <div class="drawer">
          <div class="drawer-header">
            <div class="d-header-main">
              <div class="d-id">ID: {{ currentTicket?.id }}</div>
              <h3 class="d-title">{{ currentTicket?.subject }}</h3>
            </div>
            <button class="d-close-btn" @click="closeDetail">×</button>
          </div>
          
          <div class="drawer-body" ref="messageBox">
            <div v-if="detailLoading" class="loading-mini">同步对话中...</div>
            <div v-else class="chat-container">
              <div 
                v-for="m in currentTicket?.message" 
                :key="m.id" 
                class="chat-row"
                :class="{ 'row-user': m.is_me }"
              >
                <div class="chat-avatar">
                   {{ m.is_me ? 'U' : 'S' }}
                </div>
                <div class="chat-bubble-group">
                   <div class="chat-name">{{ m.is_me ? '我的提问' : '技术官' }}</div>
                   <div class="chat-bubble">
                      <div class="chat-text">{{ m.message }}</div>
                      <div class="chat-time">{{ formatTime(m.created_at) }}</div>
                   </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="currentTicket?.status === 0" class="drawer-footer">
            <div class="reply-input-area">
               <textarea 
                 v-model="replyContent" 
                 placeholder="在这里输入您的追问内容..." 
                 @keydown.enter.ctrl="handleReply"
               ></textarea>
               <div class="reply-actions">
                  <button class="btn-reply-close" @click="handleCloseTicket" :disabled="closing">关闭工单</button>
                  <button class="btn-reply-send" @click="handleReply" :disabled="replying || !replyContent">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                     {{ replying ? '发送中' : '发送回复' }}
                  </button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <p v-if="message" class="toast" :class="{ error: isError }">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, nextTick } from 'vue'
import { 
  fetchTickets, fetchTicketDetail, saveTicket, replyTicket, closeTicket, type Ticket 
} from '../api/ticket'

const tickets = ref<Ticket[]>([])
const loading = ref(false), showCreate = ref(false), creating = ref(false)
const message = ref(''), isError = ref(false), detailVisible = ref(false), detailLoading = ref(false)
const currentTicket = ref<Ticket | null>(null), replyContent = ref(''), replying = ref(false), closing = ref(false)
const messageBox = ref<HTMLElement | null>(null)
const form = reactive({ subject: '', level: 1, message: '' })

async function loadTickets() {
  loading.value = true; try { tickets.value = await fetchTickets() } finally { loading.value = false }
}

async function handleCreate() {
  if (!form.subject || !form.message) return showMessage('请完善反馈内容', true)
  creating.value = true
  try {
    await saveTicket(form); showMessage('工单已成功开启'); showCreate.value = false
    form.subject = ''; form.message = ''; await loadTickets()
  } catch (e: any) { showMessage(e.message || '提交失败', true) }
  finally { creating.value = false }
}

async function openDetail(t: Ticket) {
  currentTicket.value = t; detailVisible.value = true; detailLoading.value = true
  try {
    const full = await fetchTicketDetail(t.id); currentTicket.value = full
    nextTick(() => scrollToBottom())
  } finally { detailLoading.value = false }
}

async function handleReply() {
  if (!currentTicket.value || !replyContent.value) return
  replying.value = true
  try {
    await replyTicket(currentTicket.value.id, replyContent.value); replyContent.value = ''
    const full = await fetchTicketDetail(currentTicket.value.id); currentTicket.value = full
    nextTick(() => scrollToBottom())
  } catch (e: any) { showMessage(e.message || '回复失败', true) }
  finally { replying.value = false }
}

async function handleCloseTicket() {
  if (!currentTicket.value || !confirm('确认标记此工单为已解决？')) return
  closing.value = true
  try { await closeTicket(currentTicket.value.id); showMessage('工单已解决'); await loadTickets(); closeDetail() }
  finally { closing.value = false }
}

async function handleCloseInList(t: Ticket) {
  if (!confirm('确定关闭？')) return
  try { await closeTicket(t.id); showMessage('工单已关闭'); await loadTickets() } catch { showMessage('操作失败', true) }
}

const showMessage = (msg: string, error = false) => { message.value = msg; isError.value = error; setTimeout(() => { if (message.value === msg) message.value = ''}, 3000) }
const statusLabel = (s: number|undefined) => s === 0 ? '解决中' : '已结案'
const statusClass = (s: number|undefined) => s === 0 ? 's-active' : 's-closed'
const levelLabel = (l: number) => l === 1 ? '常规' : '极速'
const levelClass = (l: number) => l === 1 ? 'l-normal' : 'l-high'
const formatTime = (ts: number) => new Date(ts * 1000).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
const closeDetail = () => { detailVisible.value = false; currentTicket.value = null; replyContent.value = '' }
const scrollToBottom = () => { if (messageBox.value) messageBox.value.scrollTop = messageBox.value.scrollHeight }

onMounted(loadTickets)
</script>

<style scoped>
.ticket-page { max-width: 1100px; margin: 0 auto; }
.header-section { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
.page-title { font-size: 32px; font-weight: 800; color: var(--text-main); margin-bottom: 8px; }
.page-subtitle { font-size: 16px; color: var(--text-muted); }

.btn-primary-premium {
  display: flex; align-items: center; gap: 10px; padding: 12px 24px;
  background: var(--primary-color); color: white; border: none; border-radius: 12px;
  font-weight: 700; cursor: pointer; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.25);
  transition: transform 0.2s;
}
.btn-primary-premium:hover { transform: translateY(-2px); }

.status-summary { margin-bottom: 24px; }
.status-pill {
  display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px;
  background: white; border: 1px solid var(--border-color); border-radius: 99px;
  font-size: 13px; font-weight: 700; color: #64748b;
}
.status-pill .count { min-width: 20px; height: 18px; background: #f1f5f9; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 11px; }

.tickets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }

.ticket-card {
  background: white; border-radius: 20px; border: 1px solid var(--border-color);
  padding: 24px; cursor: pointer; transition: all 0.2s; box-shadow: var(--shadow-sm);
}
.ticket-card:hover { border-color: #cbd5e1; box-shadow: var(--shadow-md); transform: translateY(-2px); }

.t-badge-group { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.t-id { font-size: 11px; font-weight: 800; color: #94a3b8; }
.t-status { font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px; }
.t-status.s-active { background: #ecfdf5; color: #10b981; }
.t-status.s-closed { background: #f1f5f9; color: #94a3b8; }

.t-subject { font-size: 16px; font-weight: 800; color: var(--text-main); margin: 0 0 16px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.t-meta { display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 12px; font-weight: 700; }
.t-level { display: flex; align-items: center; gap: 6px; }
.dot-level { width: 6px; height: 6px; border-radius: 50%; }
.l-normal { color: #2563eb; } .l-normal .dot-level { background: #2563eb; }
.l-high { color: #ef4444; } .l-high .dot-level { background: #ef4444; }
.t-time { color: #94a3b8; }

.t-footer { display: flex; gap: 12px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
.btn-t-action { flex: 1; border: none; background: #f8fafc; color: #475569; font-weight: 700; padding: 8px; border-radius: 8px; font-size: 12px; cursor: pointer; }
.btn-t-close { background: none; border: none; color: #94a3b8; font-weight: 700; font-size: 12px; padding: 0 8px; cursor: pointer; }

/* Modal New */
.modal-mask { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.modal { width: 90%; max-width: 500px; background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden; }
.modal-header { padding: 24px 32px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
.close-btn { background: none; border: none; font-size: 28px; color: #94a3b8; }
.modal-body { padding: 32px; display: flex; flex-direction: column; gap: 24px; }
.form-group label { font-size: 13px; font-weight: 800; color: var(--text-main); margin-bottom: 8px; display: block; }
.form-group input, .form-group textarea { width: 100%; padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 14px; font-weight: 600; box-sizing: border-box; }
.level-selector { display: flex; gap: 12px; }
.l-item { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; font-weight: 700; color: #64748b; cursor: pointer; }
.l-item.active { background: white; border-color: var(--primary-color); color: var(--text-main); box-shadow: var(--shadow-sm); }
.dot { width: 8px; height: 8px; border-radius: 50%; }
.dot.normal { background: #2563eb; } .dot.high { background: #ef4444; }
.modal-footer { padding: 20px 32px; background: #f8fafc; display: flex; justify-content: flex-end; gap: 12px; }
.btn-cancel { background: none; border: none; color: #64748b; font-weight: 700; cursor: pointer; }
.btn-confirm { padding: 12px 24px; background: var(--text-main); color: white; border: none; border-radius: 12px; font-weight: 700; }

/* Drawer Chat */
.drawer-mask { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); display: flex; justify-content: flex-end; z-index: 1200; }
.drawer { width: 560px; max-width: 100%; background: white; height: 100%; display: flex; flex-direction: column; box-shadow: -20px 0 50px rgba(0,0,0,0.1); }
.drawer-header { padding: 28px 32px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: flex-start; }
.d-id { font-size: 11px; font-weight: 800; color: #94a3b8; margin-bottom: 4px; }
.d-title { font-size: 18px; font-weight: 800; color: var(--text-main); line-height: 1.4; }
.d-close-btn { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 8px; color: #64748b; font-size: 20px; cursor: pointer; }

.drawer-body { flex: 1; overflow-y: auto; padding: 32px; background: #f8fafc; }
.chat-container { display: flex; flex-direction: column; gap: 24px; }
.chat-row { display: flex; gap: 16px; }
.chat-avatar { width: 36px; height: 36px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #475569; font-size: 14px; flex-shrink: 0; }
.chat-row.row-user { flex-direction: row-reverse; }
.chat-row.row-user .chat-avatar { background: #eff6ff; color: var(--primary-color); }
.chat-bubble-group { flex: 1; min-width: 0; }
.row-user .chat-bubble-group { display: flex; flex-direction: column; align-items: flex-end; }
.chat-name { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px; margin-left: 4px; }
.row-user .chat-name { margin-left: 0; margin-right: 4px; }
.chat-bubble { background: white; padding: 14px 18px; border-radius: 0 16px 16px 16px; box-shadow: var(--shadow-sm); border: 1px solid #f1f5f9; max-width: 90%; }
.row-user .chat-bubble { background: var(--primary-color); color: white; border-radius: 16px 0 16px 16px; border: none; }
.chat-text { font-size: 14px; line-height: 1.6; word-break: break-all; white-space: pre-wrap; }
.chat-time { font-size: 10px; font-weight: 700; opacity: 0.5; margin-top: 8px; text-align: right; }

.drawer-footer { padding: 24px 32px; border-top: 1px solid #f1f5f9; background: white; }
.reply-input-area textarea { width: 100%; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; font-size: 14px; font-weight: 600; resize: none; min-height: 80px; margin-bottom: 16px; box-sizing: border-box; }
.reply-input-area textarea:focus { outline: none; border-color: var(--primary-color); }
.reply-actions { display: flex; justify-content: space-between; }
.btn-reply-close { background: none; border: none; color: #94a3b8; font-weight: 700; font-size: 13px; cursor: pointer; }
.btn-reply-send { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: var(--text-main); color: white; border: none; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; }

.toast { position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%); background: #1e293b; color: white; padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 700; z-index: 3000; }
.toast.error { background: #ef4444; }
.spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state { padding: 80px 40px; text-align: center; background: white; border-radius: 24px; border: 2px dashed var(--border-color); }
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; opacity: 0; }
.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.modal-enter-active, .modal-leave-active { transition: opacity 0.3s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.drawer-enter-active, .drawer-leave-active { transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.drawer-enter-from, .drawer-leave-to { transform: translateX(100%); }
</style>
