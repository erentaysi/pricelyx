/**
 * Piinti Central Logger
 * 
 * Tüm uygulamanın loglama standartlarını belirler.
 * İleride Sentry, Datadog veya OpenTelemetry entegre edilmek istendiğinde
 * sadece bu dosyanın değiştirilmesi yeterli olacaktır.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    let ctxString = '';
    
    if (context) {
      try {
        ctxString = ` | Context: ${JSON.stringify(context)}`;
      } catch (e) {
        ctxString = ' | Context: [Circular or Invalid]';
      }
    }

    return `[${timestamp}] [${level.toUpperCase()}] ${message}${ctxString}`;
  }

  info(message: string, context?: LogContext) {
    console.info(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: any, context?: LogContext) {
    const errorDetails = error instanceof Error ? ` | Error: ${error.message} \nStack: ${error.stack}` : '';
    console.error(this.formatMessage('error', message, context) + errorDetails);
    
    // TODO: Sentry entegrasyonu buraya gelecek
    // Sentry.captureException(error, { extra: context });
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage('debug', message, context));
    }
  }
}

export const logger = new Logger();
