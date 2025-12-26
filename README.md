# 🧸 StackRipper v2.0

**Professional Technology Profiler & Stack Analysis Tool**

StackRipper is a high-performance Chrome extension designed for developers, security researchers, and tech enthusiasts. It goes beyond simple detection, providing deep architectural insights, version tracking, and performance metrics—all wrapped in a premium, adaptive 'Peach & White' aesthetic.

![StackRipper Banner](https://raw.githubusercontent.com/Chaitanyahoon/StackRipper/main/ui/logo-placeholder.png) *(Preview via Extension)*

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

## 🚀 Installation

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/Chaitanyahoon/StackRipper.git
    ```
2.  **Open Chrome Extensions**:
    Navigate to `chrome://extensions/` in your browser.
3.  **Enable Developer Mode**:
    Toggle the switch in the top-right corner.
4.  **Load Unpacked**:
    Click the **"Load unpacked"** button and select the `StackRipper` root folder.
5.  **Start Ripping**:
    Visit any site and click the StackRipper icon to see the magic.

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

Developed with 🥂 by **Chaitanyahoon**
