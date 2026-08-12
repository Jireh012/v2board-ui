<template>
  <div class="kb-editor">
    <div class="kb-toolbar">
      <div class="kb-tabs" role="tablist">
        <button
          type="button"
          class="kb-tab"
          :class="{ active: mode === 'edit' }"
          @click="switchMode('edit')"
        >
          编辑
        </button>
        <button
          type="button"
          class="kb-tab"
          :class="{ active: mode === 'preview' }"
          @click="switchMode('preview')"
        >
          预览
        </button>
      </div>
      <div v-show="mode === 'edit'" class="kb-inserts">
        <button type="button" class="kb-chip" @click="insertPlaceholder('{{subscribeUrl}}')">
          插入订阅地址
        </button>
        <button type="button" class="kb-chip" @click="insertCopyButton">
          插入复制按钮
        </button>
        <button type="button" class="kb-chip" @click="insertPlaceholder('{{siteName}}')">
          站点名
        </button>
      </div>
    </div>

    <!-- Keep TinyMCE mounted; remounting after preview causes Vue insertBefore errors -->
    <div v-show="mode === 'edit'" class="kb-edit-pane">
      <Editor
        v-model="inner"
        license-key="gpl"
        :init="editorInit"
        @init="onEditorInit"
      />
    </div>

    <div v-show="mode === 'preview'" class="kb-preview-pane prose" v-html="previewHtml"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import Editor from '@tinymce/tinymce-vue'
import type { Editor as TinyMCEEditor } from 'tinymce'

import 'tinymce/tinymce'
import 'tinymce/icons/default'
import 'tinymce/themes/silver'
import 'tinymce/models/dom'
import 'tinymce/plugins/lists'
import 'tinymce/plugins/link'
import 'tinymce/plugins/image'
import 'tinymce/plugins/table'
import 'tinymce/plugins/code'
import 'tinymce/plugins/codesample'
import 'tinymce/plugins/fullscreen'
import 'tinymce/skins/ui/oxide/skin.min.css'
import 'tinymce/skins/ui/oxide/content.min.css'
import 'tinymce/skins/content/default/content.min.css'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const mode = ref<'edit' | 'preview'>('edit')
const editorRef = ref<TinyMCEEditor | null>(null)

const inner = computed({
  get: () => props.modelValue ?? '',
  set: (v: string) => emit('update:modelValue', v ?? '')
})

const SAMPLE = {
  siteName: '示例站点',
  subscribeUrl: 'https://example.com/s/demo-token',
  subscribeToken: 'demo-token',
  urlEncodeSubscribeUrl: encodeURIComponent('https://example.com/s/demo-token'),
  safeBase64SubscribeUrl: btoa('https://example.com/s/demo-token')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

const previewHtml = computed(() => {
  let html = props.modelValue || '<p class="kb-preview-empty">暂无正文</p>'
  html = html
    .replaceAll('{{siteName}}', SAMPLE.siteName)
    .replaceAll('{{subscribeUrl}}', SAMPLE.subscribeUrl)
    .replaceAll('{{urlEncodeSubscribeUrl}}', SAMPLE.urlEncodeSubscribeUrl)
    .replaceAll('{{safeBase64SubscribeUrl}}', SAMPLE.safeBase64SubscribeUrl)
    .replaceAll('{{subscribeToken}}', SAMPLE.subscribeToken)
  return html
})

const editorInit = {
  height: 460,
  menubar: false,
  branding: false,
  promotion: false,
  plugins: 'lists link image table code codesample fullscreen',
  toolbar:
    'undo redo | blocks | bold italic underline forecolor | alignleft aligncenter alignright | bullist numlist | link image table | codesample code | fullscreen',
  skin: false,
  content_css: false,
  convert_urls: false,
  relative_urls: false,
  remove_script_host: false,
  verify_html: false,
  extended_valid_elements:
    'a[href|target|rel|class|id|style|onclick|title],img[src|alt|title|width|height|class|style],button[type|class|style|onclick],div[class|style|id],span[class|style|id],p[class|style],h1[class|style],h2[class|style],h3[class|style],pre[class|style],code[class|style]',
  content_style:
    'body { font-family: system-ui, -apple-system, sans-serif; font-size: 15px; line-height: 1.7; color: #334155; }' +
    ' img { max-width: 100%; height: auto; }' +
    ' a.btn, a.btn-hero-primary { display: inline-block; padding: 10px 16px; background: #0f172a; color: #fff !important; border-radius: 8px; text-decoration: none; }'
}

function onEditorInit(_evt: unknown, editor: TinyMCEEditor) {
  editorRef.value = editor
}

function flushEditor() {
  const ed = editorRef.value
  if (!ed || ed.removed) return
  // Ensure latest iframe content is written back before preview.
  ed.save()
  emit('update:modelValue', ed.getContent() ?? '')
}

async function switchMode(next: 'edit' | 'preview') {
  if (next === mode.value) return
  if (next === 'preview') {
    flushEditor()
  }
  mode.value = next
  if (next === 'edit') {
    await nextTick()
    const ed = editorRef.value
    if (ed && !ed.removed) {
      // TinyMCE can mis-measure when shown again after display:none
      ed.dispatch('ResizeEditor')
      ed.focus()
    }
  }
}

function insertPlaceholder(text: string) {
  const ed = editorRef.value
  if (ed && !ed.removed) {
    ed.focus()
    ed.insertContent(text)
    return
  }
  emit('update:modelValue', `${props.modelValue || ''}${text}`)
}

function insertCopyButton() {
  const html =
    `<p><a class="btn btn-hero-primary" href="javascript:void(0)" onclick="copy('{{subscribeUrl}}')">点这里复制订阅地址</a></p>`
  const ed = editorRef.value
  if (ed && !ed.removed) {
    ed.focus()
    ed.insertContent(html)
    return
  }
  emit('update:modelValue', `${props.modelValue || ''}${html}`)
}
</script>

<style scoped>
.kb-editor {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}
.kb-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}
.kb-tabs {
  display: flex;
  gap: 6px;
}
.kb-tab {
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  border-radius: 8px;
  padding: 5px 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.kb-tab.active {
  border-color: #2563eb;
  color: #2563eb;
  background: #eff6ff;
}
.kb-inserts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.kb-chip {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.kb-chip:hover {
  border-color: #94a3b8;
}
.kb-edit-pane :deep(.tox-tinymce) {
  border: none !important;
  border-radius: 0 !important;
}
.kb-preview-pane {
  min-height: 420px;
  max-height: 560px;
  overflow: auto;
  padding: 20px 24px;
  font-size: 15px;
  line-height: 1.75;
  color: #334155;
}
.kb-preview-pane :deep(img) {
  max-width: 100%;
  height: auto;
}
.kb-preview-pane :deep(a.btn),
.kb-preview-pane :deep(a.btn-hero-primary) {
  display: inline-block;
  padding: 10px 16px;
  background: #0f172a;
  color: #fff !important;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
}
.kb-preview-pane :deep(.kb-preview-empty) {
  color: #94a3b8;
}
</style>
