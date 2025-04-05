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
    
