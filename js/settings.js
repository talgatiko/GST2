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
    this.language = DEFAULT_SETTINGS.language;
    this.useStreaming = DEFAULT_SETTINGS.useStreaming;
    this.waitingPhrases = DEFAULT_SETTINGS.waitingPhrases;
    this.waitingInterval = DEFAULT_SETTINGS.waitingInterval;
    this.conversationStages = DEFAULT_SETTINGS.conversationStages;
  }

  save() {
    debugLog("Сохранение настроек в localStorage...");
    const settings = {
      apiUrl: this.apiUrl,
      apiKey: this.apiKey,
      systemPrompt: this.systemPrompt,
      greetingText: this.greetingText,
      model: this.model,
      language: this.language,
      useStreaming: this.useStreaming,
      waitingPhrases: this.waitingPhrases,
      waitingInterval: this.waitingInterval,
      conversationStages: this.conversationStages
    };

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
        const settings = JSON.parse(this.settingsElement.value);
        Object.assign(this, settings);
        debugLog("Настройки успешно обновлены из UI");
        this.updateSaveButtonState(); // Update button state after updating from UI
        return true;
      } catch (error) {
        errorLog(`Ошибка при парсинге настроек: ${error.message}`);
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
        language: this.language,
        useStreaming: this.useStreaming,
        waitingPhrases: this.waitingPhrases,
        waitingInterval: this.waitingInterval,
        conversationStages: this.conversationStages
      };

      try {
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
