/**
 * Unicorn Spy Detector - Popup Script
 * 
 * Управляет пользовательским интерфейсом всплывающего окна расширения
 */

// Версия расширения
const VERSION = '1.0.1';

// Обработчик изменения состояния переключателя блокировки
document.getElementById('blockTracking').addEventListener('change', (e) => {
  chrome.storage.local.set({ blockTracking: e.target.checked });
});

// Обработчик кнопки сброса статистики
document.getElementById('resetStats').addEventListener('click', () => {
  chrome.storage.local.set({ 
    trackingCount: 0,
    lastTracking: null
  });
});

/**
 * Загружает настройки из хранилища и обновляет интерфейс
 */
function loadSettings() {
  chrome.storage.local.get(
    ['blockTracking', 'trackingCount', 'lastTracking', 'version'], 
    (data) => {
      // Применяем значения с проверкой на null/undefined
      document.getElementById('blockTracking').checked = data.blockTracking ?? true;
      document.getElementById('trackingCount').textContent = data.trackingCount || 0;
      document.getElementById('lastTracking').textContent = data.lastTracking || '-';
      
      // Обновляем информацию о версии
      document.getElementById('version').textContent = data.version || VERSION;
    }
  );
}

// Загружаем настройки при открытии popup
loadSettings();

// Обновляем информацию, когда хранилище изменяется
chrome.storage.onChanged.addListener((changes) => {
  if (changes.trackingCount) {
    document.getElementById('trackingCount').textContent = changes.trackingCount.newValue || 0;
  }
  if (changes.lastTracking) {
    document.getElementById('lastTracking').textContent = changes.lastTracking.newValue || '-';
  }
});