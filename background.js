/**
 * Unicorn Spy Detector - Background Service Worker
 * 
 * Отвечает за инициализацию хранилища и обработку событий расширения
 */

// Версия расширения
const VERSION = '1.0.1';

// Инициализация хранилища при установке расширения
chrome.runtime.onInstalled.addListener((details) => {
  // Значения по умолчанию
  const defaultSettings = { 
    blockTracking: true, 
    trackingCount: 0,
    lastTracking: null,
    installDate: new Date().toISOString(),
    version: VERSION
  };

  // Установка значений по умолчанию
  chrome.storage.local.set(defaultSettings);

  // Вывод сообщения при первой установке
  if (details.reason === 'install') {
    console.log('Unicorn Spy Detector успешно установлен!');
  } else if (details.reason === 'update') {
    console.log(`Unicorn Spy Detector обновлен до версии ${VERSION}`);
  }
});