/**
 * Unicorn Spy Detector — Background service worker.
 * Sets defaults on install, keeps the toolbar badge in sync and
 * handles the keyboard shortcut that toggles protection.
 */

const VERSION = chrome.runtime.getManifest().version;
const DEFAULTS = { blockTracking: true, trackingCount: 0, lastTracking: null };

function paintBadge(on) {
  chrome.action.setBadgeText({ text: on ? '' : 'OFF' });
  chrome.action.setBadgeBackgroundColor({ color: '#6a1b9a' });
  chrome.action.setBadgeTextColor?.({ color: '#ffffff' });
}

function syncBadge() {
  chrome.storage.local.get({ blockTracking: true }, ({ blockTracking }) => paintBadge(blockTracking));
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(DEFAULTS, (current) =>
    chrome.storage.local.set({ ...current, version: VERSION }, syncBadge));
});

chrome.runtime.onStartup.addListener(syncBadge);

chrome.commands.onCommand.addListener((command) => {
  if (command !== 'toggle-protection') return;
  chrome.storage.local.get({ blockTracking: true }, ({ blockTracking }) =>
    chrome.storage.local.set({ blockTracking: !blockTracking }));
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.blockTracking) paintBadge(changes.blockTracking.newValue);
});

syncBadge();