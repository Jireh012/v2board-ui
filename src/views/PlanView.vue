<template>
  <div class="plan-page">
    <h1>订阅套餐</h1>
    <p class="hint">以下套餐信息通过 /api/v1/user/plan/fetch 实时获取。</p>
    <div class="plans" v-if="plans.length">
      <div v-for="plan in plans" :key="plan.id" class="plan-card">
        <h2>{{ plan.name }}</h2>
        <p>总流量：{{ formatTraffic(plan.transfer_enable * 1073741824) }}</p>
        <p>月付：￥{{ (plan.month_price || 0) / 100 }}</p>
        <button class="btn" @click="onBuy(plan)">立即购买（月付）</button>
      </div>
    </div>
    <p v-else>暂无可用套餐。</p>
    <p v-if="message" class="message">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchPlans, type Plan } from '../api/plan'
import { createOrder, getPaymentMethods, checkout } from '../api/order'

const plans = ref<Plan[]>([])
const message = ref('')

onMounted(async () => {
  try {
    plans.value = await fetchPlans()
  } catch (e) {
    message.value = e instanceof Error ? e.message : '加载套餐失败'
  }
})

function formatTraffic(bytes: number): string {
  const gb = 1024 * 1024 * 1024
  if (bytes >= gb) return (bytes / gb).toFixed(2) + ' GB'
  const mb = 1024 * 1024
  if (bytes >= mb) return (bytes / mb).toFixed(2) + ' MB'
  return (bytes / 1024).toFixed(2) + ' KB'
}

async function onBuy(plan: Plan) {
  message.value = ''
  try {
    const tradeNo = await createOrder(plan.id, 'month_price')
    const methods = await getPaymentMethods()
    if (!methods.length) {
      message.value = '暂无可用支付方式，订单号：' + tradeNo
      return
    }
    const result = await checkout(tradeNo, methods[0].id)
    message.value = '已创建订单并请求支付，返回结果：' + JSON.stringify(result)
  } catch (e) {
    message.value = e instanceof Error ? e.message : '下单失败'
  }
}
</script>

<style scoped>
.plan-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hint {
  font-size: 13px;
  color: #6b7280;
}

.plans {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.plan-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px 18px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
}

.plan-card h2 {
  margin: 0 0 8px;
  font-size: 16px;
}

.plan-card p {
  margin: 2px 0;
  font-size: 14px;
}

.btn {
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #f9fafb;
  font-size: 14px;
  cursor: pointer;
}

.message {
  margin-top: 10px;
  font-size: 13px;
  color: #374151;
}
</style>

