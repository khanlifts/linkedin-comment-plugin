// Content script for LinkedIn Comment Plugin
// This script runs on LinkedIn pages and handles messages from the popup

// Plasmo configuration - only run on LinkedIn pages
export const config = {
  matches: ["https://www.linkedin.com/*"],
  run_at: "document_start" // Run as early as possible to prevent flash
}

// Constants for CSS class names
const CSS_CLASSES = {
  HIDDEN_MODE: 'myext-hidden-mode',
  HIDE_MESSAGES: 'myext-hide-messages',
  HIDE_NOTIFICATIONS: 'myext-hide-notifications'
} as const

// Constants for storage keys
const STORAGE_KEYS = {
  HIDDEN_MODE: 'hiddenMode',
  HIDE_MESSAGES: 'hideMessages',
  HIDE_NOTIFICATIONS: 'hideNotifications'
} as const

// Helper functions for CSS class management
const addClass = (className: string) => {
  if (document.body) {
    document.body.classList.add(className)
  }
}

const removeClass = (className: string) => {
  if (document.body) {
    document.body.classList.remove(className)
  }
}

const toggleClass = (className: string, shouldAdd: boolean) => {
  if (shouldAdd) {
    addClass(className)
  } else {
    removeClass(className)
  }
}

// Elegant function to wait for body and apply saved state
async function waitForBodyAndApplyState() {
  if (document.body) {
    await applySavedState()
  } else {
    requestAnimationFrame(waitForBodyAndApplyState)
  }
}

// Function to apply saved state from storage
const applySavedState = async () => {
  try {
    // Double-check that body exists (safety net)
    if (!document.body) {
      console.log('Body still not ready, skipping state application')
      return
    }
    
    const result = await chrome.storage.local.get([
      STORAGE_KEYS.HIDDEN_MODE, 
      STORAGE_KEYS.HIDE_MESSAGES, 
      STORAGE_KEYS.HIDE_NOTIFICATIONS
    ])
    
    // Apply the states using helper functions
    toggleClass(CSS_CLASSES.HIDDEN_MODE, result[STORAGE_KEYS.HIDDEN_MODE] || false)
    toggleClass(CSS_CLASSES.HIDE_MESSAGES, result[STORAGE_KEYS.HIDE_MESSAGES] || false)
    toggleClass(CSS_CLASSES.HIDE_NOTIFICATIONS, result[STORAGE_KEYS.HIDE_NOTIFICATIONS] || false)
    
    console.log('Applied saved state on page load:', result)
  } catch (error) {
    console.error('Error applying saved state:', error)
  }
}

// Apply saved state as soon as body is available
waitForBodyAndApplyState()

// Also apply when DOM is ready (backup)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Use the same safe approach
    waitForBodyAndApplyState()
  })
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.log('Content script received message:', message)
  
  if (message.type === 'TOGGLE_CLASS') {
    const { className, status } = message
    
    // Use helper function for consistent behavior
    toggleClass(className, status)
    
    console.log(`Toggled ${className}: ${status}`)
    sendResponse({ success: true })
  }
  
  if (message.type === 'APPLY_STATE') {
    try {
      // Use the same function as page load
      await applySavedState()
      sendResponse({ success: true })
    } catch (error) {
      console.error('Error applying state:', error)
      sendResponse({ success: false, error: error.message })
    }
  }
  
  return true // Keep the message channel open for async response
})

// Add CSS styles for hiding LinkedIn elements
const style = document.createElement('style')
style.textContent = `
  /* Hide feed updates */
  .myext-hidden-mode .feed-new-update-pill {
    opacity: 0 !important;
  }
  
  .myext-hidden-mode .feed-shared-update-v2 {
    opacity: 0 !important;
  }
  
  .myext-hidden-mode .feed-shared-update {
    opacity: 0 !important;
  }
  
  /* Hide messages */
  .myext-hide-messages .msg-convo-wrapper {
    opacity: 0 !important;
  }

  .myext-hide-messages .msg-overlay-container {
    opacity: 0 !important;
  }
  
  /* Hide notifications */  
  .myext-hide-notifications .notification-badge {
    opacity: 0 !important;
  }
`

// Elegant function to wait for head and inject styles
function waitForHeadAndInjectStyles() {
  if (document.head) {
    document.head.appendChild(style)
    console.log('CSS styles added to head')
  } else {
    requestAnimationFrame(waitForHeadAndInjectStyles)
  }
}

waitForHeadAndInjectStyles()

console.log('LinkedIn Comment Plugin content script loaded')
