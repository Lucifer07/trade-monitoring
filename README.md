# Trading Monitor Bot 🤖

Telegram bot untuk monitoring dan manual trading pada Binance Futures.

## Fitur

### 1. 💰 Get P&L
Melihat profit/loss dengan berbagai periode:
- Today
- This Week
- This Month
- All Time

### 2. 📊 Active Trades
Melihat semua trade aktif dan posisi terbuka:
- Database trades
- Binance positions

### 3. 📝 Manual Trade

#### 3.a Pending Order (Limit Order)
Format: `/pending SYMBOL SIDE QUANTITY PRICE`

Contoh:
```
/pending BTCUSDT LONG 0.001 65000
```

#### 3.b Market Order
Format: `/market SYMBOL SIDE QUANTITY`

Contoh:
```
/market BTCUSDT LONG 0.001
```

## Cara Penggunaan

### Commands
- `/start` - Memulai bot dan menampilkan menu utama
- `/menu` - Menampilkan menu utama
- `/pnl [today|week|month|all]` - Melihat P&L
- `/active` - Melihat trade aktif
- `/pending SYMBOL SIDE QUANTITY PRICE` - Menempatkan limit order
- `/market SYMBOL SIDE QUANTITY` - Menempatkan market order

### Inline Buttons
- 💰 Get P&L - Buka menu P&L
- 📊 Active Trades - Lihat posisi aktif
- 📝 Manual Trade - Buka menu manual trading
- 🔄 Refresh - Refresh menu

## Instalasi

```bash
cd /root/trading-monitor-bot
npm install
```

## Konfigurasi

Edit file `.env`:

```env
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=trading_db
POSTGRES_USER=trading
POSTGRES_PASSWORD=trading_secure_pass

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

BINANCE_FUTURES_BASE_URL=https://testnet.binancefuture.com
BINANCE_FUTURES_API_KEY=your_api_key
BINANCE_FUTURES_SECRET_KEY=your_secret_key
```

## Menjalankan dengan PM2

```bash
# Start
pm2 start src/index.js --name "trading-monitor-bot"

# Stop
pm2 stop trading-monitor-bot

# Restart
pm2 restart trading-monitor-bot

# Logs
pm2 logs trading-monitor-bot

# Status
pm2 status
```

## Struktur Project

```
trading-monitor-bot/
├── src/
│   ├── handlers/
│   │   ├── menu.js      - Handler untuk menu
│   │   ├── pnl.js       - Handler untuk P&L
│   │   └── trade.js     - Handler untuk manual trading
│   ├── services/
│   │   ├── database.js  - Koneksi ke PostgreSQL
│   │   ├── redis.js     - Koneksi ke Redis
│   │   └── binance.js   - Koneksi ke Binance API
│   ├── config.js        - Konfigurasi aplikasi
│   └── index.js         - Entry point
├── .env                 - Environment variables
├── package.json         - Dependencies
└── README.md           - Dokumentasi
```

## Dependencies

- node-telegram-bot-api - Telegram Bot API
- pg - PostgreSQL client
- ioredis - Redis client
- binance-api-node - Binance API
- dotenv - Environment variables

## Security

⚠️ **PENTING:**
- Jangan share file `.env` atau API keys
- Gunakan testnet untuk testing
- Pastikan permission file `.env` sudah restrict

## Catatan

- Bot menggunakan database dan Redis yang sama dengan hyperliquid-trader
- Semua trade akan tersimpan di database
- Bot terhubung ke Binance Testnet secara default

## Troubleshooting

### Bot tidak merespon
```bash
pm2 restart trading-monitor-bot
pm2 logs trading-monitor-bot
```

### Koneksi gagal
- Cek konfigurasi di `.env`
- Pastikan database dan Redis berjalan
- Cek API keys Binance

## Dibuat oleh

Sebas Butler 🤵

Powered by OpenClaw
