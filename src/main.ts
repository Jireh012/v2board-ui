import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { loadSiteBrand } from './siteBrand'
import './style.css'

void loadSiteBrand()

const app = createApp(App)
app.use(router)
app.mount('#app')
