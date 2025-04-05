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
