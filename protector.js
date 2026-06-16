/**
 * Unicorn Spy Detector — In-page protector (main world).
 * Red Teaming Edition: Native code spoofing, isTrusted bypassing, and Audio Hack.
 */

(() => {
  'use strict';

  const TAG = 'USD_v1';
  let enabled = true;

  // =========================================================================
  // LEVEL 1: THE MAGIC OF [native code] SPOOFING (Prototype Pollution Masking)
  // =========================================================================
  const originalToString = Function.prototype.toString;
  const fakeFunctions = new WeakMap();

  Function.prototype.toString = function() {
    if (fakeFunctions.has(this)) return fakeFunctions.get(this);
    return originalToString.call(this);
  };

  // --- Bridge with the isolated content script ---
  window.addEventListener('message', (e) => {
    if (e.source !== window) return;
    const d = e.data;
    if (d && d.__usd === TAG && d.type === 'state' && typeof d.enabled === 'boolean') {
      enabled = d.enabled;
    }
  });
  window.postMessage({ __usd: TAG, type: 'hello' }, '*');

  let lastReport = 0;
  const report = () => {
    const now = Date.now();
    if (now - lastReport < 500) return;
    lastReport = now;
    window.postMessage({ __usd: TAG, type: 'track' }, '*');
  };

  const nativeVis = (Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState') || {}).get;
  const reallyHidden = () => (nativeVis ? nativeVis.call(document) === 'hidden' : false);

  // =========================================================================
  // APPLYING THE MAGIC: Hiding our visibility getters
  // =========================================================================
  [['visibilityState', 'visible'], ['webkitVisibilityState', 'visible'],
   ['hidden', false], ['webkitHidden', false]].forEach(([prop, fake]) => {
    const native = Object.getOwnPropertyDescriptor(Document.prototype, prop);
    if (!native || !native.get) return;
    try {
      const fakeGetter = function () {
        if (!enabled) return native.get.call(this);
        report();
        return fake;
      };
      // Teaching the getter to lie about its own code!
      fakeFunctions.set(fakeGetter, `function get ${prop}() { [native code] }`);

      Object.defineProperty(Document.prototype, prop, {
        configurable: true,
        get: fakeGetter
      });
    } catch (_) {}
  });

  const nativeHasFocus = Document.prototype.hasFocus;
  try {
    const fakeHasFocus = function (...a) {
      if (!enabled) return nativeHasFocus.apply(this, a);
      report();
      return true;
    };
    fakeFunctions.set(fakeHasFocus, "function hasFocus() { [native code] }");
    Document.prototype.hasFocus = fakeHasFocus;
  } catch (_) {}

  // =========================================================================
  // LEVEL 2: BYPASSING DYNAMIC TRAPS (isTrusted)
  // =========================================================================
  const swallow = (e) => {
    if (!enabled) return;
    // If the script fires an event itself to check us — SKIP IT!
    if (e.isTrusted === false) return; 
    report();
    e.stopImmediatePropagation();
  };

  ['visibilitychange', 'webkitvisibilitychange', 'freeze', 'resume']
    .forEach((t) => document.addEventListener(t, swallow, true));

  window.addEventListener('blur', (e) => {
    if (!enabled || (e.target !== window && e.target !== document)) return;
    if (e.isTrusted === false) return; // Skip anti-fraud checks
    report();
    e.stopImmediatePropagation();
  }, true);

  // --- 3. Free copy / selection / context menu ---
  ['copy', 'cut', 'paste', 'contextmenu', 'selectstart', 'dragstart']
    .forEach((t) => document.addEventListener(t, (e) => {
      if (enabled && e.isTrusted) e.stopImmediatePropagation();
    }, true));

  // --- 4. Block clipboard reads by the page (With native spoofing) ---
  if (navigator.clipboard) {
    ['readText', 'read'].forEach((m) => {
      const orig = navigator.clipboard[m];
      if (typeof orig !== 'function') return;
      const fakeRead = function (...a) {
        if (!enabled) return orig.apply(this, a);
        report();
        return Promise.reject(new DOMException('Blocked by Unicorn Spy Detector', 'NotAllowedError'));
      };
      fakeFunctions.set(fakeRead, `function ${m}() { [native code] }`);
      navigator.clipboard[m] = fakeRead;
    });
  }

  // --- 5. Simulate human-like mouse movement (Bezier & Easing) ---
  let x = Math.random() * innerWidth, y = Math.random() * innerHeight;
  
  const move = (nx, ny) => {
    x = nx; y = ny;
    try {
      const ev = new MouseEvent('mousemove', {
        bubbles: true, cancelable: true, view: window, clientX: x, clientY: y
      });
      document.dispatchEvent(ev);
      const el = document.elementFromPoint(x, y);
      if (el) el.dispatchEvent(ev);
    } catch (_) {}
  };

  setInterval(() => {
    if (!enabled || !reallyHidden()) return;
    
    const startX = x;
    const startY = y;
    const targetX = Math.random() * innerWidth;
    const targetY = Math.random() * innerHeight;
    
    const curveX = (Math.random() - 0.5) * 300; 
    const curveY = (Math.random() - 0.5) * 300;
    
    const totalSteps = 15 + Math.floor(Math.random() * 20);
    let currentStep = 0;
    
    const glide = setInterval(() => {
      if (!enabled || ++currentStep > totalSteps) {
        return clearInterval(glide);
      }
      
      let t = currentStep / totalSteps;
      
      const easeT = (1 - Math.cos(Math.PI * t)) / 2;
      
      const currentX = startX + (targetX - startX) * easeT + (curveX * Math.sin(t * Math.PI));
      const currentY = startY + (targetY - startY) * easeT + (curveY * Math.sin(t * Math.PI));
      
      move(currentX, currentY);
    }, 20 + Math.random() * 20);
  }, 5000 + Math.random() * 8000);

  // =========================================================================
  // LEVEL 3: AUDIO HACK TO DEFEAT THROTTLING (Background Throttling)
  // =========================================================================
  const defeatThrottling = () => {
    try {
      if (document.getElementById('usd-audio-hack')) return;
      // This is the base64 code of an empty one-second WAV file (absolute silence)
      const silentWav = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
      const audio = new Audio(silentWav);
      audio.id = 'usd-audio-hack';
      audio.loop = true;
      
      // Browsers block autoplay, so we attach it to the first click on the page
      const playAudio = () => {
        audio.play().catch(() => {});
        window.removeEventListener('click', playAudio);
        window.removeEventListener('keydown', playAudio);
      };
      window.addEventListener('click', playAudio);
      window.addEventListener('keydown', playAudio);
    } catch (_) {}
  };
  defeatThrottling();
  document.addEventListener('DOMContentLoaded', defeatThrottling);

})();