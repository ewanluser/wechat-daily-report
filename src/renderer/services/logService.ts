export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  details?: any;
  source?: string;
}

class LogService {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // 最多保存1000条日志
  private listeners: Array<(logs: LogEntry[]) => void> = [];

  // 添加日志
  addLog(level: LogEntry['level'], message: string, details?: any, source?: string) {
    const log: LogEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
      source
    };

    this.logs.unshift(log); // 最新的日志在前面

    // 保持日志数量在限制内
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // 通知监听器
    this.notifyListeners();
  }

  // 获取所有日志
  getAllLogs(): LogEntry[] {
    return [...this.logs];
  }

  // 根据级别过滤日志
  getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // 根据关键词搜索日志
  searchLogs(keyword: string): LogEntry[] {
    const lowerKeyword = keyword.toLowerCase();
    return this.logs.filter(log => 
      log.message.toLowerCase().includes(lowerKeyword) ||
      (log.source && log.source.toLowerCase().includes(lowerKeyword)) ||
      (log.details && JSON.stringify(log.details).toLowerCase().includes(lowerKeyword))
    );
  }

  // 清空日志
  clearLogs() {
    this.logs = [];
    this.notifyListeners();
  }

  // 导出日志
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // 添加监听器
  addListener(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener);
  }

  // 移除监听器
  removeListener(listener: (logs: LogEntry[]) => void) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // 通知所有监听器
  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  // 便捷方法
  info(message: string, details?: any, source?: string) {
    this.addLog('info', message, details, source);
  }

  warn(message: string, details?: any, source?: string) {
    this.addLog('warn', message, details, source);
  }

  error(message: string, details?: any, source?: string) {
    this.addLog('error', message, details, source);
  }

  debug(message: string, details?: any, source?: string) {
    this.addLog('debug', message, details, source);
  }
}

export const logService = new LogService();

// 重写console方法以自动收集日志
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info
};

console.log = (...args) => {
  originalConsole.log(...args);
  logService.info(args.join(' '), args.length > 1 ? args : undefined, 'console');
};

console.warn = (...args) => {
  originalConsole.warn(...args);
  logService.warn(args.join(' '), args.length > 1 ? args : undefined, 'console');
};

console.error = (...args) => {
  originalConsole.error(...args);
  logService.error(args.join(' '), args.length > 1 ? args : undefined, 'console');
};

console.info = (...args) => {
  originalConsole.info(...args);
  logService.info(args.join(' '), args.length > 1 ? args : undefined, 'console');
}; 