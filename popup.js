/**
 * Unicorn Spy Detector — Popup UI.
 * Reads/writes settings in chrome.storage and reflects live stats.
 */

const $ = (id) => document.getElementById(id);

function setStatus(on) {
  $('toggle').checked = on;
  $('status').textContent = on ? 'Protection on' : 'Protection off';
  $('status').className = 'status ' + (on ? 'on' : 'off');
}

chrome.storage.local.get(
  { blockTracking: true, trackingCount: 0, lastTracking: null, version: chrome.runtime.getManifest().version },
  (d) => {
    setStatus(d.blockTracking);
    $('count').textContent = d.trackingCount;
    $('last').textContent = d.lastTracking || '—';
    $('version').textContent = d.version;
  }
);

$('toggle').addEventListener('change', (e) =>
  chrome.storage.local.set({ blockTracking: e.target.checked }));

$('reset').addEventListener('click', () =>
  chrome.storage.local.set({ trackingCount: 0, lastTracking: null }));

chrome.storage.onChanged.addListener((c, area) => {
  if (area !== 'local') return;
  if (c.blockTracking) setStatus(c.blockTracking.newValue);
  if (c.trackingCount) $('count').textContent = c.trackingCount.newValue || 0;
  if (c.lastTracking) $('last').textContent = c.lastTracking.newValue || '—';
});