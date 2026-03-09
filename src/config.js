require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',

  // Telegram Bot
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
  },

  // Database
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT) || 5432,
    database: process.env.POSTGRES_DB || 'trading_db',
    user: process.env.POSTGRES_USER || 'trading',
    password: process.env.POSTGRES_PASSWORD || 'trading_secure_pass',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || null,
  },

  // Binance Futures
  binance: {
    baseUrl: process.env.BINANCE_FUTURES_BASE_URL || 'https://testnet.binancefuture.com',
    apiKey: process.env.BINANCE_FUTURES_API_KEY || '',
    secretKey: process.env.BINANCE_FUTURES_SECRET_KEY || '',
    testnet: process.env.BINANCE_FUTURES_BASE_URL?.includes('testnet') || true,
  },
};

module.exports = { config };
