/**
 * Unicorn Spy Detector — Page bridge (isolated world).
 * Connects chrome.storage with the in-page protector and keeps stats.
 */

const TAG = 'USD_v1';

function pushState(enabled) {
  window.postMessage({ __usd: TAG, type: 'state', enabled }, '*');
}

try {
  chrome.storage.local.get({ blockTracking: true }, ({ blockTracking }) => pushState(blockTracking));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.blockTracking) pushState(changes.blockTracking.newValue);
  });
} catch (_) {}

// Batched stats writer to avoid hammering storage.
let pending = 0, timer = null;
function flush() {
  const add = pending; pending = 0; timer = null;
  if (!add) return;
  try {
    chrome.storage.local.get({ trackingCount: 0 }, ({ trackingCount }) => {
      chrome.storage.local.set({
        trackingCount: trackingCount + add,
        lastTracking: new Date().toLocaleTimeString()
      });
    });
  } catch (_) {}
}

window.addEventListener('message', (e) => {
  if (e.source !== window) return;
  const d = e.data;
  if (!d || d.__usd !== TAG) return;
  if (d.type === 'hello') {
    try {
      chrome.storage.local.get({ blockTracking: true }, ({ blockTracking }) => pushState(blockTracking));
    } catch (_) {}
  } else if (d.type === 'track') {
    pending++;
    if (!timer) timer = setTimeout(flush, 1000);
  }
});

// =========================================================================
// Polymorphic style injector (Runs ONCE per page load in ISOLATED world)
// Bypasses strict CSP restrictions (e.g., on GitHub)
// =========================================================================
let styleInjected = false;
const injectSelectStyle = () => {
  if (!document.head || styleInjected) return;
  
  const s = document.createElement('style');
  // Generate a random number of spaces and empty lines
  const rSpace = () => ' '.repeat(Math.floor(Math.random() * 4));
  const rLine = () => '\n'.repeat(Math.floor(Math.random() * 2));
  
  // Build CSS that looks unique every time to anti-fraud systems
  s.textContent = `${rLine()}html * {${rSpace()}-webkit-user-select: text !important;${rSpace()}` +
                  `-moz-user-select: text !important;${rLine()}` +
                  `-ms-user-select: text !important;${rSpace()}user-select: text !important;${rSpace()}}${rLine()}`;
  
  document.head.appendChild(s);
  styleInjected = true;
};

injectSelectStyle();
document.addEventListener('DOMContentLoaded', injectSelectStyle);