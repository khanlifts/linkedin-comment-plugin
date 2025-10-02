# LinkedIn FeedFocus

**FeedFocus** is a lightweight browser extension for Chrome, Arc, Brave, Edge, and Safari. It lets you quickly toggle LinkedIn notifications and messages (DMs) on or off — without digging into LinkedIn’s settings every time.

No blocking. No hiding forever. Just quick focus when you need it — and easy access when you don't.

Built with the [Plasmo Framework](https://docs.plasmo.com/).

---

## 🔧 Local Development

### 1. Start the dev server

```bash
pnpm dev
# or
npm run dev
```

### 2. Load the extension in your browser

Depending on your target browser, locate the dev build folder (e.g.):

```
build/chrome-mv3-dev
```

Load this folder manually as an unpacked extension:
- Go to `chrome://extensions`
- Enable developer mode
- Click “Load unpacked” and select the build folder

---

## ⚙️ Project Structure

- `content.ts`: Injects CSS styles into LinkedIn pages to toggle specific elements
- `background.ts`: Ensures the extension only activates on allowed pages
- `package.json`: Declares permissions, icons, and entry points
- `plasmo-overlay.tsx`: Main component with switches

---

## 🚀 Build for Production

```bash
pnpm build
# or
npm run build
```

The output will be available in the `build/` folder, ready for zipping and upload.

---

## 🔒 Permissions & Privacy

FeedFocus only requests access to LinkedIn pages:

```json
"host_permissions": [
  "https://www.linkedin.com/*"
]
```

- No trackers
- No data collection
- No external API calls

---

## 💡 Why FeedFocus?

LinkedIn can be useful — and distracting. FeedFocus helps you keep your flow without missing messages. It’s not about hiding everything, but toggling visibility when you need space to work.

---