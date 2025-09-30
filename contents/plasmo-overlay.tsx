import cssText from "data-text:~/contents/plasmo-overlay.css";
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo";
import { useEffect, useState } from "react";
import { CSS_CLASSES, STORAGE_KEYS, MESSAGE_TYPES, isAllowedPath, toggleClassHelper } from "~utils"
import type { OverlayMessage } from "~utils"
import BellIcon from "react:~/assets/icons/bell.svg"
import BrowserIcon from "react:~/assets/icons/browser.svg"
import EnvelopeIcon from "react:~/assets/icons/envelope.svg"

export const config: PlasmoCSConfig = {
  matches: ["https://www.linkedin.com/*"],
  run_at: "document_start", // Run as early as possible to prevent flash
  css: ["font.css"]
}

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const PlasmoOverlay = () => {
  const [shouldRender, setShouldRender] = useState<boolean | null>(null)

  const [hiddenMode, setHiddenMode] = useState(false)
  const [hideMessages, setHideMessages] = useState(false)
  const [hideNotifications, setHideNotifications] = useState(false)

  useEffect(() => {
    const loadState = async () => {
      try {
        // Load state from storage
        const result = await chrome.storage.local.get([
          STORAGE_KEYS.HIDDEN_MODE,
          STORAGE_KEYS.HIDE_MESSAGES,
          STORAGE_KEYS.HIDE_NOTIFICATIONS
        ])

        // Set the reactive values with fallback to false
        setHiddenMode(result[STORAGE_KEYS.HIDDEN_MODE] ?? false)
        setHideMessages(result[STORAGE_KEYS.HIDE_MESSAGES] ?? false)
        setHideNotifications(result[STORAGE_KEYS.HIDE_NOTIFICATIONS] ?? false)

        console.log('State loaded from storage:', result)

        // Note: State is automatically applied when LinkedIn pages load
        // No need to manually send APPLY_STATE message
      } catch (error) {
        console.error('Error loading state:', error)
      }
    }

    loadState().then();

    setShouldRender(isAllowedPath())

    const handleMessage = (message: OverlayMessage) => {
      if (message.type === MESSAGE_TYPES.URL_PATH_CHANGED) {
        setShouldRender(message.allowed)
        console.log("Overlay render state changed by background script:", message.allowed)
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage)
    }
  }, []);

  if (shouldRender === false) return null

  // Function to save state to storage
  const saveStateToStorage = async (className: string, status: boolean) => {
    try {
      const classToStorageKeyMap = {
        [CSS_CLASSES.HIDDEN_MODE]: STORAGE_KEYS.HIDDEN_MODE,
        [CSS_CLASSES.HIDE_MESSAGES]: STORAGE_KEYS.HIDE_MESSAGES,
        [CSS_CLASSES.HIDE_NOTIFICATIONS]: STORAGE_KEYS.HIDE_NOTIFICATIONS
      }

      await chrome.storage.local.set({[classToStorageKeyMap[className]]: status })

      console.log('State saved to storage')
    } catch (error) {
      console.error('Error saving state:', error)
    }
  }

// Function to send message to content script
  const onChangeHandler = async (className: string, status: boolean) => {
    if (className === CSS_CLASSES.HIDDEN_MODE) {
      setHiddenMode(status)
    } else if (className === CSS_CLASSES.HIDE_MESSAGES) {
      setHideMessages(status)
    } else if (className === CSS_CLASSES.HIDE_NOTIFICATIONS) {
      setHideNotifications(status)
    }
    try {
      // Find iframe for toggle
      const iframe = document.querySelector('iframe[data-testid="interop-iframe"]') as HTMLIFrameElement

      // Use helper function for consistent behavior
      toggleClassHelper(className, status, iframe)
      // Save state after successful toggle

      await saveStateToStorage(className, status)
    } catch (error) {
      console.error('Error sending message to content script:', error)
      // Reset the switch state if message failed
      const toggleMap: Record<string, boolean> = {
        [CSS_CLASSES.HIDDEN_MODE]: hiddenMode,
        [CSS_CLASSES.HIDE_MESSAGES]: hideMessages,
        [CSS_CLASSES.HIDE_NOTIFICATIONS]: hideNotifications
      }

      if (className in toggleMap) {
        toggleMap[className] = !status
      }
    }
  }

  return (
    <div className="overlay">
      <h2 className="overlay__title">FeedFocus</h2>
        <div className="overlay__switch-item">
          <label className="overlay__switch">
            <span className="overlay__switch-label"
                  style={{
                    left: hideNotifications ? "12px" : "auto",
                    right: hideNotifications ? "auto" : "16px"
                  }}
            >{hideNotifications ? "AUS" : "AN"}</span>
            <input className="overlay__switch-input"
                   type="checkbox"
                   checked={hideNotifications}
                   onChange={(e) => {
                     onChangeHandler(CSS_CLASSES.HIDE_NOTIFICATIONS, e.target.checked)
                   }}
            />
            <span className="overlay__switch-slider overlay__switch-slider-round">
              <span className="overlay__slider-knob">
                <BellIcon className={
                  `overlay__slider-icon ${hideNotifications ? "overlay__slider-icon--active" : ""}`}
                />
              </span>
            </span>
          </label>
        </div>
      <div className="overlay__switch-item">
        <label className="overlay__switch">
          <span className="overlay__switch-label"
                style={{
                  left: hideMessages ? "12px" : "auto",
                  right: hideMessages ? "auto" : "16px"
                }}
          >{hideMessages ? "AUS" : "AN"}</span>
          <input className="overlay__switch-input"
                 type="checkbox"
                 checked={hideMessages}
                 onChange={(e) => {
                   onChangeHandler(CSS_CLASSES.HIDE_MESSAGES, e.target.checked)
                 }}
          />
          <span className="overlay__switch-slider overlay__switch-slider-round">
            <span className="overlay__slider-knob">
              <EnvelopeIcon className={
                `overlay__slider-icon ${hideMessages ? "overlay__slider-icon--active" : ""}`}
              />
            </span>
          </span>
        </label>
      </div>
      <div className="overlay__switch-item">
        <label className="overlay__switch">
          <span className="overlay__switch-label"
                style={{
                  left: hiddenMode ? "12px" : "auto",
                  right: hiddenMode ? "auto" : "16px"
                }}
          >{hiddenMode ? "AUS" : "AN"}</span>
          <input className="overlay__switch-input"
                 type="checkbox"
                 checked={hiddenMode}
                 onChange={(e) => {
                   onChangeHandler(CSS_CLASSES.HIDDEN_MODE, e.target.checked)
                 }}
          />
          <span className="overlay__switch-slider overlay__switch-slider-round">
            <span className="overlay__slider-knob">
              <BrowserIcon className={
                `overlay__slider-icon ${hiddenMode ? "overlay__slider-icon--active" : ""}`}
              />
            </span>
          </span>
        </label>
      </div>
    </div>
  )
}
export default PlasmoOverlay