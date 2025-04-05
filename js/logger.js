/**
 * Класс для логирования работы системы
 */
class Logger {
  constructor(logElementId = 'log-output') {
    debugLog("Инициализация логгера...");
    this.logElement = document.getElementById(logElementId);
    this.logHistory = [];
    debugLog("Логгер создан");
  }
  
  log(message, type = 'info') {
    const timestamp = new Date().toTimeString().split(' ')[0];
    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    
    console.log(logEntry);
    this.logHistory.push(logEntry);
    
    if (this.logElement) {
      this.logElement.value += logEntry + '\n';
      this.logElement.scrollTop = this.logElement.scrollHeight;
    }
    
    return logEntry;
  }
  
  clear() {
    this.logHistory = [];
    if (this.logElement) {
      this.logElement.value = '';
    }
  }
  
  exportLogs() {
    return this.logHistory.join('\n');
  }
}
