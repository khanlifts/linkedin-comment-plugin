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
        callback(iframe)
        return
      }
    }
    
    if (checkCount < maxChecks) {
      requestAnimationFrame(checkIframes)
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
    }
  }
}

const extractPublicIdentifierFromUrl = (): string => {
  return window.location.href.split("/")[4]
}

const getParsedJsonFromCodeTags = (): any[] => {
  const codeEls = [...document.querySelectorAll("code")]
  const parsedObjects: any[] = []

  for (const el of codeEls) {
    try {
      const text = el.textContent
      if (!text) continue
      const json = JSON.parse(text)
      parsedObjects.push(json)
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Fehler beim Parsen eines <code>-Elements:", err)
      }
    }
  }

  return parsedObjects
}

const findProfileMatch = (included: any[], publicIdentifier: string): { fullName: string; urn: string } | null => {
  const match = included.find((item) => item.publicIdentifier === publicIdentifier)
  if (!match) return null

  const fullName = `${match.firstName ?? ''} ${match.lastName ?? ''}`.trim()
  const urn = match.entityUrn?.split(":").pop() || ''
  return { fullName, urn }
}

const getLinkedInMemberFullNameAndUrn = (): { fullName: string; urn: string } | null => {
  const publicIdentifier = extractPublicIdentifierFromUrl()
  const parsedJsons = getParsedJsonFromCodeTags()

  for (const json of parsedJsons) {
    if (!Array.isArray(json?.included)) continue
    const match = findProfileMatch(json.included, publicIdentifier)
    if (match !== null) return match
  }

  return null;
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

    const fullNameAndResult = getLinkedInMemberFullNameAndUrn()

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
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error('Error applying saved state:', error)
    }
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
