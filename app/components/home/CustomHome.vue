<template>
  <div class="custom-home">
    <a href="/dashboard" class="logo-link">
      <img src="/customlogo.png" alt="Logo" class="center-logo" />
    </a>
  </div>
</template>

<script setup></script>

<style scoped>
.custom-home {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #ffffff;
  margin: 0;
  padding: 0;
}

.center-logo {
  width: 200px;
  height: auto;
  cursor: pointer;
  transition: all 0.2s ease;
}

.center-logo:hover {
  opacity: 0.9;
  transform: scale(1.04);
}
</style>
