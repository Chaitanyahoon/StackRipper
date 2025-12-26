# <img src="assets/icon48.png" width="32" vertical-align="middle"> StackRipper v2.0

**Professional Technology Profiler & Stack Analysis Tool**

StackRipper is a high-performance Chrome extension designed for developers, security researchers, and tech enthusiasts. It goes beyond simple detection, providing deep architectural insights, version tracking, and performance metrics—all wrapped in a premium, adaptive 'Peach & White' aesthetic.



---

## 🚀 Quick Install (No Store Required)

Since this is an independent professional tool, you can install it for free in 30 seconds:

### Method A: Download the ZIP (Easiest)
1.  **Download** the latest `StackRipper_v2.0_Stable.zip` from our [Releases](https://github.com/Chaitanyahoon/StackRipper/releases) page.
2.  **Extract** the ZIP folder anywhere on your PC.
3.  **Open Extensions**: Go to `chrome://extensions/` in Chrome.
4.  **Enable Developer Mode**: Toggle the switch in the top-right.
5.  **Load Unpacked**: Click the button and select the extracted folder.

### Method B: Clone for Developers
```bash
git clone https://github.com/Chaitanyahoon/StackRipper.git
```
Then follow steps 3-5 above.

---

## 🦊 Firefox & Edge Support
*   **Edge**: Fully compatible. Follow the Chrome "Load Unpacked" steps.
*   **Firefox**: We are 95% compatible with the WebExtensions API. You can load this via `about:debugging` for free!

---

## ✨ Features

*   **🔍 Elite Detection Engine**: Rule-based scanning of DOM fragments, script signatures, and network response headers.
*   **📦 Deep Version Tracking**: Identifies specific versions of frameworks like React, Next.js, Angular, and Vue.js.
*   **⚡ Performance Intelligence**: Real-time monitoring of site performance (TTFB, Load Time, and DOM Ready).
*   **📋 Site Identity Profile**: Generates a professional technical summary of the visited site's architecture.
*   **🌓 Adaptive Theming**: Automatically switches between **Premium Light** and **Deep Space Dark** modes based on your system theme.
*   **📊 JSON Reporting**: Export full technical analysis reports with a single click for documentation or auditing.
*   **🏷️ Icon Badge**: Instant real-time feedback with technology counts displayed directly on the extension icon.

---

## 🛠️ Technology Stack

*   **Manifest V3**: Built on the latest, most secure extension standard.
*   **Service Workers**: Background scanning for network-level detections.
*   **Content Injection**: Secure sandboxed script injection for version detection.
*   **Vanilla JS & CSS**: Maximum performance with zero external dependencies.

---

## 📂 Project Structure

```text
StackRipper/
├── data/
│   └── rules.json      # The dynamic brain (Detection rules & metadata)
├── scripts/
│   ├── background.js   # Network monitoring & Badge management
│   └── content.js      # DOM scanning & version injection
├── ui/
│   ├── popup.html      # The high-impact dashboard
│   ├── popup.css       # Adaptive themes & Professional styles
│   └── popup.js        # Data orchestration & Export logic
└── manifest.json       # Extension configuration (v2.0)
```

---

## 🤝 Contributing

StackRipper is designed to be extensible. To add new technologies:
1.  Open `data/rules.json`.
2.  Add a new entry with `dom`, `scripts`, or `headers` patterns.
3.  Reload the extension.

---

## 📜 License

MIT License - Feel free to use, rip, and rebuild.

Developed by **Chaitanyahoon**
