import cssText from "data-text:~/contents/plasmo-overlay.css";
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo";

export const config: PlasmoCSConfig = {
  matches: ["https://www.linkedin.com/*"],
  run_at: "document_start" // Run as early as possible to prevent flash
}

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const PlasmoOverlay = () => {
  return (
    <div className="overlay">
      <h2 className="overlay__title">Feed Focus</h2>
        <div className="overelay__switch-item">
          <label className="overlay__label">Hide Notifications</label>
        </div>
        <div className="overlay__switch-item">
          <label className="overlay__label">Hide Messages</label>
        </div>
        <div className="overlay__switch-item">
          <label className="overlay__label">Hide Feed</label>
        </div>
    </div>
  )
}
export default PlasmoOverlay