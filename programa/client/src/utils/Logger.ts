/**
 * @file Logger.ts
 * @description Utilidad de logging para el cliente.
 * Centraliza los logs para facilitar la integración futura con servicios como Sentry o LogRocket.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class LoggerService {
  private isProduction = process.env.NODE_ENV === 'production';

  private log(level: LogLevel, message: string, ...args: any[]) {
    if (this.isProduction && level === 'debug') return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'info':
        console.log(prefix, message, ...args);
        break;
      case 'warn':
        console.warn(prefix, message, ...args);
        break;
      case 'error':
        console.error(prefix, message, ...args);
        break;
      case 'debug':
        console.debug(prefix, message, ...args);
        break;
    }
  }

  public info(message: string, ...args: any[]) {
    this.log('info', message, ...args);
  }

  public warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args);
  }

  public error(message: string, error?: any, ...args: any[]) {
    this.log('error', message, error, ...args);
    
    // Hook para Sentry u otros servicios de monitoreo
    if (this.isProduction) {
      // TODO: Sentry.captureException(error);
    }
  }

  public debug(message: string, ...args: any[]) {
    this.log('debug', message, ...args);
  }
}

export const Logger = new LoggerService();
