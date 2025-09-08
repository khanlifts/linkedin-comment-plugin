<template>
  <div class="popup">
    <h2>LinkedIn Comment Plugin</h2>
    <n-space vertical>
      <div class="switch-item">
        <label>Hide Feed Updates</label>
        <n-switch 
          v-model:value="hiddenMode" 
          @update:value="toggleClass('myext-hidden-mode', $event)"
        />
      </div>
      <div class="switch-item">
        <label>Hide Messages</label>
        <n-switch 
          v-model:value="hideMessages" 
          @update:value="toggleClass('myext-hide-messages', $event)"
        />
      </div>
      <div class="switch-item">
        <label>Hide Notifications</label>
        <n-switch 
          v-model:value="hideNotifications" 
          @update:value="toggleClass('myext-hide-notifications', $event)"
        />
      </div>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NSwitch, NSpace } from 'naive-ui'

// Reactive state for each switch
const hiddenMode = ref(false)
const hideMessages = ref(false)
const hideNotifications = ref(false)

// Function to send message to content script
const toggleClass = async (className: string, status: boolean) => {
  console.log('status', status);
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    
    if (tab?.id) {
      // Send message to content script
      await chrome.tabs.sendMessage(tab.id, {
        type: 'TOGGLE_CLASS',
        className: className,
        status: status
      })
    }
  } catch (error) {
    console.error('Error sending message to content script:', error)
    // Reset the switch state if message failed
    if (className === 'myext-hidden-mode') hiddenMode.value = !status
    if (className === 'myext-hide-messages') hideMessages.value = !status
    if (className === 'myext-hide-notifications') hideNotifications.value = !status
  }
}

// Optional: Read current state from DOM on mount
onMounted(async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    
    if (tab?.id) {
      // Execute script to check current classes
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return {
            hiddenMode: document.body.classList.contains('myext-hidden-mode'),
            hideMessages: document.body.classList.contains('myext-hide-messages'),
            hideNotifications: document.body.classList.contains('myext-hide-notifications')
          }
        }
      })
      
      if (results[0]?.result) {
        const { hiddenMode: hm, hideMessages: hm2, hideNotifications: hn } = results[0].result
        hiddenMode.value = hm
        hideMessages.value = hm2
        hideNotifications.value = hn
      }
    }
  } catch (error) {
    console.error('Error reading current state:', error)
  }
})
</script>

<style scoped>
.popup {
  font-family: sans-serif;
  padding: 1rem;
  min-width: 250px;
}

h2 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  color: #333;
}

.switch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

label {
  font-size: 0.9rem;
  color: #666;
  margin-right: 1rem;
}
</style>