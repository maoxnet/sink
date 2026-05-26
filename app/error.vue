<script setup lang="ts">
const props = defineProps<{
  error: {
    statusCode?: number
    statusMessage?: string
  }
}>()

const is404 = props.error.statusCode === 404

const countdown = ref(3)
const tip = ref('3 秒后自动跳转至京东红包领取页面，祝您中大奖！！！')

if (is404) {
  const timer = setInterval(() => {
    countdown.value--
    tip.value = `该商品的活动已结束，${countdown.value} 秒后自动跳转至京东红包领取页面，祝您中大奖！！！`

    if (countdown.value <= 0) {
      clearInterval(timer)
      window.location.href = 'https://kzurl10.cn/t2z8oz'
    }
  }, 1000)
}
</script>

<template>
  <div v-if="is404" class="expired-container">
    <div class="content">
      <h1 class="title">该商品的活动已结束</h1>
      <p class="countdown">{{ tip }}</p>
    </div>
  </div>

  <div v-else style="padding: 2rem; text-align: center;">
    <h1>页面出错了</h1>
    <p>{{ error.statusMessage }}</p>
  </div>
</template>

<style scoped>
.expired-container {
  width: 100vw;
  height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.logo {
  width: 180px;
  max-width: 40vw;
  margin-bottom: 10px;
}

.title {
  font-size: 20px;
  color: #333;
  margin: 0;
}

.countdown {
  font-size: 16px;
  color: #666;
  margin: 0;
}
</style>
