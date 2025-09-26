import { CSS_CLASSES, STORAGE_KEYS, toggleClassHelper } from "~utils"

// Helper function to wait for the correct iframe using polling
const waitForCorrectIframe = (callback: (iframe: HTMLIFrameElement) => void) => {
  let checkCount = 0
  const maxChecks = 1000 // Stoppe nach ~16 Sekunden
  
  const checkIframes = () => {
    checkCount++
    const allIframes = document.querySelectorAll('iframe')
    
    for (const iframe of allIframes) {
      if (isValidIframe(iframe)) {
        console.log(`✅ IFRAME FOUND after ${checkCount} checks - Plugin will work!`)
        callback(iframe)
        return
      }
    }
    
    if (checkCount < maxChecks) {
      requestAnimationFrame(checkIframes)
    } else {
      console.log('❌ IFRAME TIMEOUT - Plugin will NOT work! Found iframes:', Array.from(allIframes).map(f => ({testid: f.getAttribute('data-testid'), src: f.src})))
    }
  }
  
  checkIframes()
}

const isValidIframe = (iframe: HTMLIFrameElement) => {
  try {
    const body = iframe.contentDocument?.body
      if (!body) return false

      // Prüfe, ob eine der relevanten Message-Klassen im iframe existiert
      return (
        body.querySelector('.msg-convo-wrapper') !== null ||
        body.querySelector('.msg-overlay-container') !== null
      )
    } catch (e) {
      // Zugriff auf iframe nicht erlaubt (z. B. CORS)
      return false
    }
}

// Function to inject CSS styles into iframe
const injectStylesIntoIframe = (iframe: HTMLIFrameElement) => {
  if (iframe?.contentDocument?.head) {
    // Check if styles already exist
    const existingStyle = iframe.contentDocument.querySelector('style[data-myext]')
    if (!existingStyle) {
      const iframeStyle = iframe.contentDocument.createElement('style')
      iframeStyle.setAttribute('data-myext', 'true')
      iframeStyle.textContent = style.textContent
      iframe.contentDocument.head.appendChild(iframeStyle)
      console.log('✅ CSS INJECTED - Plugin styles active!')
    }
  } else {
    console.log('❌ CSS INJECTION FAILED - iframe not accessible!')
  }
}

// Elegant function to wait for body and apply saved state
async function waitForBodyAndApplyState() {
  if (document.body) {
    // Wait for correct iframe and apply state when ready
    waitForCorrectIframe((iframe) => {
      // Inject CSS styles into iframe
      injectStylesIntoIframe(iframe)
      // Iframe found, apply state
      applySavedState(iframe)
    })
    
    await applySavedState()
  } else {
    requestAnimationFrame(waitForBodyAndApplyState)
  }
}

// Function to apply saved state from storage
const applySavedState = async (iframe?: HTMLIFrameElement) => {
  try {
    // Double-check that body exists (safety net)
    if (!document.body) {
      return
    }
    
    const result = await chrome.storage.local.get([
      STORAGE_KEYS.HIDDEN_MODE, 
      STORAGE_KEYS.HIDE_MESSAGES, 
      STORAGE_KEYS.HIDE_NOTIFICATIONS
    ])

    // Apply the states using helper functions
    toggleClassHelper(CSS_CLASSES.HIDDEN_MODE, result[STORAGE_KEYS.HIDDEN_MODE] || false, iframe)
    toggleClassHelper(CSS_CLASSES.HIDE_MESSAGES, result[STORAGE_KEYS.HIDE_MESSAGES] || false, iframe)
    toggleClassHelper(CSS_CLASSES.HIDE_NOTIFICATIONS, result[STORAGE_KEYS.HIDE_NOTIFICATIONS] || false, iframe)
    
    // Only log if something is actually enabled
    const activeFeatures = Object.entries(result).filter(([key, value]) => value).map(([key]) => key)
    if (activeFeatures.length > 0) {
      console.log('🎉 PLUGIN ACTIVE - Features enabled:', activeFeatures)
    }
  } catch (error) {
    console.error('❌ Error applying saved state:', error)
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

// Listen for messages from the Content Script UI
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.log('message in content.ts', message)
  if (message.type === 'TOGGLE_CLASS') {
    const { className, status } = message
    
    // Find iframe for toggle
    const iframe = document.querySelector('iframe[data-testid="interop-iframe"]') as HTMLIFrameElement
    
    // Use helper function for consistent behavior
    toggleClassHelper(className, status, iframe)
    
    sendResponse({ success: true })
  }
  // TODO: Check if you have to implement this part in plasmo-overlay.tsx to ensure the state is saved between page loads
  if (message.type === 'APPLY_STATE') {
    try {
      // Find iframe for state application
      const iframe = document.querySelector('iframe[data-testid="interop-iframe"]') as HTMLIFrameElement
      
      // Use the same function as page load
      await applySavedState(iframe)
      sendResponse({ success: true })
    } catch (error) {
      console.error('❌ Error applying state:', error)
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
  } else {
    requestAnimationFrame(waitForHeadAndInjectStyles)
  }
}

waitForHeadAndInjectStyles()
