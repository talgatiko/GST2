/**
 * Класс для синтеза речи
 */
class SpeechSynthesizer {
  constructor() {
    debugLog("Инициализация синтезатора речи...");
    if (!window.speechSynthesis) {
      const errorMsg = 'API синтеза речи не поддерживается в вашем браузере';
      errorLog(errorMsg);
      throw new Error(errorMsg);
    }
    
    this.synth = window.speechSynthesis;
    this.language = 'ru-RU';
    this.currentSpeech = null;
    debugLog("Проверка доступных голосов...");
    
    // Проверка доступных голосов
    const voices = this.synth.getVoices();
    debugLog(`Доступно ${voices.length} голосов`);
    
    debugLog("Синтезатор речи создан успешно");
  }
  
  setLanguage(lang) {
    debugLog(`Установка языка синтеза: ${lang}`);
    this.language = lang;
  }
  
  getVoice() {
    debugLog("Получение подходящего голоса...");
    const voices = this.synth.getVoices();
    if (voices.length === 0) {
      debugLog("Голоса еще не загружены, попытка переполучения...");
      // Обработка ситуации, когда голоса еще не загружены
      setTimeout(() => this.synth.getVoices(), 100);
      return null;
    }
    
    const langCode = this.language.split('-')[0];
    
    debugLog(`Поиск голоса для языка: ${this.language} (код: ${langCode})`);
    
    // Сначала ищем точное совпадение
    let voice = voices.find(v => v.lang === this.language);
    
    // Если не нашли, ищем по первой части кода языка
    if (!voice) {
      debugLog(`Точное совпадение не найдено, поиск по коду языка: ${langCode}`);
      voice = voices.find(v => v.lang.startsWith(langCode));
    }
    
    // Если ничего не нашли, возвращаем первый доступный голос
    if (!voice && voices.length > 0) {
      debugLog(`Подходящий голос не найден, используется первый доступный: ${voices[0].name}`);
      return voices[0];
    }
    
    if (voice) {
      debugLog(`Найден подходящий голос: ${voice.name}`);
    } else {
      debugLog("Подходящий голос не найден");
    }
    
    return voice;
  }
  
  speak(text) {
    return new Promise((resolve) => {
      // Если текст пустой, сразу разрешаем промис
      if (!text || text.trim() === '') {
        debugLog("Пустой текст для синтеза, пропускаем");
        resolve();
        return;
      }
      
      debugLog(`Синтез речи для текста: "${text.substring(0, 50)}..."`);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.language;
      
      // Попытка найти подходящий голос
      const voice = this.getVoice();
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.onend = () => {
        debugLog("Синтез речи завершен");
        this.currentSpeech = null;
        resolve();
      };
      
      utterance.onerror = (error) => {
        errorLog(`Ошибка синтеза речи: ${error.message || "Неизвестная ошибка"}`);
        this.currentSpeech = null;
        resolve();
      };
      
      // Сохраняем текущее высказывание
      this.currentSpeech = utterance;
      
      // Синтезируем речь асинхронно
      setTimeout(() => {
        try {
          this.synth.speak(utterance);
          debugLog("Начат синтез речи");
        } catch (error) {
          errorLog(`Ошибка при запуске синтеза речи: ${error.message}`);
          resolve();
        }
      }, 0);
    });
  }
  
  // Поочередное воспроизведение нескольких фрагментов текста
  async speakChunks(chunks) {
    debugLog(`Синтез речи для ${chunks.length} фрагментов текста`);
    for (const chunk of chunks) {
      await this.speak(chunk);
    }
  }
  
  stop() {
    if (this.synth.speaking) {
      debugLog("Остановка синтеза речи");
      try {
        this.synth.cancel();
        this.currentSpeech = null;
        debugLog("Синтез речи остановлен");
      } catch (error) {
        errorLog(`Ошибка при остановке синтеза речи: ${error.message}`);
      }
    } else {
      debugLog("Нет активного синтеза речи для остановки");
    }
  }
}

