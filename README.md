# MeikoBlock (҂ ` ﾛ ´)σ

**A no-nonsense, aesthetic website blocker built for Chrome (Manifest V3).**

<p align="center">
  <img src="assets/icon128.png" alt="MeikoBlock Logo" width="128" height="128">
</p>

## 📖 Overview

**MeikoBlock** is a custom Chrome Extension designed to eliminate distractions with style. Unlike boring, corporate blockers, MeikoBlock features a distinct "City Pop" neon aesthetic and a strict mascot who doesn't tolerate procrastination.

Built using the latest **Manifest V3** standards, it leverages the **Declarative Net Request API** for high-performance blocking without privacy intrusion.

## ✨ Key Features

* **🚫 Smart Blocking:** Instantly block distracting websites using a local blacklist.
* **😱 Panic Mode:** A "Whitelist Only" mode for extreme focus. When active, *everything* is blocked except for the sites you explicitly allow.
* **⚡ Auto-Fill:** Automatically detects the current tab's URL and pre-fills the input box for quick blocking.
* **⏸️ Pause/Resume:** A toggle system to temporarily pause blocking rules without losing your list.
* **🎨 Custom Block Page:** Redirects blocked requests to a custom local HTML page with randomized, strict motivational messages.
* **🔒 Privacy Focused:** Runs entirely offline using `chrome.storage.local`. No external servers, no tracking.

## 🛠️ Tech Stack

* **Core:** HTML5, CSS3, Vanilla JavaScript
* **Platform:** Chrome Extensions API (Manifest V3)
* **APIs Used:**
    * `declarativeNetRequest` (Dynamic Rule Management)
    * `storage` (State persistence)
    * `tabs` (URL detection and reloading)

## 🚀 Installation (Developer Mode)

Since this extension is currently in development/portfolio mode, you can install it manually:

1.  **Clone or Download** this repository.
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Toggle **Developer Mode** in the top right corner.
4.  Click **Load unpacked**.
5.  Select the folder containing `manifest.json`.
6.  Pin **MeikoBlock** to your toolbar and start focusing!

## 📂 Project Structure

```text
MeikoBlock/
├── manifest.json        # Extension configuration (MV3)
├── assets/              # Icons and images
├── pages/
│   ├── popup.html       # Main extension interface
│   ├── block.html       # "Access Denied" page
│   └── donate.html      # Crypto donation page
├── scripts/
│   ├── background.js    # Service worker (initialization)
│   ├── popup.js         # UI logic & state management
│   ├── block.js         # Block page logic
│   └── donate.js        # Donation page logic
└── styles/
    ├── popup.css        # Neon aesthetic styling
    ├── block.css        # Styling for the block page
    └── donate.css       # Styling for the donation page

```

## ☕ Support Development

This project is maintained by an independent developer. If MeikoBlock helps you stay productive, you can support development via Crypto (RedotPay friendly!).

**USDT (TRC20 - Tron Network):**

```text
TM6TMV9XT5igCtAsW2Q4EdhMxpQAzxnUnz

```

*(Please ensure you use the TRC20 network only.)*

## 📄 License

This project is open-source and available under the **MIT License**.

---

*(҂ ` ﾛ ´)σ "You have work to do. Stop scrolling." - Meiko*