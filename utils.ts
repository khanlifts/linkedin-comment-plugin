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

interface ProfileMatch {
  urn: string | null;
  fullName: string;
}

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

const isJsonString = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

export const isProfileUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.pathname.includes('/in/')
  } catch {
    return false
  }
}

const extractPublicIdentifierFromUrl = (): string => {
  return window.location.href.split("/")[4]
}

const getParsedJsonFromCodeTags = (): any[] => {
  const codeEls = [...document.querySelectorAll("code")]
  const jsons: any[] = []

  for (const el of codeEls) {
    const text = el.textContent?.trim();
    if (!text || !isJsonString(text)) continue
    try {
      const parsedJson = JSON.parse(text)
      if (parsedJson && typeof parsedJson === "object") {
        jsons.push(parsedJson)
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Fehler beim Parsen eines <code>-Elements:", err)
      }
    }
  }

  return jsons
}

const findProfileMatch = (includedArray: any[], publicIdentifier: string): ProfileMatch | null => {
  for (const item of includedArray) {
    if (
      typeof item !== "object" ||
      typeof item.entityUrn !== "string" ||
      !item.entityUrn.includes("fsd_profile")
    ) {
      continue;
    }

    const decodedIdentifier = decodeURIComponent(publicIdentifier)

    if (item.publicIdentifier === decodedIdentifier) {
      const urn = item.entityUrn.split(":").pop() ?? null;
      const firstName = item.firstName ?? "";
      const lastName = item.lastName ?? "";
      const fullName = `${firstName} ${lastName}`.trim();

      return {
        urn,
        fullName,
      };
    }
  }

  return null;
}

export const getLinkedInMemberFullNameAndUrn = (): ProfileMatch | null => {
  const publicIdentifier = extractPublicIdentifierFromUrl()
  const parsedJsons = getParsedJsonFromCodeTags()

  for (const json of parsedJsons) {
    if (!Array.isArray(json?.included)) continue
    const match = findProfileMatch(json.included, publicIdentifier)
    if (match !== null) return match
  }

  return null;
}
