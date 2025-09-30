// Constants for CSS class names
export const CSS_CLASSES = {
  HIDDEN_MODE: 'myext-hidden-mode',
  HIDE_MESSAGES: 'myext-hide-messages',
  HIDE_NOTIFICATIONS: 'myext-hide-notifications'
} as const

// Constants for storage keys
export const STORAGE_KEYS = {
  HIDDEN_MODE: 'hiddenMode',
  HIDE_MESSAGES: 'hideMessages',
  HIDE_NOTIFICATIONS: 'hideNotifications'
} as const

// Helper functions for CSS class management
export const addClass = (className: string, iframe?: HTMLIFrameElement) => {
  // Haupt-Document
  if (document.body) {
    document.body.classList.add(className)
  }

  // Iframe (falls übergeben)
  if (iframe?.contentDocument?.body) {
    iframe.contentDocument.body.classList.add(className)
  }
}

export const removeClass = (className: string, iframe?: HTMLIFrameElement) => {
  // Haupt-Document
  if (document.body) {
    document.body.classList.remove(className)
  }

  // Iframe (falls übergeben)
  if (iframe?.contentDocument?.body) {
    iframe.contentDocument.body.classList.remove(className)
  }
}

export const toggleClassHelper = (className: string, shouldAdd: boolean, iframe?: HTMLIFrameElement) => {
  if (shouldAdd) {
    addClass(className, iframe)
  } else {
    removeClass(className, iframe)
  }
}

export const isAllowedPath = (url: string = window.location.href): boolean => {
  try {
    const parsedUrl = new URL(url)
    const pathname = parsedUrl.pathname
    return (
      pathname.startsWith("/feed") ||
      pathname.startsWith("/messaging") ||
      pathname.startsWith("/notifications") ||
      pathname.startsWith("/in/") ||
      pathname.startsWith("/analytics/") ||
      pathname.startsWith("/my-items/") ||
      pathname.startsWith("/search/") ||
      pathname.startsWith("/company/")
    )
  } catch {
    return false
  }
}

export const MESSAGE_TYPES = {
  URL_PATH_CHANGED: "URL_PATH_CHANGED"
} as const

export interface OverlayMessage {
  type: typeof MESSAGE_TYPES.URL_PATH_CHANGED
  allowed: boolean
}