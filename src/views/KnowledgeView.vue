<template>
  <div class="knowledge-page">
    <div class="header-section animate-fade-in">
      <div class="header-main">
        <h1 class="page-title">使用文档</h1>
        <p class="page-subtitle">从各平台客户端配置到常见问题解决，您需要的一切指南都在这里。</p>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-area animate-fade-in delay-100">
      <div class="search-container">
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          v-model="keyword"
          class="search-input"
          type="text"
          placeholder="寻找您需要的教程或解决方案..."
          @keyup.enter="loadList"
        />
        <button class="search-btn" @click="loadList">搜索指南</button>
      </div>
    </div>

    <div v-if="categories.length" class="knowledge-grid animate-fade-in delay-200">
      <div
        v-for="cat in categories"
        :key="cat.name"
        class="category-group"
      >
        <div class="category-header">
           <div class="cat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/><path d="M8 6h10"/><path d="M8 10h10"/><path d="M8 14h10"/></svg>
           </div>
           <h2 class="category-name">{{ cat.name || '通用指南' }}</h2>
        </div>
        
        <div class="article-stack">
          <div
            v-for="item in cat.items"
            :key="item.id"
            class="article-card"
            :class="{ active: item.id === currentId }"
            @click="openArticle(item.id)"
          >
            <div class="a-info">
               <span class="a-title">{{ item.title }}</span>
               <span class="a-date">更新于 {{ formatDate(item.updated_at) }}</span>
            </div>
            <div class="a-arrow">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
       <div class="empty-icon">📚</div>
       <h3>暂无相关文档</h3>
       <p>找不到您需要的教程？请尝试更换关键词搜索，或提交工单咨询。</p>
    </div>

    <!-- 文章详情抽屉 -->
    <Teleport to="body">
      <Transition name="drawer">
        <div v-if="currentId !== null" class="drawer-mask" @click.self="closeModal">
          <div class="drawer">
            <div class="drawer-header">
              <div class="d-header-top">
                 <button class="d-back-btn" @click="closeModal">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    返回列表
                 </button>
                 <button class="d-close-x" @click="closeModal">×</button>
              </div>
              <h2 v-if="currentArticle" class="d-title">{{ currentArticle.title }}</h2>
              <div class="d-meta" v-if="currentArticle">
                 <span>最后修改: {{ formatDate(currentArticle.updated_at) }}</span>
                 <span class="dot">·</span>
                 <span>官方阅读</span>
              </div>
            </div>
            
            <div class="drawer-body">
              <div v-if="loadingDetail" class="loading-full">
                 <div class="spinner"></div>
                 <p>正在拉取文档详情...</p>
              </div>
              <div v-else-if="currentArticle" class="article-container">
                <article class="prose" v-html="currentArticle.body"></article>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { request } from '../api/http'

interface KnowledgeItem { id: number; title: string; category: string | null; updated_at: number; body?: string }
interface CategoryGroup { name: string; items: KnowledgeItem[] }

const categories = ref<CategoryGroup[]>([])
const currentArticle = ref<KnowledgeItem | null>(null)
const currentId = ref<number | null>(null)
const loadingDetail = ref(false), keyword = ref('')

async function loadList() {
  try {
    const data = await request<Record<string, KnowledgeItem[]>>('/api/v1/user/knowledge/fetch' + (keyword.value ? `?keyword=${encodeURIComponent(keyword.value)}` : ''))
    categories.value = Object.entries(data).map(([name, items]) => ({ name, items: items.sort((a, b) => b.updated_at - a.updated_at) }))
    currentId.value = null; currentArticle.value = null
  } catch { categories.value = [] }
}

async function openArticle(id: number) {
  currentId.value = id; loadingDetail.value = true; currentArticle.value = null
  try { currentArticle.value = await request<KnowledgeItem>(`/api/v1/user/knowledge/fetch?id=${id}`) }
  finally { loadingDetail.value = false }
}

const closeModal = () => { currentArticle.value = null; currentId.value = null }
const formatDate = (ts: number) => ts ? new Date(ts * 1000).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) : ''
const onKeydown = (e: KeyboardEvent) => { if (e.key === 'Escape' && currentId.value !== null) closeModal() }

onMounted(() => { loadList(); window.addEventListener('keydown', onKeydown) })
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.knowledge-page { max-width: 1000px; margin: 0 auto; }
.header-section { margin-bottom: 32px; }
.page-title { font-size: 32px; font-weight: 800; color: var(--text-main); margin-bottom: 8px; }
.page-subtitle { font-size: 16px; color: var(--text-muted); }

.search-area { margin-bottom: 40px; }
.search-container {
  display: flex; align-items: center; background: white; border: 1px solid var(--border-color);
  padding: 8px; border-radius: 16px; box-shadow: var(--shadow-sm); transition: border-color 0.2s;
}
.search-container:focus-within { border-color: var(--primary-color); }
.search-icon { margin-left: 12px; color: #94a3b8; }
.search-input {
  flex: 1; border: none; padding: 10px 16px; font-size: 15px; font-weight: 600; color: var(--text-main); outline: none;
}
.search-btn {
  padding: 10px 24px; background: var(--text-main); color: white; border: none; border-radius: 12px;
  font-size: 14px; font-weight: 700; cursor: pointer;
}

.knowledge-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 32px; }

.category-group { display: flex; flex-direction: column; gap: 16px; }
.category-header { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
.cat-icon { width: 36px; height: 36px; background: #eff6ff; color: var(--primary-color); border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.category-name { font-size: 18px; font-weight: 800; color: var(--text-main); margin: 0; }

.article-stack { display: flex; flex-direction: column; gap: 12px; }
.article-card {
  background: white; border: 1px solid var(--border-color); border-radius: 16px; padding: 16px 20px;
  display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: all 0.2s;
}
.article-card:hover { border-color: #cbd5e1; box-shadow: var(--shadow-sm); transform: translateX(4px); }
.a-info { display: flex; flex-direction: column; gap: 4px; }
.a-title { font-size: 15px; font-weight: 700; color: var(--text-main); }
.a-date { font-size: 12px; font-weight: 700; color: #94a3b8; }
.a-arrow { color: #cbd5e1; transition: color 0.2s; }
.article-card:hover .a-arrow { color: var(--primary-color); }

/* Drawer Read */
.drawer-mask { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(8px); display: flex; justify-content: flex-end; z-index: 2000; }
.drawer { width: 860px; max-width: 100%; background: white; height: 100vh; display: flex; flex-direction: column; box-shadow: -20px 0 50px rgba(0,0,0,0.2); }
.drawer-header { padding: 40px 60px 24px; border-bottom: 1px solid #f1f5f9; }
.d-header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
.d-back-btn { display: flex; align-items: center; gap: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 99px; padding: 6px 16px; font-size: 13px; font-weight: 700; color: #64748b; cursor: pointer; }
.d-close-x { background: none; border: none; font-size: 28px; color: #cbd5e1; cursor: pointer; line-height: 1; }
.d-title { font-size: 28px; font-weight: 800; color: var(--text-main); margin-bottom: 12px; line-height: 1.3; }
.d-meta { font-size: 13px; font-weight: 700; color: #94a3b8; display: flex; align-items: center; gap: 8px; }

.drawer-body { flex: 1; overflow-y: auto; padding: 40px 60px 80px; }
.article-container { max-width: 740px; margin: 0 auto; }
.prose { font-size: 16px; line-height: 1.8; color: #334155; }
.prose :deep(h2) { font-size: 22px; font-weight: 800; color: var(--text-main); margin: 40px 0 20px; }
.prose :deep(p) { margin-bottom: 24px; }
.prose :deep(code) { background: #f1f5f9; padding: 2px 6px; border-radius: 6px; font-weight: 700; color: var(--primary-color); font-size: 0.9em; }
.prose :deep(pre) { background: #1e293b; color: white; padding: 20px; border-radius: 12px; overflow-x: auto; margin: 24px 0; }

.loading-full { padding: 100px 0; text-align: center; }
.spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state { padding: 80px 40px; text-align: center; background: white; border-radius: 24px; border: 2px dashed var(--border-color); grid-column: 1 / -1; }

.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; opacity: 0; }
.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.drawer-enter-active, .drawer-leave-active { transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.drawer-enter-from, .drawer-leave-to { transform: translateX(100%); }

@media (max-width: 800px) { .drawer-header, .drawer-body { padding-left: 24px; padding-right: 24px; } .knowledge-grid { grid-template-columns: 1fr; } }
</style>
