// Content script for LinkedIn Comment Plugin
// This script runs on LinkedIn pages and handles messages from the popup

// Plasmo configuration - only run on LinkedIn pages
export const config = {
  matches: ["https://www.linkedin.com/*"]
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message)
  
  if (message.type === 'TOGGLE_CLASS') {
    const { className, status } = message
    
    if (status) {
      // Add the class to hide elements
      document.body.classList.add(className)
    } else {
      // Remove the class to show elements
      document.body.classList.remove(className)
    }
    
    console.log(`Toggled ${className}: ${status}`)
    sendResponse({ success: true })
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

document.head.appendChild(style)

console.log('LinkedIn Comment Plugin content script loaded')
