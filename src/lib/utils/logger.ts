/**
 * Environment-aware logger utility
 * 
 * In production, console.log statements are automatically removed by Next.js compiler.
 * This utility provides structured logging with levels and can be easily integrated
 * with error monitoring services like Sentry.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  context?: string;
  metadata?: Record<string, unknown>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, options?: LogOptions): string {
    const timestamp = new Date().toISOString();
    const context = options?.context ? `[${options.context}]` : '';
    return `${timestamp} ${level.toUpperCase()} ${context} ${message}`;
  }

  debug(message: string, options?: LogOptions): void {
    if (this.isDevelopment) {
      console.warn(this.formatMessage('debug', message, options), options?.metadata || '');
    }
  }

  info(message: string, options?: LogOptions): void {
    if (this.isDevelopment) {
      console.warn(this.formatMessage('info', message, options), options?.metadata || '');
    }
  }

  warn(message: string, options?: LogOptions): void {
    console.warn(this.formatMessage('warn', message, options), options?.metadata || '');
  }

  error(message: string, error?: Error | unknown, options?: LogOptions): void {
    console.error(
      this.formatMessage('error', message, options),
      error instanceof Error ? error.stack : error,
      options?.metadata || ''
    );

    // In production, this is where you'd send to error monitoring service
    // Example: Sentry.captureException(error, { contexts: { custom: options?.metadata } });
  }
}

export const logger = new Logger();

