/**
 * Класс для управления настройками
 */
class Settings {
  constructor(settingsElementId = 'settings-input') {
    debugLog("Инициализация настроек...");
    this.settingsElement = document.getElementById(settingsElementId);
    this.saveButton = document.getElementById('save-settings');

    // Загружаем настройки по умолчанию
    this.loadDefaults();
    debugLog("Настройки по умолчанию созданы");

    // Сохраняем начальное состояние настроек
    this.initialSettings = JSON.stringify(this.getCurrentSettings());

    // Обновляем состояние кнопки "Сохранить" при изменении настроек
    this.settingsElement.addEventListener('input', () => this.updateSaveButtonState());
  }

  // Получение текущих настроек
  getCurrentSettings() {
    return {
      apiUrl: this.apiUrl,
      apiKey: this.apiKey,
      systemPrompt: this.systemPrompt,
      greetingText: this.greetingText,
      model: this.model,
      temperature: this.temperature, // Добавлено
      max_tokens: this.max_tokens,   // Добавлено
      language: this.language,
      useStreaming: this.useStreaming,
      waitingPhrases: this.waitingPhrases,
      waitingInterval: this.waitingInterval,
      conversationStages: this.conversationStages
    };
  }

  // Обновление состояния кнопки "Сохранить"
  updateSaveButtonState() {
    const currentSettings = JSON.stringify(this.getCurrentSettings());
    const hasChanges = currentSettings !== this.initialSettings;
    this.saveButton.disabled = !hasChanges;
    this.saveButton.style.backgroundColor = hasChanges ? '#2ecc71' : '#3498db'; // Green if enabled
  }

  // Загрузка настроек по умолчанию
  loadDefaults() {
    // Импортируем из default-settings.js
    this.apiUrl = DEFAULT_SETTINGS.apiUrl;
    this.apiKey = DEFAULT_SETTINGS.apiKey;
    this.systemPrompt = DEFAULT_SETTINGS.systemPrompt;
    this.greetingText = DEFAULT_SETTINGS.greetingText;
    this.model = DEFAULT_SETTINGS.model;
    this.temperature = DEFAULT_SETTINGS.temperature; // Добавлено
    this.max_tokens = DEFAULT_SETTINGS.max_tokens;   // Добавлено
    this.language = DEFAULT_SETTINGS.language;
    this.useStreaming = DEFAULT_SETTINGS.useStreaming;
    this.waitingPhrases = DEFAULT_SETTINGS.waitingPhrases;
    this.waitingInterval = DEFAULT_SETTINGS.waitingInterval;
    this.conversationStages = DEFAULT_SETTINGS.conversationStages;
  }

  save() {
    debugLog("Сохранение настроек в localStorage...");
    const settings = this.getCurrentSettings(); // Используем getCurrentSettings

    try {
      localStorage.setItem('voiceBotSettings', JSON.stringify(settings));
      debugLog("Настройки успешно сохранены");
      this.initialSettings = JSON.stringify(this.getCurrentSettings()); // Update initial settings
      this.updateSaveButtonState(); // Update button state after saving
    } catch (error) {
      errorLog(`Ошибка при сохранении настроек: ${error.message}`);
    }
  }

  load() {
    debugLog("Загрузка настроек из localStorage...");
    const savedSettings = localStorage.getItem('voiceBotSettings');

    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        Object.assign(this, settings);
        this.apiKey = settings.apiKey || this.apiKey;
        debugLog("Настройки успешно загружены из localStorage");
      } catch (error) {
        errorLog(`Ошибка при загрузке настроек: ${error.message}`);
      }
    } else {
      debugLog("Сохраненные настройки не найдены, используются значения по умолчанию");
    }

    this.updateUI();
  }

  updateFromUI() {
    debugLog("Обновление настроек из пользовательского интерфейса...");
    if (this.settingsElement) {
      try {
        // Получаем текст настроек из UI
        const jsonStringWithComments = this.settingsElement.value;
        
        // Удаляем однострочные комментарии (// ...) перед парсингом
        // Этот regex удаляет строки, начинающиеся с // (с возможными пробелами перед ними)
        const cleanedJsonString = jsonStringWithComments.replace(/^\s*\/\/.*$/gm, ''); 
        
        // Парсим очищенный JSON
        const settings = JSON.parse(cleanedJsonString);
        
        // Обновляем текущие настройки объекта
        Object.assign(this, settings);
        debugLog("Настройки успешно обновлены из UI (после удаления комментариев)");
        this.updateSaveButtonState(); // Обновляем состояние кнопки Сохранить
        return true;
      } catch (error) {
        errorLog(`Ошибка при парсинге настроек из UI: ${error.message}. Убедитесь, что формат JSON корректен (даже без комментариев).`);
        // Можно добавить уведомление для пользователя здесь, если нужно
        return false;
      }
    }
    return false;
  }

  updateUI() {
    debugLog("Обновление UI настроек...");
    if (this.settingsElement) {
      const settings = {
        apiUrl: this.apiUrl,
      apiKey: this.apiKey,
      systemPrompt: this.systemPrompt,
      greetingText: this.greetingText,
      model: this.model,
      temperature: this.temperature, // Добавлено
      max_tokens: this.max_tokens,   // Добавлено
      language: this.language,
      useStreaming: this.useStreaming,
      waitingPhrases: this.waitingPhrases,
      waitingInterval: this.waitingInterval,
      conversationStages: this.conversationStages
    };

    try {
      // Формируем JSON с комментариями
      const settingsWithComments = {
        "// URL API для запросов к языковой модели": "",
        "apiUrl": settings.apiUrl,
        "// Ключ API для аутентификации запросов": "",
        "apiKey": settings.apiKey,
        "// Идентификатор используемой языковой модели (например, 'gpt-3.5-turbo', 'deepseek/deepseek-chat')": "",
        "model": settings.model,
        "// Температура ответа (от 0 до 1). Влияет на случайность/креативность ответа. Выше значение - более случайный ответ.": "",
        "temperature": settings.temperature,
        "// Максимальное количество токенов (слов/частей слов) в ответе модели.": "",
        "max_tokens": settings.max_tokens,
        "// Системный промпт (инструкция), который задает роль и поведение для ИИ.": "",
        "systemPrompt": settings.systemPrompt,
        "// Приветственное сообщение, которое бот произносит при запуске.": "",
        "greetingText": settings.greetingText,
        "// Язык для распознавания и синтеза речи (например, 'ru-RU', 'en-US').": "",
        "language": settings.language,
        "// Использовать ли потоковую передачу ответа от API (если поддерживается). Ответ будет воспроизводиться по мере поступления.": "",
        "useStreaming": settings.useStreaming,
        "// Фразы, которые бот периодически произносит во время ожидания команды пользователя.": "",
        "waitingPhrases": settings.waitingPhrases,
        "// Интервал (в миллисекундах), через который бот произносит ожидающую фразу, если нет активности.": "",
        "waitingInterval": settings.waitingInterval,
        "// Определение этапов разговора, ключевых слов для перехода и соответствующих промптов.": "",
        "conversationStages": settings.conversationStages
      };

      this.settingsElement.value = JSON.stringify(settingsWithComments, null, 2);
      debugLog("UI настроек успешно обновлен с комментариями");
      } catch (error) {
        errorLog(`Ошибка при обновлении UI настроек: ${error.message}`);
      }
    } else {
      errorLog("Элемент настроек не найден в DOM");
    }
    this.updateSaveButtonState(); // Update button state after updating UI
  }

  update(settingsObj) {
    Object.assign(this, settingsObj);
    this.updateUI();
  }

  reset() {
    debugLog("Сброс настроек на значения по умолчанию...");
    this.loadDefaults();
    this.updateUI();
    debugLog("Настройки успешно сброшены до значений по умолчанию");
  }
}
