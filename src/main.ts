import { createApp } from 'vue'
import App from './App.vue'
import { loadSiteBrand } from './siteBrand'
import './style.css'

async function bootstrap() {
  await loadSiteBrand()
  const { default: router } = await import('./router')
  const app = createApp(App)
  app.use(router)
  app.mount('#app')
}

void bootstrap()
