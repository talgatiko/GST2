/**
 * Главный класс бота
 */
class VoiceBot {
  constructor() {
    debugLog("Создание экземпляра голосового бота...");
    
    try {
      this.logger = new Logger();
      this.logger.log('Инициализация компонентов голосового бота...', 'info');
      
      this.settings = new Settings();
      this.logger.log('Настройки инициализированы', 'info');
      
      try {
        this.recognizer = new SpeechRecognizer();
        this.logger.log('Распознаватель речи инициализирован', 'info');
      } catch (error) {
        this.logger.log(`Ошибка инициализации распознавателя речи: ${error.message}`, 'error');
        this.recognizer = null;
      }
      
      try {
        this.synthesizer = new SpeechSynthesizer();
        this.logger.log('Синтезатор речи инициализирован', 'info');
      } catch (error) {
        this.logger.log(`Ошибка инициализации синтезатора речи: ${error.message}`, 'error');
        this.synthesizer = null;
      }
      
      // Передаем параметры при создании AIClient
      this.aiClient = new AIClient(
        this.settings.apiUrl,
        this.settings.apiKey,
        this.settings.model,
        this.settings.temperature,
        this.settings.max_tokens
      );
      this.logger.log('AI клиент инициализирован', 'info');
      
      this.isActive = false;
      this.microphoneInitialized = false;
      
      // Добавляем текущий этап разговора
      this.currentStage = 1; // Начальный этап по умолчанию
      
      // Добавляем таймер для периодического произношения фраз
      this.waitingPhrasesTimer = null;
      this.isWaiting = false;
      this.lastActivityTime = Date.now();
      
      this.logger.log('Компоненты системы успешно созданы', 'info');
    } catch (error) {
      this.displayError(`Ошибка при создании компонентов бота: ${error.message}`);
    }
    
    // Буфер для накопления текста при потоковой обработке
    this.currentStreamText = '';
    this.lastSpeakPromise = Promise.resolve();
    
    // Элементы UI
    this.statusElement = document.getElementById('status-text');
    this.statusIndicator = document.getElementById('status-indicator');
    this.toggleButton = document.getElementById('toggle-bot');
    
    debugLog("Экземпляр голосового бота создан");
  }
  
  // Метод для запуска таймера периодического произношения
  startWaitingPhrases() {
    debugLog("Запуск таймера периодического произношения фраз...");
    if (this.waitingPhrasesTimer) {
      clearInterval(this.waitingPhrasesTimer);
    }
    
    this.isWaiting = true;
    this.lastActivityTime = Date.now();
    
    this.waitingPhrasesTimer = setInterval(() => {
      // Проверяем, прошло ли достаточно времени с последней активности
      const inactiveTime = Date.now() - this.lastActivityTime;
      
      if (this.isWaiting && this.isActive && inactiveTime >= this.settings.waitingInterval) {
        // Выбираем случайную фразу из списка
        const randomIndex = Math.floor(Math.random() * this.settings.waitingPhrases.length);
        const phrase = this.settings.waitingPhrases[randomIndex];
        
        this.logger.log(`Произношение периодической фразы: ${phrase}`, 'info');
        
        // Временно приостанавливаем распознавание, чтобы не слышать себя
        if (this.recognizer) {
          this.recognizer.stop();
        }
        
        // Произносим фразу и затем возобновляем распознавание
        this.synthesizer.speak(phrase).then(() => {
          if (this.isActive && this.recognizer) {
            setTimeout(() => {
              this.recognizer.start();
            }, 300);
          }
        });
        
        // Обновляем время последней активности
        this.lastActivityTime = Date.now();
      }
    }, 5000); // Проверяем каждые 5 секунд
    
    debugLog("Таймер периодических фраз запущен");
  }
  
  stopWaitingPhrases() {
    debugLog("Остановка таймера периодических фраз...");
    if (this.waitingPhrasesTimer) {
      clearInterval(this.waitingPhrasesTimer);
      this.waitingPhrasesTimer = null;
    }
    this.isWaiting = false;
    debugLog("Таймер периодических фраз остановлен");
  }
  
  async initialize() {
    this.logger.log('Начало инициализации системы...', 'info');
    debugLog("Инициализация голосового бота...");
    
    try {
      // Загрузка настроек
      debugLog("Загрузка настроек...");
      this.settings.load();
      this.logger.log('Настройки загружены', 'info');
      
      // Настраиваем API клиент
      debugLog("Настройка API клиента...");
      // Передаем параметры при настройке AIClient
      this.aiClient.setApiParams(
        this.settings.apiUrl,
        this.settings.apiKey,
        this.settings.model,
        this.settings.temperature,
        this.settings.max_tokens
      );
      this.logger.log('API клиент настроен', 'info');
      
      // Проверка поддержки потокового API
      if (this.settings.useStreaming) {
        debugLog("Проверка поддержки потокового API...");
        const streamingSupported = await this.aiClient.detectStreamingSupport();
        this.logger.log(`Поддержка потоковой обработки: ${streamingSupported ? 'Да' : 'Нет'}`, 'info');
      }
      
      // Инициализация микрофона (запрос разрешения)
      debugLog("Инициализация микрофона...");
      try {
        if (this.recognizer) {
          this.logger.log('Запрос разрешения на использование микрофона...', 'info');
          await this.recognizer.initialize();
          this.microphoneInitialized = true;
          this.logger.log('Микрофон успешно инициализирован', 'info');
          
          // Настройка распознавателя речи
          debugLog("Настройка обработчиков распознавателя речи...");
          this.recognizer.setLanguage(this.settings.language);
          this.recognizer.onResult((text) => this.processVoiceInput(text));
          this.recognizer.onError((error) => {
            this.handleRecognitionError(error);
          });
          this.logger.log('Распознаватель речи настроен', 'info');
        } else {
          this.logger.log('Распознаватель речи недоступен', 'error');
        }
      } catch (error) {
        this.microphoneInitialized = false;
        this.displayError(`Ошибка инициализации микрофона: ${error.message}`);
      }
      
      // Настройка синтезатора речи
      if (this.synthesizer) {
        debugLog("Настройка синтезатора речи...");
        this.synthesizer.setLanguage(this.settings.language);
        this.logger.log('Синтезатор речи настроен', 'info');
      } else {
        this.logger.log('Синтезатор речи недоступен', 'error');
      }
      
      this.logger.log('Система инициализирована и готова к работе', 'info');
      this.updateStatus('Готов к запуску');
      debugLog("Инициализация голосового бота завершена успешно");
    } catch (error) {
      this.displayError(`Ошибка при инициализации бота: ${error.message}`);
    }
  }
  
  // Отображение ошибки в UI
  displayError(message) {
    this.logger.log(`Ошибка: ${message}`, 'error');
    this.updateStatus(`Ошибка - ${message}`);
  }
  
  // Улучшенная обработка ошибок распознавания
  handleRecognitionError(error) {
    if (error === 'no-speech') {
      // Для ошибки отсутствия речи просто делаем запись, без аварийных сообщений
      // Распознаватель перезапустится автоматически
      this.logger.log('Не обнаружена речь, продолжаю слушать...', 'info');
    } else {
      this.displayError(`Ошибка распознавания: ${error}`);
    }
  }
  
  // Улучшенный метод определения этапа
  determineStage(text) {
    debugLog(`Определение этапа разговора для текста: "${text.substring(0, 50)}..."`);
    const lowerText = text.toLowerCase();
    let matchedStages = [];
    
    // Собираем все этапы, ключевые слова которых встречаются в тексте
    for (const stage of this.settings.conversationStages) {
      for (const keyword of stage.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          debugLog(`Найдено ключевое слово "${keyword}" для этапа ${stage.stage_number}`);
          matchedStages.push(stage);
          break; // Нашли совпадение для этого этапа, переходим к следующему
        }
      }
    }
    
    if (matchedStages.length > 0) {
      // Выбираем этап с наибольшим номером среди совпавших
      // Это даст приоритет более поздним этапам разговора
      matchedStages.sort((a, b) => b.stage_number - a.stage_number);
      debugLog(`Выбран этап ${matchedStages[0].stage_number} с наивысшим приоритетом`);
      return matchedStages[0];
    }
    
    // Если не найдено совпадений, возвращаем текущий этап
    const currentStageObj = this.settings.conversationStages.find(
      stage => stage.stage_number === this.currentStage
    ) || this.settings.conversationStages[0];
    
    debugLog(`Нет совпадений ключевых слов, остаемся на текущем этапе ${this.currentStage}`);
    return currentStageObj;
  }
  
  async start() {
    debugLog("Запуск голосового бота...");
    if (!this.microphoneInitialized) {
      this.logger.log('Пытаемся инициализировать микрофон...', 'info');
      try {
        await this.recognizer.initialize();
        this.microphoneInitialized = true;
        this.logger.log('Микрофон успешно инициализирован', 'info');
      } catch (error) {
        this.displayError(`Невозможно запустить бота: ${error.message}`);
        return;
      }
    }
    
    if (!this.recognizer || !this.synthesizer) {
      this.displayError('Невозможно запустить бота: API речи не поддерживаются');
      return;
    }
    
    this.isActive = true;
    
    // Сбрасываем этап разговора на начальный при каждом запуске
    this.currentStage = 1;
    this.logger.log(`Установлен начальный этап разговора: ${this.currentStage}`, 'info');
    
    // Запуск таймера периодических фраз
    this.startWaitingPhrases();
    
    // Воспроизведение приветствия при запуске
    debugLog("Воспроизведение приветствия...");
    await this.speakGreeting();
    
    // Начинаем прослушивание
    debugLog("Запуск прослушивания...");
    this.recognizer.start();
    this.logger.log('Голосовой бот активирован', 'info');
    this.updateStatus('Активен - Прослушивание...');
    
    // Обновление UI
    if (this.toggleButton) {
      this.toggleButton.textContent = 'Остановить бота';
      this.toggleButton.classList.add('active');
    }
    
    if (this.statusIndicator) {
      this.statusIndicator.classList.add('active');
    }
    
    debugLog("Голосовой бот успешно запущен");
  }
  
  stop() {
    debugLog("Остановка голосового бота...");
    this.isActive = false;
    
    // Останавливаем таймер периодических фраз
    this.stopWaitingPhrases();
    
    if (this.recognizer) {
      this.recognizer.stop();
    }
    
    if (this.synthesizer) {
      this.synthesizer.stop();
    }
    
    this.logger.log('Голосовой бот деактивирован', 'info');
    this.updateStatus('Остановлен');
    
    // Обновление UI
    if (this.toggleButton) {
      this.toggleButton.textContent = 'Запустить бота';
      this.toggleButton.classList.remove('active');
    }
    
    if (this.statusIndicator) {
      this.statusIndicator.classList.remove('active');
    }
    
    debugLog("Голосовой бот остановлен");
  }
  
  updateStatus(statusText) {
    debugLog(`Обновление статуса: ${statusText}`);
    if (this.statusElement) {
      this.statusElement.textContent = `Статус: ${statusText}`;
    }
  }
  
  // Воспроизведение приветственного сообщения
  async speakGreeting() {
    if (this.settings.greetingText && this.synthesizer) {
      this.logger.log(`Воспроизведение приветствия: ${this.settings.greetingText}`, 'info');
      await this.synthesizer.speak(this.settings.greetingText);
    } else {
      debugLog("Пропуск приветствия (пустой текст или нет синтезатора)");
    }
  }
  
  async processVoiceInput(text) {
    // Обновляем время последней активности
    this.lastActivityTime = Date.now();
    
    // Приостанавливаем ожидающие фразы (чтобы не прерывать разговор)
    this.isWaiting = false;
    
    this.logger.log(`Распознанный текст: ${text}`, 'input');
    this.updateStatus('Обработка запроса...');
    
    try {
      if (!this.settings.apiKey) {
        throw new Error('API ключ не настроен. Пожалуйста, укажите API ключ в настройках.');
      }
      
      // Останавливаем распознавание на время обработки запроса
      if (this.recognizer) {
        this.recognizer.stop();
      }
      
      // Проверяем специальную команду для перехода между этапами
      if (text.toLowerCase().includes("переход") && text.toLowerCase().includes("этап")) {
        // Извлекаем номер этапа из текста (например, "переход на этап 3")
        const match = text.match(/этап\s+(\d)/i);
        if (match && match[1]) {
          const requestedStage = parseInt(match[1]);
          if (requestedStage >= 1 && requestedStage <= 5) {
            const stageObj = this.settings.conversationStages.find(s => s.stage_number === requestedStage);
            if (stageObj) {
              this.currentStage = requestedStage;
              this.logger.log(`Принудительный переход на этап ${requestedStage}: ${stageObj.transition_text}`, 'info');
              await this.synthesizer.speak(stageObj.transition_text);
              
              // Возобновляем ожидающие фразы и распознавание
              this.isWaiting = true;
              
              if (this.isActive && this.recognizer) {
                this.updateStatus('Активен - Прослушивание...');
                this.recognizer.start();
              }
              return;
            }
          }
        }
      }
      
      // Определяем этап разговора на основе распознанного текста
      const detectedStage = this.determineStage(text);
      const previousStage = this.currentStage;
      
      // Если этап изменился, показываем переходный текст
      if (detectedStage.stage_number !== previousStage) {
        this.currentStage = detectedStage.stage_number;
        this.logger.log(`Переход на этап ${this.currentStage}: ${detectedStage.transition_text}`, 'info');
        
        // Воспроизводим переходный текст
        await this.synthesizer.speak(detectedStage.transition_text);
      }
      
      // Сбрасываем буфер текущего потокового текста
      this.currentStreamText = '';
      
      // Получаем текущий этап для формирования промпта
      const currentStageObj = this.settings.conversationStages.find(
        stage => stage.stage_number === this.currentStage
      );
      
      // Используем промпт текущего этапа или стандартный промпт, если этап не найден
      const systemPrompt = currentStageObj ? currentStageObj.speech_prompt : this.settings.systemPrompt;
      
      this.logger.log(`Используем промпт этапа ${this.currentStage}: ${systemPrompt}`, 'info');
      
      // Выбираем способ отправки запроса в зависимости от поддержки потоковой обработки
      let response;
      
      if (this.settings.useStreaming && this.aiClient.supportStreaming) {
        this.logger.log('Отправка потокового запроса к API...', 'info');
        
        // Используем потоковый запрос с промптом текущего этапа
        response = await this.aiClient.sendStreamingRequest(
          text, 
          systemPrompt,
          (chunk, fullText) => this.handleStreamingChunk(chunk, fullText),
          this.logger
        );
        
        // Потоковый ответ уже обработан через колбэк
      } else {
        // Используем обычный запрос с промптом текущего этапа
        this.logger.log('Отправка запроса к API...', 'info');
        response = await this.aiClient.sendRequest(
          text, 
          systemPrompt,
          this.logger
        );
        
        // Обработка полного ответа
        await this.handleAIResponse(response);
      }
      
      // Возобновляем ожидающие фразы
      this.isWaiting = true;
      
    } catch (error) {
      this.logger.log(`Ошибка: ${error.message}`, 'error');
      this.updateStatus('Ошибка - перезапуск прослушивания...');
      
      // Возобновляем ожидающие фразы
      this.isWaiting = true;
      
      // Возобновляем прослушивание после ошибки
      if (this.isActive && this.recognizer) {
        setTimeout(() => this.recognizer.start(), 1000);
      }
    }
  }
  
  // Обработка фрагмента потокового ответа
  async handleStreamingChunk(chunk, fullText) {
    this.logger.log(`Получен фрагмент: ${chunk}`, 'output');
    
    // Сохраняем последний промис, чтобы знать, когда завершилось последнее воспроизведение
    this.lastSpeakPromise = this.lastSpeakPromise.then(() => {
      return this.synthesizer.speak(chunk);
    });
    
    // Если это последний фрагмент, нужно возобновить прослушивание
    if (chunk.includes('.') || chunk.includes('!') || chunk.includes('?')) {
      this.lastSpeakPromise.then(() => {
        if (this.isActive && this.recognizer) {
          this.updateStatus('Активен - Прослушивание...');
          this.recognizer.start();
        }
      });
    }
  }
  
  async handleAIResponse(response) {
    this.logger.log(`Ответ AI: ${response}`, 'output');
    this.updateStatus('Воспроизведение ответа...');
    
    try {
      await this.synthesizer.speak(response);
      this.logger.log('Воспроизведение ответа завершено', 'info');
      
      // Возобновляем прослушивание после завершения воспроизведения
      if (this.isActive && this.recognizer) {
        this.updateStatus('Активен - Прослушивание...');
        this.recognizer.start();
      }
    } catch (error) {
      this.logger.log(`Ошибка воспроизведения: ${error.message}`, 'error');
      
      // Возобновляем прослушивание после ошибки
      if (this.isActive && this.recognizer) {
        this.updateStatus('Активен - Прослушивание...');
        this.recognizer.start();
      }
    }
  }
  
  updateSettings() {
    debugLog("Обновление настроек из UI...");
    const success = this.settings.updateFromUI();
    
    if (success) {
      this.settings.save();
      
      // Передаем параметры при обновлении настроек
      this.aiClient.setApiParams(
        this.settings.apiUrl,
        this.settings.apiKey,
        this.settings.model,
        this.settings.temperature,
        this.settings.max_tokens
      );
      
      // Обновляем проверку поддержки потоковой обработки
      if (this.settings.useStreaming) {
        this.aiClient.detectStreamingSupport().then(supported => {
          this.logger.log(`Поддержка потоковой обработки: ${supported ? 'Да' : 'Нет'}`, 'info');
        });
      }
      
      if (this.recognizer) {
        this.recognizer.setLanguage(this.settings.language);
      }
      
      if (this.synthesizer) {
        this.synthesizer.setLanguage(this.settings.language);
      }
      
      this.logger.log('Настройки успешно обновлены', 'info');
    } else {
      this.logger.log('Ошибка при обновлении настроек: неверный формат', 'error');
    }
    
    return success;
  }
  
  resetSettings() {
    debugLog("Сброс настроек...");
    this.settings.reset();
    this.logger.log('Настройки сброшены до значений по умолчанию', 'info');
  }
}
