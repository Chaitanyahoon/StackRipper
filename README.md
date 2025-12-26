# StackRipper 🚀

Master tech detection with a warm, cozy aesthetic. StackRipper detects frontend frameworks, backend technologies, CMS, hosting providers, and more with a friendly and clean interface.

## Features
- **Fast Detection**: Uses content scripts and background header scanning.
- **Cozy UI**: Warm-themed, soft interface for a pleasant developer experience.
- **Accurate Rules**: Fingerprint-based detection for popular technologies.
- **Expandable**: Easily add new detection rules in `data/rules.json`.

## Installation Instructions

1. **Clone/Download** this repository to your local machine.
2. Open **Google Chrome**.
3. Navigate to `chrome://extensions/`.
4. Enable **Developer mode** (toggle switch in the top right).
5. Click **Load unpacked**.
6. Select the `StackRipper` folder.

## How to use
- Visit any website (e.g., [react.js](https://react.dev), [wordpress.org](https://wordpress.org)).
- Click the **StackRipper** icon in your extension bar.
- See the tech stack reveal itself with a sleek animation.

## Tech Stack
- Manifest V3
- JavaScript (Service Worker + Content Scripts)
- CSS (Custom Cyberpunk Theme)
- Chrome Storage & WebRequest APIs

## Adding New Rules
Open `data/rules.json` and add a new entry to the `technologies` array:
```json
{
  "name": "MyTech",
  "category": "Frontend",
  "patterns": {
    "dom": ["#my-tech-id"],
    "scripts": ["my-tech\\.js"],
    "headers": ["X-My-Tech-Header"]
  }
}
```
