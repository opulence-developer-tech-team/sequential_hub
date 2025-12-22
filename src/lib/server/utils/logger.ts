/**
 * Production-ready logging utility
 * In production, replace with proper logging service (Winston, Pino, etc.)
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private isProduction = process.env.NODE_ENV === "production";

  private formatMessage(entry: LogEntry): string {
    const { level, message, timestamp, metadata, error } = entry;
    let formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (metadata && Object.keys(metadata).length > 0) {
      formatted += ` | Metadata: ${JSON.stringify(metadata)}`;
    }

    if (error) {
      formatted += ` | Error: ${error.message}`;
      if (error.stack && this.isDevelopment) {
        formatted += `\n${error.stack}`;
      }
    }

    return formatted;
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata,
      error,
    };

    const formatted = this.formatMessage(entry);

    // In production, send to logging service (e.g., Sentry, DataDog, CloudWatch)
    // For now, use console with appropriate levels
    switch (level) {
      case "error":
        console.error(formatted);
        // In production, send to error tracking service
        if (this.isProduction && error) {
          // Example: Sentry.captureException(error, { extra: metadata });
        }
        break;
      case "warn":
        console.warn(formatted);
        break;
      case "info":
        if (this.isDevelopment) {
          console.info(formatted);
        }
        break;
      case "debug":
        if (this.isDevelopment) {
          console.debug(formatted);
        }
        break;
    }
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log("info", message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log("warn", message, metadata);
  }

  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log("error", message, metadata, error);
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log("debug", message, metadata);
  }
}

// Singleton instance
export const logger = new Logger();





















































