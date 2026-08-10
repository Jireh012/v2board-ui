<template>
  <div class="site">
    <header class="nav">
      <div class="nav-inner">
        <div class="nav-left">
          <span class="nav-brand">{{ brand }}</span>
          <span class="nav-tag">{{ brandEn }}</span>
        </div>
        <RouterLink class="nav-login" to="/login">成员登录</RouterLink>
      </div>
    </header>

    <section class="hero">
      <div class="hero-atmosphere" aria-hidden="true" />
      <div class="hero-inner">
        <p class="hero-brand reveal">{{ brand }}</p>
        <h1 class="hero-title reveal delay-1">可靠的云上协作与基础设施</h1>
        <p class="hero-lead reveal delay-2">
          我们为企业提供稳健的计算、协同与运维能力，让业务在可预期的环境中持续运行。
        </p>
        <div class="hero-actions reveal delay-3">
          <a class="hero-scroll" href="#capabilities">查看能力</a>
          <RouterLink class="hero-login" to="/login">成员登录</RouterLink>
        </div>
      </div>
    </section>

    <section id="capabilities" class="capabilities">
      <div class="cap-inner">
        <h2 class="cap-heading">核心能力</h2>
        <p class="cap-sub">以工程化交付为先，关注稳定、可观测与长期可维护。</p>
        <ul class="cap-list">
          <li v-for="(item, i) in capabilities" :key="item.title" class="cap-item" :style="{ '--i': i }">
            <h3>{{ item.title }}</h3>
            <p>{{ item.body }}</p>
          </li>
        </ul>
      </div>
    </section>

    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">{{ brand }}</div>
        <div class="footer-links">
          <a class="footer-mail" :href="`mailto:${contactEmail}`">{{ contactEmail }}</a>
          <RouterLink class="footer-login" to="/login">成员登录</RouterLink>
        </div>
        <p class="footer-copy">© {{ year }} {{ brand }}. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'

/** Fixed decoy brand — never surface site app_name / localStorage cache. */
const brand = '苍穹云'
const brandEn = 'Aether Cloud'
const contactEmail = 'hello@aether-cloud.example'
const year = new Date().getFullYear()

const capabilities = [
  {
    title: '弹性计算',
    body: '按业务峰值调度资源，缩短上线周期，保持成本与性能的平衡。'
  },
  {
    title: '协同工作台',
    body: '统一账号与权限边界，让跨团队流程在同一平面上完成协作与审计。'
  },
  {
    title: '运维可见性',
    body: '指标、日志与告警串联，异常可定位、变更可回溯。'
  }
]

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.title = brand
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Sora:wght@400;500;600;700&display=swap');

.site {
  --ink: #0c1f2e;
  --ink-soft: #3d5566;
  --mist: #e8f1f4;
  --foam: #f4fafb;
  --line: rgba(12, 31, 46, 0.1);
  min-height: 100vh;
  margin: 0;
  color: var(--ink);
  background: var(--foam);
  font-family: 'Sora', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  -webkit-font-smoothing: antialiased;
}

.nav {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2;
  padding: 22px 28px;
}

.nav-inner {
  max-width: 1120px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.nav-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
  min-width: 0;
}

.nav-brand {
  font-family: 'Fraunces', 'Songti SC', serif;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #f7fcfb;
}

.nav-tag {
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(247, 252, 251, 0.55);
}

.nav-login {
  flex-shrink: 0;
  color: rgba(247, 252, 251, 0.88);
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid rgba(247, 252, 251, 0.35);
  padding: 8px 14px;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.nav-login:hover {
  background: rgba(247, 252, 251, 0.1);
  border-color: rgba(247, 252, 251, 0.65);
}

.hero {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  color: #f7fcfb;
}

.hero-atmosphere {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(120% 80% at 12% 20%, rgba(56, 178, 172, 0.35), transparent 55%),
    radial-gradient(90% 70% at 88% 10%, rgba(14, 116, 144, 0.4), transparent 50%),
    linear-gradient(160deg, #071820 0%, #0c3340 42%, #123a48 70%, #0a282f 100%);
  animation: atmosphereShift 14s ease-in-out infinite alternate;
}

.hero-atmosphere::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 72px 72px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.55), transparent 78%);
  opacity: 0.7;
}

.hero-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 120px 28px 72px;
}

.hero-brand {
  margin: 0 0 18px;
  font-family: 'Fraunces', 'Songti SC', serif;
  font-size: clamp(3.2rem, 9vw, 6.5rem);
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: -0.04em;
}

.hero-title {
  margin: 0 0 16px;
  max-width: 16ch;
  font-size: clamp(1.35rem, 2.8vw, 1.85rem);
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: -0.02em;
}

.hero-lead {
  margin: 0 0 28px;
  max-width: 36rem;
  font-size: 1.02rem;
  line-height: 1.7;
  color: rgba(247, 252, 251, 0.78);
  font-weight: 400;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 18px 28px;
}

.hero-scroll {
  display: inline-block;
  color: #f7fcfb;
  font-size: 0.92rem;
  font-weight: 600;
  text-decoration: none;
  border-bottom: 1px solid rgba(247, 252, 251, 0.45);
  padding-bottom: 2px;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.hero-scroll:hover {
  border-bottom-color: #f7fcfb;
  transform: translateY(1px);
}

.hero-login {
  display: inline-block;
  color: #071820;
  background: #f7fcfb;
  font-size: 0.92rem;
  font-weight: 600;
  text-decoration: none;
  padding: 10px 18px;
  transition: background 0.2s ease, transform 0.2s ease;
}

.hero-login:hover {
  background: #e2eef1;
  transform: translateY(1px);
}

.reveal {
  opacity: 0;
  transform: translateY(18px);
  animation: riseIn 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.delay-1 { animation-delay: 0.12s; }
.delay-2 { animation-delay: 0.24s; }
.delay-3 { animation-delay: 0.36s; }

.capabilities {
  padding: 88px 28px 96px;
  background:
    linear-gradient(180deg, var(--foam), var(--mist) 55%, #eef5f7);
}

.cap-inner {
  max-width: 1120px;
  margin: 0 auto;
}

.cap-heading {
  margin: 0 0 10px;
  font-family: 'Fraunces', 'Songti SC', serif;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  font-weight: 700;
  letter-spacing: -0.03em;
}

.cap-sub {
  margin: 0 0 40px;
  max-width: 34rem;
  color: var(--ink-soft);
  font-size: 1rem;
  line-height: 1.65;
}

.cap-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  border-top: 1px solid var(--line);
}

.cap-item {
  padding: 28px 24px 8px 0;
  border-right: 1px solid var(--line);
  opacity: 0;
  transform: translateY(12px);
  animation: riseIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: calc(0.08s * var(--i) + 0.15s);
}

.cap-item:last-child {
  border-right: none;
  padding-right: 0;
}

.cap-item h3 {
  margin: 0 0 10px;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.cap-item p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.95rem;
  line-height: 1.7;
  max-width: 28ch;
}

.footer {
  padding: 40px 28px 48px;
  background: var(--ink);
  color: rgba(247, 252, 251, 0.78);
}

.footer-inner {
  max-width: 1120px;
  margin: 0 auto;
  display: grid;
  gap: 10px;
}

.footer-brand {
  font-family: 'Fraunces', 'Songti SC', serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #f7fcfb;
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px 24px;
}

.footer-mail,
.footer-login {
  color: rgba(247, 252, 251, 0.72);
  text-decoration: none;
  font-size: 0.92rem;
  width: fit-content;
}

.footer-mail:hover,
.footer-login:hover {
  color: #f7fcfb;
}

.footer-copy {
  margin: 12px 0 0;
  font-size: 0.8rem;
  color: rgba(247, 252, 251, 0.42);
}

@keyframes riseIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes atmosphereShift {
  from {
    filter: saturate(1) brightness(1);
  }
  to {
    filter: saturate(1.08) brightness(1.05);
  }
}

@media (max-width: 820px) {
  .cap-list {
    grid-template-columns: 1fr;
  }

  .cap-item {
    border-right: none;
    border-bottom: 1px solid var(--line);
    padding: 24px 0;
  }

  .cap-item:last-child {
    border-bottom: none;
  }

  .hero-inner {
    padding-bottom: 56px;
  }
}
</style>
