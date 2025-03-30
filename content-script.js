/**
 * Unicorn Spy Detector - Защита от отслеживания активности пользователя в браузере
 * 
 * Этот скрипт защищает от слежки за вкладками и буфером обмена путем:
 * - Перехвата попыток определить видимость вкладки
 * - Блокировки события потери фокуса
 * - Защиты от отслеживания буфера обмена
 * - Подмены событий копирования/вставки
 * - Симуляции активности пользователя
 */

// Глобальные переменные состояния
let protectionEnabled = true; // Состояние защиты (вкл/выкл)
let lastVisibilityCheck = 0;  // Время последней проверки видимости
let localTrackingCount = 0;   // Локальный счетчик попыток отслеживания

// Инициализация настроек из storage API
chrome.storage.local.get(['blockTracking', 'trackingCount'], (settings) => {
  protectionEnabled = settings.blockTracking !== false; // По умолчанию включено
  localTrackingCount = settings.trackingCount || 0;
  initializeProtection();
});

// Отслеживание изменений настроек
chrome.storage.onChanged.addListener((changes) => {
  if (changes.blockTracking) {
    protectionEnabled = changes.blockTracking.newValue;
  }
});

/**
 * Логирует попытку отслеживания и обновляет счетчик
 */
function logTrackingAttempt() {
  if (!protectionEnabled) return;
  
  try {
    localTrackingCount++;
    chrome.storage.local.get(['trackingCount'], (data) => {
      const newCount = (data.trackingCount || 0) + 1;
      chrome.storage.local.set({ 
        trackingCount: newCount,
        lastTracking: new Date().toLocaleTimeString()
      });
    });
  } catch (e) {
    // Игнорируем ошибки при логировании
  }
}

/**
 * Запускает все механизмы защиты
 */
function initializeProtection() {
  overrideVisibilityProperties();
  protectClipboard();
  blockFocusEvents();
  protectModernClipboardAPI();
  enableCopyOnProtectedSites();
}

/**
 * Перехватывает и подменяет свойства видимости документа
 */
function overrideVisibilityProperties() {
  // Перехват свойств hidden/webkitHidden
  ['hidden', 'webkitHidden'].forEach(prop => {
    try {
      Object.defineProperty(Document.prototype, prop, {
        get: function() {
          const now = Date.now();
          if (now - lastVisibilityCheck > 500 && protectionEnabled) {
            lastVisibilityCheck = now;
            logTrackingAttempt();
          }
          return false; // Всегда возвращаем "видимо"
        },
        configurable: true
      });
    } catch (e) {
      // Игнорируем ошибки совместимости
    }
  });

  // Перехват свойств visibilityState/webkitVisibilityState
  ['visibilityState', 'webkitVisibilityState'].forEach(prop => {
    try {
      Object.defineProperty(Document.prototype, prop, {
        get: function() {
          const now = Date.now();
          if (now - lastVisibilityCheck > 500 && protectionEnabled) {
            lastVisibilityCheck = now;
            logTrackingAttempt();
          }
          return 'visible'; // Всегда возвращаем "видимо"
        },
        configurable: true
      });
    } catch (e) {
      // Игнорируем ошибки совместимости
    }
  });

  // Блокировка события изменения видимости
  document.addEventListener('visibilitychange', e => {
    if (!protectionEnabled) return;
    logTrackingAttempt();
    e.stopImmediatePropagation();
  }, true);

  // Запуск симуляции активности мыши
  simulateMouseActivity();
}

/**
 * Симулирует активность пользователя для обхода систем отслеживания
 */
function simulateMouseActivity() {
  if (!protectionEnabled) return;
  
  let lastX = Math.floor(Math.random() * window.innerWidth);
  let lastY = Math.floor(Math.random() * window.innerHeight);
  
  setInterval(() => {
    if (!protectionEnabled) return;
    
    const isSmooth = Math.random() > 0.3; // В 70% случаев плавное движение
    const targetX = Math.floor(Math.random() * window.innerWidth);
    const targetY = Math.floor(Math.random() * window.innerHeight);
    
    if (isSmooth) {
      // Плавное движение курсора к цели
      const steps = 5 + Math.floor(Math.random() * 10);
      const stepX = (targetX - lastX) / steps;
      const stepY = (targetY - lastY) / steps;
      
      let currentStep = 0;
      const smoothMove = setInterval(() => {
        if (!protectionEnabled || currentStep >= steps) {
          clearInterval(smoothMove);
          return;
        }
        
        lastX += stepX;
        lastY += stepY;
        
        fireMouseEvent(lastX, lastY);
        currentStep++;
      }, 50 + Math.random() * 50);
    } else {
      // Мгновенное перемещение курсора
      lastX = targetX;
      lastY = targetY;
      fireMouseEvent(lastX, lastY);
    }
    
    // Случайные клики (примерно в 10% случаев)
    if (Math.random() < 0.1) {
      setTimeout(() => {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: lastX,
          clientY: lastY
        });
        
        const element = document.elementFromPoint(lastX, lastY);
        if (element && !element.matches('input, textarea, select, button, a')) {
          element.dispatchEvent(clickEvent);
        }
      }, 100 + Math.random() * 200);
    }
  }, 5000 + Math.random() * 10000);
  
  /**
   * Генерирует событие движения мыши
   * @param {number} x - X-координата
   * @param {number} y - Y-координата
   */
  function fireMouseEvent(x, y) {
    try {
      const mouseEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y
      });
      
      document.dispatchEvent(mouseEvent);
      
      const elementUnderCursor = document.elementFromPoint(x, y);
      if (elementUnderCursor) {
        elementUnderCursor.dispatchEvent(mouseEvent);
      }
    } catch (e) {
      // Игнорируем ошибки событий
    }
  }
}

/**
 * Защищает буфер обмена от отслеживания
 */
function protectClipboard() {
  // Защита события копирования
  window.addEventListener('copy', e => {
    if (!protectionEnabled) return;
    const selectedText = window.getSelection().toString();
    if (selectedText) {
      try {
        e.clipboardData.setData('text/plain', selectedText);
        logTrackingAttempt();
        e.preventDefault();
        e.stopImmediatePropagation();
      } catch (err) {
        // Игнорируем ошибки буфера обмена
      }
    }
  }, true);

  // Защита события вырезания
  window.addEventListener('cut', e => {
    if (!protectionEnabled) return;
    const selectedText = window.getSelection().toString();
    if (selectedText) {
      try {
        e.clipboardData.setData('text/plain', selectedText);
        logTrackingAttempt();
        e.preventDefault();
        e.stopImmediatePropagation();
      } catch (err) {
        // Игнорируем ошибки буфера обмена
      }
    }
  }, true);
}

/**
 * Блокирует события фокуса/расфокусировки
 */
function blockFocusEvents() {
  ['blur', 'focus', 'focusin', 'focusout'].forEach(eventType => {
    window.addEventListener(eventType, e => {
      if (!protectionEnabled) return;
      logTrackingAttempt();
      e.stopImmediatePropagation();
    }, true);
  });
}

/**
 * Защищает современный Clipboard API
 */
function protectModernClipboardAPI() {
  if (navigator.clipboard) {
    // Защита метода чтения
    if (navigator.clipboard.readText) {
      const originalReadText = navigator.clipboard.readText;
      navigator.clipboard.readText = function() {
        if (protectionEnabled) {
          logTrackingAttempt();
          return Promise.reject(new DOMException('Not allowed', 'NotAllowedError'));
        }
        return originalReadText.apply(this, arguments);
      };
    }
    
    // Защита метода чтения (бинарный)
    if (navigator.clipboard.read) {
      const originalRead = navigator.clipboard.read;
      navigator.clipboard.read = function() {
        if (protectionEnabled) {
          logTrackingAttempt();
          return Promise.reject(new DOMException('Not allowed', 'NotAllowedError'));
        }
        return originalRead.apply(this, arguments);
      };
    }
  }
}

/**
 * Включает возможность копирования на защищенных сайтах
 */
function enableCopyOnProtectedSites() {
  const removeProtection = () => {
    if (!protectionEnabled) return;
    
    try {
      // Добавление стилей для включения выделения текста
      if (!document.getElementById('unicorn-copy-enabler')) {
        const style = document.createElement('style');
        style.id = 'unicorn-copy-enabler';
        style.innerHTML = `
          * {
            -webkit-user-select: auto !important;
            -moz-user-select: auto !important;
            -ms-user-select: auto !important;
            user-select: auto !important;
          }
        `;
        document.head.appendChild(style);
      }
      
      // Блокировка событий, мешающих копированию
      const blockingEvents = ['copy', 'cut', 'contextmenu', 'selectstart'];
      
      blockingEvents.forEach(eventType => {
        document.addEventListener(eventType, (e) => {
          if (!protectionEnabled) return;
          e.stopPropagation();
          return true;
        }, true);
      });
    } catch (e) {
      // Игнорируем ошибки DOM
    }
  };
  
  // Выполнение сразу после загрузки
  removeProtection();
  
  try {
    // Наблюдение за изменениями в DOM для повторного применения защиты
    const observer = new MutationObserver(() => {
      if (protectionEnabled) {
        removeProtection();
      }
    });
    
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { 
        childList: true,
        subtree: true
      });
      removeProtection();
    });
  } catch (e) {
    // Резервный вариант, если наблюдатель не работает
    setInterval(removeProtection, 3000);
  }
}

// Запуск защиты при загрузке скрипта
initializeProtection();