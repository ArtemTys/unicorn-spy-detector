# 🦄 Unicorn Spy Detector

![version](https://img.shields.io/badge/version-1.1.0-a855f7)
![manifest](https://img.shields.io/badge/manifest-v3-6a1b9a)
![platform](https://img.shields.io/badge/Chrome-111%2B-blue)
![license](https://img.shields.io/badge/license-MIT-green)

A lightweight Chrome extension that stops websites from spying on **how you use
your tabs**. It makes every page believe your tab is always visible and focused,
blocks clipboard snooping, and frees copy, text selection and the right-click
menu — so nobody watches you and nothing is locked away from you.

> 100% local. No network requests, no analytics, one permission (`storage`).

## ✨ Features

- **Native code masking** — Overrides `Function.prototype.toString` to return `[native code]` for all patched methods, bypassing strict prototype pollution detection.
- **Always-visible tab** — Spoofs `visibilityState`, `hidden` and the `visibilitychange` event (injected into the page's *main world*).
- **Smart event filtering** — Checks the `e.isTrusted` flag to swallow only real user blur/visibility events, letting synthetic anti-fraud checks pass through undetected.
- **Anti-throttling engine** — Uses a zero-volume Web Audio loop (`Silent Audio Hack`) to prevent the browser from throttling `setTimeout` and `requestAnimationFrame` when the tab is hidden.
- **Always-focused** — Overrides `document.hasFocus()` and neutralizes window `blur` / page `freeze` events used by proctoring tools.
- **Clipboard guard** — Blocks `navigator.clipboard.read()` / `readText()` with native getter spoofing so pages can't read your buffer.
- **Freedom mode** — Restores copy, cut, paste, text selection, and the context menu on sites that try to lock them.
- **Idle spoofing** — Simulates natural mouse movement only while the tab is truly hidden.
- **One switch** — Toggle from the popup or with `Alt + Shift + U`.

## 📦 Installation

1. Download the latest build from [Releases](https://github.com/TemaTys/unicorn-spy-detector/releases) (or clone this repo).
2. Open `chrome://extensions/`.
3. Enable **Developer mode** (top-right).
4. Click **Load unpacked** and select the project folder.
5. Done — the 🦄 icon appears in your toolbar.

## 🎛 Usage

- Click the toolbar icon to open the popup and flip **Protection on/off**.
- Or press **`Alt + Shift + U`** anywhere to toggle instantly.
- The badge shows **OFF** when protection is disabled.
- The popup counts blocked spying attempts and shows the last one.

## 🧪 Testing Dashboard

The repository includes a local `test.html` file that acts as a strict anti-fraud simulator (honeypot). Simply open it in your browser with the extension enabled to verify the protection. 

The dashboard actively tests:
- **API Leaks:** Checks if modified methods (`document.hidden`, `hasFocus`) pass the `[native code]` `toString()` validation.
- **Dynamic Traps:** Dispatches synthetic `blur` and `visibilitychange` events to see if the extension incorrectly swallows trusted vs untrusted events.
- **Freedom Mode:** Verifies if text selection and context menus are successfully forced to work.

## 🔍 How it works

| Layer | World | Job |
|-------|-------|-----|
| `protector.js` | `MAIN` | Patches page APIs & events, simulates activity |
| `bridge.js` | `ISOLATED` | Syncs the on/off state and stats via `chrome.storage` |
| `background.js` | worker | Defaults, toolbar badge, keyboard shortcut |
| `popup.html/js` | popup | Minimal control panel |

The two content scripts talk through namespaced `window.postMessage`, which
keeps state in sync across the isolated and main worlds without leaking data.

## ⚠️ Limitations

- Synthetic mouse events carry `isTrusted: false`; trackers that strictly check this flag will ignore the fake idle movements (though most simple idle timers don't care).
- This tool is a Client-side Security Research PoC. It defends your **privacy** and tests DOM vulnerabilities; it is not meant for cheating in exams or violating platform rules.

## 🗂 Project structure

```
unicorn-spy-detector/
├── manifest.json
├── background.js
├── bridge.js
├── test.html         <-- Test dashboard
├── protector.js
├── popup.html
├── popup.js
├── icons/ (16, 48, 128 px)
├── LICENSE 
└── README.md
```

## 📄 License

MIT © [Artem Tysiatskii](https://github.com/TemaTys)
````
