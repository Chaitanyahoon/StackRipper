# <img src="assets/icon48.png" width="32" vertical-align="middle"> StackRipper v3.0

**The Intelligence Layer for Modern Developers**

[🌐 Visit the Official Website](http://localhost:3000)

StackRipper is a high-performance Chrome extension designed for detailed architectural analysis. It goes beyond simple detection, providing **X-Ray Component Inspection**, **Historical Time Machine** tracking, **AI-Powered Critiques**, and **Real-Time Security Audits**.

---

## 🚀 Quick Install

### Method A: Download the V3.0 ZIP (Recommended)
1.  **Download** the latest `StackRipper_v3.0_Stable.zip` from our [Website](http://localhost:3000) or Releases.
2.  **Extract** the ZIP folder.
3.  **Open Extensions**: Go to `chrome://extensions/` in Chrome/Edge/Brave.
4.  **Enable Developer Mode**: Toggle the switch in the top-right.
5.  **Load Unpacked**: Click the button and select the extracted folder.

### Method B: Clone & Build
```bash
git clone https://github.com/Chaitanyahoon/StackRipper.git
cd StackRipper
# Website (Optional)
cd website && npm install && npm run dev
```

---

## ✨ V3.0 "Real Intel" Features

### 1. 🩻 Component Inspector (X-Ray)
*   **What it does:** Hover over any element on a webpage to identify the underlying technology.
*   **Techs Detected:** Tailwind Utility Classes, React Components (`data-reactid`), Material UI, Styled Components.
*   **How to use:** Click "Inspect" in the popup, then hover over the page.

### 2. ⏳ Time Machine (History Tracking)
*   **What it does:** Automatically saves the technology stack of every site you visit.
*   **Benefit:** Track how a competitor's stack evolves over time (e.g., "They migrated from jQuery to React on Dec 12").
*   **Privacy:** All history is stored **locally** on your device.

### 3. 🧠 AI Architect (Local Heuristic Engine)
*   **What it does:** Analyzes the detected stack for conflicts and best practices.
*   **Example:** "Mixing jQuery with React causes performance bottlenecks." or "Next.js detected: Excellent SEO architecture."
*   **No API Keys:** Runs entirely offline using a rule-based expert system.

### 4. 🛡️ Security Audit (CVE Engine)
*   **What it does:** Cross-references detected library versions against a real database of known vulnerabilities.
*   **Alerts:** Instantly flags "Critical" or "High" severity issues (e.g., React XSS vulnerabilities).
*   **Database:** Includes CVEs for React, jQuery, Bootstrap, Lodash, and AngularJS.

---

## 🛠️ Technology Stack

*   **Manifest V3**: Secure, event-driven architecture.
*   **Service Workers**: `background.js` handles history logging and AI logic.
*   **Content Scripts**: `inspector.js` injects the X-Ray overlay.
*   **Data Layer**: `rules.json` (Detection Rules) & `cves.json` (Vulnerability DB).
*   **Website**: Built with **Next.js 14**, **Framer Motion**, and **Glassmorphism UI**.

---

## 📂 Project Structure

```text
StackRipper/
├── data/
│   ├── rules.json      # Detection signatures
│   └── cves.json       # Security vulnerability database
├── scripts/
│   ├── background.js   # Service Worker (AI, History, Badge)
│   ├── content.js      # Page scanner
│   └── inspector.js    # X-Ray UI overlay
├── ui/
│   ├── popup.html      # Main Dashboard
│   ├── popup.css       # Premium Styling
│   └── popup.js        # Controller Logic
├── website/            # Next.js Landing Page source
└── manifest.json       # Extension Config
```

---

## 🤝 Contributing

We welcome contributions! To add a new detection rule:
1.  Open `data/rules.json`.
2.  Add your pattern (DOM selector, Script variable, or Header).
3.  Submit a PR!

---

## 📜 License

MIT License - Built for the community.
**Developed by Chaitanyahoon**
