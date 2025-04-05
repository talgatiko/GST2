// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
  debugLog("DOM загружен, начало инициализации приложения");

  try {
    // Отображаем версию в консоли
    console.log("Голосовой робот-демонстратор v1.4 запущен");

    // Создаем экземпляр голосового бота
    debugLog("Создание экземпляра VoiceBot");
    const voiceBot = new VoiceBot();

    // Инициализация системы
    debugLog("Запуск инициализации VoiceBot");
    await voiceBot.initialize();
    debugLog("Инициализация VoiceBot завершена");

    // Обработчики событий UI
    debugLog("Настройка обработчиков событий UI");
    document.getElementById('toggle-bot').addEventListener('click', () => {
      debugLog("Нажата кнопка переключения бота");
      if (voiceBot.isActive) {
        voiceBot.stop();
      } else {
        voiceBot.start();
      }
    });

    document.getElementById('save-settings').addEventListener('click', () => {
      debugLog("Нажата кнопка сохранения настроек");
      voiceBot.updateSettings();
    });

    document.getElementById('reset-settings').addEventListener('click', () => {
      debugLog("Нажата кнопка сброса настроек");
      voiceBot.resetSettings();
    });

    document.getElementById('clear-log').addEventListener('click', () => {
      debugLog("Нажата кнопка очистки лога");
      voiceBot.logger.clear();
    });

    debugLog("Все обработчики событий настроены");
    debugLog("Инициализация приложения завершена успешно");
  } catch (error) {
    errorLog(`Критическая ошибка при инициализации приложения: ${error.message}`);
    // Отображаем ошибку в UI
    const statusElement = document.getElementById('status-text');
    if (statusElement) {
      statusElement.textContent = `Статус: Ошибка - ${error.message}`;
      statusElement.style.color = 'red';
    }
  }
});

// Модальное окно для ввода API-ключа
document.addEventListener('DOMContentLoaded', function() {
  const apiKeyModal = document.getElementById('api-key-modal');
  const apiKeyInput = document.getElementById('api-key-input');
  const saveApiKeyButton = document.getElementById('save-api-key');
  const closeButton = document.querySelector('.close');
  const settings = new Settings();

  // Функция для показа модального окна
  function showApiKeyModal() {
    apiKeyModal.style.display = "block";
  }

  // Функция для скрытия модального окна
  function hideApiKeyModal() {
    apiKeyModal.style.display = "none";
  }

  // Проверяем, установлен ли API-ключ
  if (!settings.apiKey) {
    showApiKeyModal();
  }

  // Обработчик события для кнопки "Сохранить"
  saveApiKeyButton.addEventListener('click', function() {
    const apiKey = apiKeyInput.value;
    settings.apiKey = apiKey;
    settings.save();
    hideApiKeyModal();
  });

  // Обработчик события для кнопки "Закрыть"
  closeButton.addEventListener('click', function() {
    hideApiKeyModal();
  });

  // Обработчик события для клика вне модального окна
  window.addEventListener('click', function(event) {
    if (event.target == apiKeyModal) {
      hideApiKeyModal();
    }
  });
});
