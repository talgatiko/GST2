/**
 * Класс для распознавания речи
 */
class SpeechRecognizer {
  constructor() {
    debugLog("Инициализация распознавателя речи...");
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const errorMsg = 'API распознавания речи не поддерживается в вашем браузере';
      errorLog(errorMsg);
      throw new Error(errorMsg);
    }
    
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.isListening = false;
    this.language = 'ru-RU';
    this.initialized = false;
    this._shouldBeListening = false; // Флаг желаемого состояния
    this.onErrorCallback = null;
    
    // Настройка автоматического перезапуска при завершении
    this.recognition.onend = () => {
      debugLog("Сеанс распознавания завершился");
      // Сбрасываем флаг, так как сеанс завершился
      this.isListening = false;
      
      // Если бот должен продолжать слушать, запускаем новый сеанс
      if (this._shouldBeListening) {
        debugLog("Автоматический перезапуск распознавания после onend");
        setTimeout(() => {
          if (this._shouldBeListening) {
            this.start();
          }
        }, 300);
      }
    };
    
    // Настройка обработки ошибок с автоматическим перезапуском
    this.recognition.onerror = (event) => {
      if (this.onErrorCallback) {
        this.onErrorCallback(event.error);
      }
      
      if (event.error === 'no-speech') {
        // При отсутствии речи перезапускаем без лишних логов
        debugLog("Ошибка 'no-speech' - перезапуск распознавания");
        setTimeout(() => {
          if (this._shouldBeListening) {
            this.start();
          }
        }, 300);
      } else {
        // Прочие ошибки тоже обрабатываем
        errorLog(`Ошибка распознавания: ${event.error}`);
        setTimeout(() => {
          if (this._shouldBeListening) {
            this.start();
          }
        }, 1000);
      }
    };
    
    debugLog("Распознаватель речи создан успешно");
  }
  
  // Метод, который инициализирует микрофон только один раз
  async initialize() {
    debugLog("Начало инициализации микрофона...");
    if (this.initialized) {
      debugLog("Микрофон уже инициализирован");
      return;
    }
    
    try {
      // Запрашиваем доступ к микрофону один раз
      debugLog("Запрос разрешения на доступ к микрофону...");
      await navigator.mediaDevices.getUserMedia({ audio: true });
      this.initialized = true;
      debugLog("Доступ к микрофону получен успешно");
      return true;
    } catch (error) {
      const errorMsg = `Не удалось получить доступ к микрофону: ${error.message}`;
      errorLog(errorMsg);
      throw new Error(errorMsg);
    }
  }
  
  start() {
    if (!this.initialized) {
      const errorMsg = 'Микрофон не инициализирован. Вызовите initialize() сначала.';
      errorLog(errorMsg);
      throw new Error(errorMsg);
    }
    
    // Устанавливаем флаг, что бот должен слушать
    this._shouldBeListening = true;
    
    if (!this.isListening) {
      debugLog("Запуск распознавания речи...");
      this.recognition.lang = this.language;
      
      try {
        this.recognition.start();
        this.isListening = true;
        debugLog("Распознавание речи успешно запущено");
      } catch (error) {
        errorLog(`Ошибка при запуске распознавания речи: ${error.message}`);
        // Попробуем перезапустить через небольшую задержку
        setTimeout(() => {
          if (this._shouldBeListening) {
            this.start();
          }
        }, 1000);
      }
    } else {
      debugLog("Распознаватель речи уже активен");
    }
  }
  
  stop() {
    // Сначала устанавливаем флаг, что бот не должен больше слушать
    this._shouldBeListening = false;
    
    if (this.isListening) {
      debugLog("Остановка распознавания речи...");
      
      try {
        this.recognition.stop();
        this.isListening = false;
        debugLog("Распознавание речи остановлено");
      } catch (error) {
        errorLog(`Ошибка при остановке распознавания речи: ${error.message}`);
      }
    } else {
      debugLog("Распознаватель речи уже неактивен");
    }
  }
  
  setLanguage(lang) {
    debugLog(`Установка языка распознавания: ${lang}`);
    this.language = lang;
  }
  
  onResult(callback) {
    debugLog("Настройка обработчика результатов распознавания...");
    this.recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const text = event.results[last][0].transcript;
      debugLog(`Распознанный текст: "${text}"`);
      callback(text);
    };
    debugLog("Обработчик результатов настроен");
  }
  
  onError(callback) {
    debugLog("Настройка обработчика ошибок распознавания...");
    this.onErrorCallback = callback;
    debugLog("Обработчик ошибок настроен");
  }
}
