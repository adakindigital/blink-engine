// =============================================================================
// Blink Engine - Configuration
// =============================================================================
// Centralized configuration management with validation

import { z } from 'zod';

// Environment schema validation
const envSchema = z.object({
    // Server
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    HOST: z.string().default('0.0.0.0'),

    // Database
    DATABASE_URL: z.string().min(1),

    // Authentication
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

    // Rate Limiting
    REDIS_URL: z.string().optional(),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
    RATE_LIMIT_AUTH_MAX_REQUESTS: z.coerce.number().default(5),

    // CORS
    CORS_ORIGINS: z.string().default('*'),

    // Logging
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),

    // Security
    BCRYPT_ROUNDS: z.coerce.number().min(10).max(14).default(12),
});

// Parse and validate environment variables
const parseEnv = () => {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
        console.error('❌ Invalid environment variables:');
        console.error(parsed.error.flatten().fieldErrors);
        throw new Error('Invalid environment configuration');
    }

    return parsed.data;
};

// Lazy-loaded config singleton
let _config: ReturnType<typeof parseEnv> | null = null;

export const getConfig = () => {
    if (!_config) {
        _config = parseEnv();
    }
    return _config;
};

// Typed config object for direct access
export const config = {
    get env() {
        return getConfig().NODE_ENV;
    },
    get isDev() {
        return getConfig().NODE_ENV === 'development';
    },
    get isProd() {
        return getConfig().NODE_ENV === 'production';
    },
    get isTest() {
        return getConfig().NODE_ENV === 'test';
    },

    server: {
        get port() {
            return getConfig().PORT;
        },
        get host() {
            return getConfig().HOST;
        },
    },

    database: {
        get url() {
            return getConfig().DATABASE_URL;
        },
    },

    jwt: {
        get accessSecret() {
            return getConfig().JWT_ACCESS_SECRET;
        },
        get refreshSecret() {
            return getConfig().JWT_REFRESH_SECRET;
        },
        get accessExpiresIn() {
            return getConfig().JWT_ACCESS_EXPIRES_IN;
        },
        get refreshExpiresIn() {
            return getConfig().JWT_REFRESH_EXPIRES_IN;
        },
    },

    rateLimit: {
        get redisUrl() {
            return getConfig().REDIS_URL;
        },
        get windowMs() {
            return getConfig().RATE_LIMIT_WINDOW_MS;
        },
        get maxRequests() {
            return getConfig().RATE_LIMIT_MAX_REQUESTS;
        },
        get authMaxRequests() {
            return getConfig().RATE_LIMIT_AUTH_MAX_REQUESTS;
        },
    },

    cors: {
        get origins() {
            const origins = getConfig().CORS_ORIGINS;
            return origins === '*' ? '*' : origins.split(',').map((o) => o.trim());
        },
    },

    logging: {
        get level() {
            return getConfig().LOG_LEVEL;
        },
        get format() {
            return getConfig().LOG_FORMAT;
        },
    },

    security: {
        get bcryptRounds() {
            return getConfig().BCRYPT_ROUNDS;
        },
    },
};

export type Config = typeof config;
