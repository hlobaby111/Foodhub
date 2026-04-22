/**
 * Production-safe logger utility
 * Replaces console.log/error throughout the application
 */

const isDevelopment = process.env.NODE_ENV === 'development';

class Logger {
  info(...args) {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  }

  warn(...args) {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  }

  error(...args) {
    // Always log errors, but in production send to error tracking service
    console.error('[ERROR]', ...args);
    
    // TODO: In production, send to Sentry or similar
    if (!isDevelopment) {
      // this.sendToErrorService(...args);
    }
  }

  debug(...args) {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  }

  // Specialized methods for common use cases
  apiError(endpoint, error) {
    this.error(`API Error at ${endpoint}:`, error?.message || error);
  }

  socketEvent(event, data) {
    if (isDevelopment) {
      console.log(`[SOCKET] ${event}:`, data);
    }
  }

  stateChange(component, oldValue, newValue) {
    if (isDevelopment) {
      console.log(`[STATE] ${component}:`, { old: oldValue, new: newValue });
    }
  }

  // Stub for future error tracking integration
  sendToErrorService(...args) {
    // TODO: Integrate with Sentry, LogRocket, or similar
    // Sentry.captureException(new Error(args.join(' ')));
  }
}

export default new Logger();
