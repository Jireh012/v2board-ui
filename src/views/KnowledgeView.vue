<template>
  <div class="knowledge-page">
    <!-- 顶部搜索栏 -->
    <div class="search-bar">
      <input
        v-model="keyword"
        class="search-input"
        type="text"
        placeholder="搜索文档"
        @keyup.enter="loadList"
      />
      <button class="search-btn" @click="loadList" type="button" aria-label="搜索">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      </button>
    </div>

    <!-- 单列：分类卡片垂直堆叠 -->
    <div class="category-cards" v-if="categories.length">
      <div
        v-for="cat in categories"
        :key="cat.name"
        class="category-card"
      >
        <h2 class="category-title">{{ cat.name || '未分类' }}</h2>
        <ul class="article-list">
          <li
            v-for="item in cat.items"
            :key="item.id"
            class="article-item"
          >
            <button
              class="article-link"
              :class="{ active: item.id === currentId }"
              @click="openArticle(item.id)"
            >
              <span class="article-title-text">{{ item.title }}</span>
              <span class="article-date">最后更新: {{ formatDate(item.updated_at) }}</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
    <p v-else class="empty">暂无文档。</p>

    <!-- 文章详情侧拉抽屉 -->
    <Teleport to="body">
      <Transition name="drawer">
        <div
          v-if="currentId !== null"
          class="drawer-overlay"
          @click.self="closeModal"
        >
          <div class="drawer-panel">
            <div class="drawer-header">
              <h2 v-if="currentArticle" class="drawer-title">{{ currentArticle.title }}</h2>
              <span v-else class="drawer-title-placeholder">文档</span>
              <button
                class="drawer-close"
                type="button"
                aria-label="关闭"
                @click="closeModal"
              >
                ×
              </button>
            </div>
            <div class="drawer-body">
              <div v-if="loadingDetail" class="content-loading">
                正在加载文档内容...
              </div>
              <div v-else-if="currentArticle" class="content-inner">
                <div class="article-meta">
                  最后更新: {{ formatDate(currentArticle.updated_at) }}
                </div>
                <div
                  class="article-body"
                  v-html="currentArticle.body"
                ></div>
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

interface KnowledgeItem {
  id: number
  title: string
  category: string | null
  updated_at: number
  body?: string
}

interface CategoryGroup {
  name: string
  items: KnowledgeItem[]
}

const categories = ref<CategoryGroup[]>([])
const currentArticle = ref<KnowledgeItem | null>(null)
const currentId = ref<number | null>(null)
const loadingDetail = ref(false)
const keyword = ref('')

async function loadList() {
  try {
    const data = await request<Record<string, KnowledgeItem[]>>(
      '/api/v1/user/knowledge/fetch' +
        (keyword.value ? `?keyword=${encodeURIComponent(keyword.value)}` : '')
    )
    const groups: CategoryGroup[] = Object.entries(data).map(
      ([name, items]) => ({
        name,
        items: items.sort((a, b) => b.updated_at - a.updated_at),
      })
    )
    categories.value = groups
    currentId.value = null
    currentArticle.value = null
  } catch {
    categories.value = []
  }
}

async function openArticle(id: number) {
  currentId.value = id
  loadingDetail.value = true
  currentArticle.value = null
  try {
    const article = await request<KnowledgeItem>(
      `/api/v1/user/knowledge/fetch?id=${id}`
    )
    currentArticle.value = article
  } catch {
    currentArticle.value = null
  } finally {
    loadingDetail.value = false
  }
}

function closeModal() {
  currentArticle.value = null
  currentId.value = null
}

function formatDate(ts: number): string {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}/${m}/${day}`
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && currentId.value !== null) closeModal()
}

onMounted(() => {
  loadList()
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.knowledge-page {
  width: 100%;
  padding: 24px 16px;
  background: #f8fafd;
  min-height: 100%;
  box-sizing: border-box;
}

/* 顶部搜索栏：输入框+蓝色搜索按钮 */
.search-bar {
  display: flex;
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-right: none;
  border-radius: 8px 0 0 8px;
  font-size: 14px;
  outline: none;
}

.search-input::placeholder {
  color: #9ca3af;
}

.search-btn {
  padding: 12px 20px;
  border: none;
  background: #2563eb;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  border-radius: 0 8px 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-icon {
  width: 20px;
  height: 20px;
  display: block;
}

/* 分类卡片：白底、阴影、垂直堆叠 */
.category-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-card {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  padding: 20px 20px 16px;
}

.category-title {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.article-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.article-item {
  margin-bottom: 4px;
}

.article-item:last-child {
  margin-bottom: 0;
}

.article-link {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  padding: 10px 0;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s;
}

.article-link:hover {
  background: #f3f4f6;
}

.article-link.active {
  background: #eff6ff;
}

.article-title-text {
  font-size: 14px;
  font-weight: 400;
  color: #374151;
}

.article-link.active .article-title-text {
  color: #1d4ed8;
}

.article-date {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.empty {
  font-size: 14px;
  color: #9ca3af;
  text-align: center;
  padding: 40px 0;
}

/* 文章详情侧拉抽屉 */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  box-sizing: border-box;
}

.drawer-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 90%;
  max-width: 980px;
  height: 100vh;
  background: #ffffff;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer-header {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

.drawer-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
  flex: 1;
  min-width: 0;
}

.drawer-title-placeholder {
  font-size: 18px;
  font-weight: 600;
  color: #9ca3af;
  flex: 1;
}

.drawer-close {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}

.drawer-close:hover {
  background: #e5e7eb;
  color: #111827;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.drawer-body .content-loading,
.drawer-body .content-inner {
  padding: 24px;
}

.content-loading {
  font-size: 14px;
  color: #6b7280;
}

.content-inner {
  font-size: 14px;
  color: #111827;
}

.article-meta {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 16px;
}

.article-body :deep(p) {
  margin: 0 0 10px;
  line-height: 1.6;
}

.article-body :deep(h1),
.article-body :deep(h2),
.article-body :deep(h3) {
  margin-top: 16px;
  margin-bottom: 8px;
}

/* 侧拉抽屉过渡 */
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.25s ease;
}
.drawer-enter-active .drawer-panel,
.drawer-leave-active .drawer-panel {
  transition: transform 0.25s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
.drawer-enter-from .drawer-panel,
.drawer-leave-to .drawer-panel {
  transform: translateX(100%);
}
</style>
