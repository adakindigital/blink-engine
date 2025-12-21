// =============================================================================
// Blink Engine - Logger
// =============================================================================
// Structured logging with Winston - no sensitive data

import winston from 'winston';
import { config } from '../config/index.js';

// Custom format for pretty printing in development
const prettyFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
        const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
        const corrId = correlationId ? `[${correlationId}] ` : '';
        return `${timestamp} ${level}: ${corrId}${message}${metaStr}`;
    })
);

// JSON format for production
const jsonFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
    level: config.logging.level,
    format: config.logging.format === 'pretty' ? prettyFormat : jsonFormat,
    defaultMeta: { service: 'blink-engine' },
    transports: [new winston.transports.Console()],
});

// Child logger with correlation ID
export const createContextLogger = (correlationId: string) => {
    return logger.child({ correlationId });
};

// Sensitive data patterns to redact
const SENSITIVE_PATTERNS = [
    /password/i,
    /token/i,
    /secret/i,
    /authorization/i,
    /cookie/i,
    /apikey/i,
    /api_key/i,
];

// Redact sensitive data from objects
export const redactSensitive = (obj: Record<string, unknown>): Record<string, unknown> => {
    const redacted: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
        const isSensitive = SENSITIVE_PATTERNS.some((pattern) => pattern.test(key));

        if (isSensitive) {
            redacted[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
            redacted[key] = redactSensitive(value as Record<string, unknown>);
        } else {
            redacted[key] = value;
        }
    }

    return redacted;
};

// Type-safe logging helpers
export const logInfo = (message: string, meta?: Record<string, unknown>) => {
    logger.info(message, meta ? redactSensitive(meta) : undefined);
};

export const logError = (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
    const errorMeta = error instanceof Error ? { error: error.message, stack: error.stack } : { error };
    logger.error(message, { ...errorMeta, ...(meta ? redactSensitive(meta) : {}) });
};

export const logWarn = (message: string, meta?: Record<string, unknown>) => {
    logger.warn(message, meta ? redactSensitive(meta) : undefined);
};

export const logDebug = (message: string, meta?: Record<string, unknown>) => {
    logger.debug(message, meta ? redactSensitive(meta) : undefined);
};
