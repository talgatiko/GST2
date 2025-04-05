/**
 * Класс для взаимодействия с API ИИ
 */
class AIClient {
  constructor(apiUrl = '', apiKey = '', model = 'gpt-3.5-turbo') {
    debugLog("Инициализация AI клиента...");
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.model = model;
    this.supportStreaming = false;
    debugLog("AI клиент создан успешно");
  }
  
  setApiParams(url, key, model) {
    debugLog(`Настройка параметров API: URL=${url}, модель=${model}`);
    this.apiUrl = url;
    this.apiKey = key;
    this.model = model || 'gpt-3.5-turbo';
  }
  
  // Определить поддержку потоковой передачи
  async detectStreamingSupport() {
    debugLog("Проверка поддержки потоковой передачи...");
    if (!this.apiUrl || !this.apiKey) {
      debugLog("API URL или ключ не настроены, потоковая передача отключена");
      this.supportStreaming = false;
      return false;
    }
    
    if (!this.apiUrl.startsWith('http://') && !this.apiUrl.startsWith('https://')) {
      debugLog("API URL не является валидным (отсутствует http/https), потоковая передача отключена");
      this.supportStreaming = false;
      return false;
    }
    
    try {
      // Проверка на поддержку fetch API с потоками
      if (!window.ReadableStream || !window.Response || !Response.prototype.body) {
        debugLog("Браузер не поддерживает ReadableStream, потоковая передача отключена");
        this.supportStreaming = false;
        return false;
      }
      
      // Проверяем, использует ли URL OpenAI API (они точно поддерживают streaming)
      if (this.apiUrl.includes('api.openai.com')) {
        debugLog("Обнаружен API OpenAI, потоковая передача включена");
        this.supportStreaming = true;
        return true;
      }
      
      // Для других API можно сделать тестовый запрос
      // Но во избежание лишних запросов, просто предполагаем поддержку
      debugLog("Предполагаем поддержку потоковой передачи для стороннего API");
      this.supportStreaming = true;
      return true;
    } catch (error) {
      errorLog(`Ошибка при определении поддержки потоковой передачи: ${error.message}`);
      this.supportStreaming = false;
      return false;
    }
  }
  
  // Обычный запрос
  async sendRequest(text, systemPrompt, logger) {
    debugLog("Отправка стандартного запроса к API...");
    const requestBody = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature: 0.7
    };
    
    if (logger) {
      logger.log(`Запрос API: ${JSON.stringify(requestBody)}`, 'info');
    }
    
    try {
      debugLog("Выполнение запроса...");
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        const errorMsg = `API ответил с кодом: ${response.status}, ${errorText}`;
        errorLog(errorMsg);
        throw new Error(errorMsg);
      }
      
      debugLog("Запрос выполнен успешно, обработка ответа...");
      const data = await response.json();
      
      if (logger) {
        logger.log(`Полученный ответ API: ${JSON.stringify(data)}`, 'info');
      }
      
      const content = data.choices[0].message.content;
      debugLog(`Получен контент от API: ${content.substring(0, 50)}...`);
      return content;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
  
  // Потоковый запрос (для streaming API)
  async sendStreamingRequest(text, systemPrompt, onChunk, logger) {
    debugLog("Отправка потокового запроса к API...");
    const requestBody = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature: 0.7,
      stream: true
    };
    
    if (logger) {
      logger.log(`Запрос API (streaming): ${JSON.stringify(requestBody)}`, 'info');
    }
    
    try {
      debugLog("Выполнение потокового запроса...");
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        const errorMsg = `API ответил с кодом: ${response.status}, ${errorText}`;
        errorLog(errorMsg);
        throw new Error(errorMsg);
      }
      
      if (!response.body) {
        const errorMsg = 'ReadableStream не поддерживается в этом браузере';
        errorLog(errorMsg);
        throw new Error(errorMsg);
      }
      
      debugLog("Потоковый запрос запущен, начинаем чтение данных...");
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedResponse = '';
      
      // Чтение потоковых данных
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          debugLog("Чтение потока завершено");
          break;
        }
        
        // Декодируем полученные данные
        const chunk = decoder.decode(value, { stream: true });
        
        // Обрабатываем каждую строку из потока
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const jsonStr = line.substring(6); // Убираем 'data: '
              const json = JSON.parse(jsonStr);
              
              if (json.choices && json.choices[0].delta && json.choices[0].delta.content) {
                const contentChunk = json.choices[0].delta.content;
                accumulatedResponse += contentChunk;
                
                // Вызываем колбэк с новым фрагментом текста
                debugLog(`Получен фрагмент потока: ${contentChunk}`);
                onChunk(contentChunk, accumulatedResponse);
              }
            } catch (e) {
              errorLog(`Ошибка парсинга JSON: ${e.message}`);
              reader.cancel(`Ошибка парсинга JSON: ${e.message}`);
              return;
            }
          }
        }
      }
      
      debugLog(`Полный ответ получен, длина: ${accumulatedResponse.length}`);
      return accumulatedResponse;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
  
  handleError(error) {
    errorLog(`Ошибка при обращении к API: ${error.message}`);
    throw new Error(`Ошибка при обращении к API: ${error.message}`);
  }
}
