// Background script to control when the popup is available
// This script runs in the background and controls the page action

import { isAllowedPath, MESSAGE_TYPES } from "~utils"

// Helper function to update the action state based on URL
function updateActionState(tabId: number, url: string) {
  const allowed = isAllowedPath(url)
  chrome.tabs.sendMessage(tabId, {
    type: MESSAGE_TYPES.URL_PATH_CHANGED,
    allowed
  }).catch(() => {
    // Ignoriere Fehler, wenn Content Script noch nicht ready ist
  })
}

// Check on extension startup or chrome startup
chrome.runtime.onStartup.addListener(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url && tabs[0].id) {
        updateActionState(tabs[0].id, tabs[0].url)
      }
    })
  })

// Listen for tab updates to show/hide the popup
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    updateActionState(tabId, tab.url)
  }
})

// Also check when you switch between tabs or open a new tab
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      updateActionState(activeInfo.tabId, tab.url)
    }
  })
})
