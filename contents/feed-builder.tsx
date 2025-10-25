import cssText from "data-text:~/contents/feed-builder.scss";
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"

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

const FeedBuilder = () => {
  return <div className="feed-builder">FeedBuilder</div>
}

export default FeedBuilder