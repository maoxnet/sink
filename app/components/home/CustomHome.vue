<template>
  <div class="flex-center">
    <a href="/dashboard">
      <img src="/customlogo.png" alt="Logo" class="logo" />
    </a>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.flex-center {
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

.logo {
  width: 200px;
  max-width: 40vw;
  cursor: pointer;
}
</style>
