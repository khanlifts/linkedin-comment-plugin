import cssText from "data-text:~/contents/plasmo-overlay.css";
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo";
import { useEffect, useRef, useState } from "react"
import BellIcon from "react:~/assets/icons/bell.svg";
import BrowserIcon from "react:~/assets/icons/browser.svg";
import EnvelopeIcon from "react:~/assets/icons/envelope.svg";
import { CSS_CLASSES, isAllowedPath, MESSAGE_TYPES, STORAGE_KEYS, toggleClassHelper } from "~utils";
import type { OverlayMessage } from "~utils";
import FeedBuilder from "~contents/feed-builder"

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

  const overlayRef = useRef<HTMLDivElement>(null)
  const [posY, setPosY] = useState(50) // Prozentuale Position

  const [hiddenMode, setHiddenMode] = useState(false)
  const [hideMessages, setHideMessages] = useState(false)
  const [hideNotifications, setHideNotifications] = useState(false)
  const [showBuilder, setShowBuilder] = useState(false)

  const dialogRef = useRef<HTMLDialogElement>(null)

  const handleShowBuilderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowBuilder(e.target.checked)
  }

  const onCloseDialog = () => {
    setShowBuilder(false)
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (showBuilder && !dialog.open) {
      dialog.showModal()
    } else if (!showBuilder && dialog.open) {
      dialog.close()
    }
  }, [showBuilder])

  useEffect(() => {
    if (shouldRender !== true) return;

    const overlayEl = overlayRef.current
    if (!overlayEl) return

    let isDragging = false
    let startY = 0

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true
      startY = e.clientY
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const deltaY = e.clientY - startY
      const newTop = Math.min(Math.max(0, posY + (deltaY / window.innerHeight) * 100), 100)
      setPosY(newTop)
    }

    const handleMouseUp = () => {
      isDragging = false
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    overlayEl.addEventListener("mousedown", handleMouseDown)

    return () => {
      overlayEl.removeEventListener("mousedown", handleMouseDown)
    }
  }, [shouldRender])

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
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error('Error loading state:', error)
        }
      }
    }

    loadState().then();

    setShouldRender(isAllowedPath())

    const handleMessage = (message: OverlayMessage) => {
      if (message.type === MESSAGE_TYPES.URL_PATH_CHANGED) {
        setShouldRender(message.allowed)
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
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error('Error saving state:', error)
      }
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
      if (process.env.NODE_ENV !== "production") {
        console.error('Error sending message to content script:', error)
      }
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
    <div className="overlay"
         ref={overlayRef}
         style={{
           top: `${posY}%`,
           left: 0,
           position: "fixed",
           transform: "translateY(-50%)"
         }}>
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
      <div className="overlay__switch-item">
        <label className="overlay__switch">
          <span className="overlay__switch-label"
                style={{
                  left: showBuilder ? "12px" : "auto",
                  right: showBuilder ? "auto" : "16px"
                }}
          >{showBuilder ? "AUS" : "AN"}</span>
          <input className="overlay__switch-input"
                 type="checkbox"
                 checked={showBuilder}
                 onChange={handleShowBuilderChange}
          />
          <span className="overlay__switch-slider overlay__switch-slider-round">
            <span className="overlay__slider-knob">
              <BrowserIcon className={
                `overlay__slider-icon ${showBuilder ? "overlay__slider-icon--active" : ""}`}
              />
            </span>
          </span>
        </label>
      </div>
      <dialog className="overlay__dialog"
              ref={dialogRef} {...{ closedby: "any" } as any}
              onClose={onCloseDialog}
              style={{ display: showBuilder ? "initial" : "none" }}
      >
        <FeedBuilder />
      </dialog>
    </div>
  )
}
export default PlasmoOverlay