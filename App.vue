<template>
  <div class="h-screen grid grid-cols-[1fr_400px]">
    <div class="border-r border-gray-300">
      <WorkflowCanvas />
    </div>
    <div class="bg-gray-50 p-4 overflow-y-auto">
      <ChatbotPanel />
    </div>
  </div>
</template>

<script setup>
import WorkflowCanvas from './components/WorkflowCanvas.vue'
import ChatbotPanel from './components/ChatbotPanel.vue'
</script>

