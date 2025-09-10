<template>
  <div class="popup">
    <h2>LinkedIn Focus Plugin</h2>
    <n-space vertical>
      <div class="switch-item">
        <label>Hide Feed</label>
        <n-switch 
          v-model:value="hiddenMode" 
          @update:value="toggleClass(CSS_CLASSES.HIDDEN_MODE, $event)"
        />
      </div>
      <div class="switch-item">
        <label>Hide Notifications</label>
        <n-switch 
          v-model:value="hideNotifications" 
          @update:value="toggleClass(CSS_CLASSES.HIDE_NOTIFICATIONS, $event)"
        />
      </div>
      <div class="switch-item">
        <label>Hide Messages</label>
        <n-switch 
          v-model:value="hideMessages" 
          @update:value="toggleClass(CSS_CLASSES.HIDE_MESSAGES, $event)"
        />
      </div>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, type Ref } from 'vue'
import { NSwitch, NSpace } from 'naive-ui'

// Constants for storage keys (matching content script)
const STORAGE_KEYS = {
  HIDDEN_MODE: 'hiddenMode',
  HIDE_MESSAGES: 'hideMessages',
  HIDE_NOTIFICATIONS: 'hideNotifications'
} as const

// Constants for CSS class names (matching content script)
const CSS_CLASSES = {
  HIDDEN_MODE: 'myext-hidden-mode',
  HIDE_MESSAGES: 'myext-hide-messages',
  HIDE_NOTIFICATIONS: 'myext-hide-notifications'
} as const

// Reactive state for each switch
const hiddenMode = ref(false)
const hideMessages = ref(false)
const hideNotifications = ref(false)

// Function to save state to storage
const saveState = async () => {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.HIDDEN_MODE]: hiddenMode.value,
      [STORAGE_KEYS.HIDE_MESSAGES]: hideMessages.value,
      [STORAGE_KEYS.HIDE_NOTIFICATIONS]: hideNotifications.value
    })
    console.log('State saved to storage')
  } catch (error) {
    console.error('Error saving state:', error)
  }
}

// Function to send message to content script
const toggleClass = async (className: string, status: boolean) => {
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    
    if (tab?.id) {
      // Send message to content script
      await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_CLASS', className, status })
      
      // Save state after successful toggle
      await saveState()
    }
  } catch (error) {
    console.error('Error sending message to content script:', error)
    // Reset the switch state if message failed
    const toggleMap: Record<string, Ref<boolean>> = {
      [CSS_CLASSES.HIDDEN_MODE]: hiddenMode,
      [CSS_CLASSES.HIDE_MESSAGES]: hideMessages,
      [CSS_CLASSES.HIDE_NOTIFICATIONS]: hideNotifications
    }

    if (className in toggleMap) {
      toggleMap[className].value = !status
    }
  }
}

// Load state from storage and apply to DOM on mount
onMounted(async () => {
  try {
    // Load state from storage
    const result = await chrome.storage.local.get([
      STORAGE_KEYS.HIDDEN_MODE, 
      STORAGE_KEYS.HIDE_MESSAGES, 
      STORAGE_KEYS.HIDE_NOTIFICATIONS
    ])
    
    // Set the reactive values with fallback to false
    hiddenMode.value = result[STORAGE_KEYS.HIDDEN_MODE] || false
    hideMessages.value = result[STORAGE_KEYS.HIDE_MESSAGES] || false
    hideNotifications.value = result[STORAGE_KEYS.HIDE_NOTIFICATIONS] || false
    
    console.log('State loaded from storage:', result)
    
    // Note: State is automatically applied when LinkedIn pages load
    // No need to manually send APPLY_STATE message
  } catch (error) {
    console.error('Error loading state:', error)
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