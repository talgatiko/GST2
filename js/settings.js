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
        
        // Удаляем однострочные (//) и многострочные (/* ... */) комментарии перед парсингом
        // Этот regex удаляет комментарии, сохраняя при этом строки JSON
        let cleanedJsonString = jsonStringWithComments.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

        // Удаляем возможный BOM (Byte Order Mark) и обрезаем пробельные символы
        const trimmedString = cleanedJsonString.replace(/^\uFEFF/, '').trim();

        // Проверяем, что строка не пустая и является JSON-объектом
        if (!trimmedString || !trimmedString.startsWith('{') || !trimmedString.endsWith('}')) {
            errorLog("Ошибка при парсинге настроек из UI: Введенные данные не являются валидным JSON объектом или пусты.");
            alert("Ошибка: Введенные настройки не являются валидным JSON объектом. Пожалуйста, проверьте формат.");
            return false; // Прерываем выполнение, если строка невалидна
        }
        
        // Дополнительно удаляем управляющие символы (перевод строки, возврат каретки, табуляция) перед парсингом
        const sanitizedString = trimmedString.replace(/[\n\r\t]/g, '');

        // Парсим очищенную и санитизированную строку JSON
        const settings = JSON.parse(sanitizedString);

        // Обновляем текущие настройки объекта
        Object.assign(this, settings);
        debugLog("Настройки успешно обновлены из UI (после удаления комментариев)");
        this.updateSaveButtonState(); // Обновляем состояние кнопки Сохранить
        return true;
      } catch (error) {
        // Возвращаем базовую обработку ошибок, так как мы пытаемся исправить ввод автоматически
        errorLog(`Ошибка при парсинге настроек из UI: ${error.message}. Убедитесь, что формат JSON корректен.`);
        alert(`Ошибка при парсинге настроек: ${error.message}. Проверьте синтаксис JSON.`); // Уведомление для пользователя
        return false;
      }
    }
    return false;
  }

  updateUI() {
    debugLog("Обновление UI настроек...");
    if (this.settingsElement) {
      const settings = this.getCurrentSettings(); // Use getCurrentSettings to get all properties

    try {
      // Просто отображаем текущие настройки как JSON
      this.settingsElement.value = JSON.stringify(settings, null, 2);
      debugLog("UI настроек успешно обновлен");
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
