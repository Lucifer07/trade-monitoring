require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { config } = require('./config');
const { getDatabase } = require('./services/database');
const { getRedis } = require('./services/redis');
const { getBinance } = require('./services/binance');

const menuHandlers = require('./handlers/menu');
const pnlHandlers = require('./handlers/pnl');
const tradeHandlers = require('./handlers/trade');
const closeHandlers = require('./handlers/close');

// Initialize Telegram Bot
const bot = new TelegramBot(config.telegram.botToken, { polling: true });

// Store user sessions
const userSessions = new Map();

// Set bot menu commands
async function setBotMenu() {
  try {
    // Set bot commands with default scope (all private chats)
    await bot.setMyCommands(
      [
        { command: 'start', description: '🚀 Start the bot' },
        { command: 'menu', description: '📱 Show main menu' },
        { command: 'pnl', description: '💰 View profit/loss' },
        { command: 'active', description: '📊 View active trades' },
        { command: 'pending', description: '📌 Place limit order' },
        { command: 'market', description: '⚡ Place market order' },
        { command: 'help', description: '❓ Show help' },
    { command: 'close', description: '❌ Close position' },
        { command: 'close', description: '❌ Close position' },
      ]
    );
    console.log('✅ Bot menu commands set');
  } catch (error) {
    console.error('Error setting bot menu:', error.message);
  }
}

// Set bot menu button (hamburger menu) - Try different approaches
async function setBotMenuButton() {
  try {
    // Approach 1: Set menu button to commands
    try {
      await bot.setChatMenuButton({
        text: '📱 Menu',
        type: 'commands',
      });
      console.log('✅ Bot menu button set (type: commands)');
    } catch (err) {
      console.log('⚠️  Menu button type "commands" failed, trying webhook...');
      
      // Approach 2: Try with menu_button
      await bot.setChatMenuButton({
        text: '📱 Menu',
        type: 'web_app',
        url: 'https://t.me/' + (await bot.getMe()).username,
      });
      console.log('✅ Bot menu button set (type: web_app)');
    }
  } catch (error) {
    console.error('Error setting bot menu button:', error.message);
    // Continue anyway, bot will work without menu button
  }
}

// Alternative: Set commands with all scopes
async function setAllCommands() {
  try {
    // Set commands for all scopes
    const commands = [
      { command: 'start', description: '🚀 Start the bot' },
      { command: 'menu', description: '📱 Show main menu' },
      { command: 'pnl', description: '💰 View profit/loss' },
      { command: 'active', description: '📊 View active trades' },
      { command: 'pending', description: '📌 Place limit order' },
      { command: 'market', description: '⚡ Place market order' },
      { command: 'help', description: '❓ Show help' },
    ];

    // Set for all private chats
    await bot.setMyCommands(commands, { scope: { type: 'all_private_chats' } });
    console.log('✅ Bot commands set for all_private_chats');

    // Set for default scope
    await bot.setMyCommands(commands, { scope: { type: 'default' } });
    console.log('✅ Bot commands set for default scope');
  } catch (error) {
    console.error('Error setting all commands:', error.message);
  }
}

// Initialize services
async function initializeServices() {
  try {
    console.log('🚀 Initializing Trading Monitor Bot...');

    // Test database connection
    const db = getDatabase();
    await db.query('SELECT NOW()');
    console.log('✅ Database connected');

    // Test Redis connection
    const redis = getRedis();
    await redis.set('test', 'ok', 5);
    console.log('✅ Redis connected');

    // Test Binance connection
    const binance = getBinance();
    await binance.testConnection();
    console.log('✅ Binance API connected');

    // Set bot menu and button
    await setBotMenu();
    await setAllCommands();
    await setBotMenuButton();

    console.log('🎉 All services initialized successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error initializing services:', error);
    return false;
  }
}

// Handle /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  await menuHandlers.showMainMenu(bot, chatId);
});

// Handle /menu command
bot.onText(/\/menu/, async (msg) => {
  const chatId = msg.chat.id;
  await menuHandlers.showMainMenu(bot, chatId);
});

// Handle /help command
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  const message = `
📚 *Help & Commands*

━━━━━━━━━━━━━━━━━━━━

*Menu Commands:*
/start - Start bot and show main menu
/menu - Show main menu
/help - Show this help message

*Trading Commands:*
/pnl [timeRange] - View profit/loss
  • timeRange: today, week, month, all
  • Example: /pnl today

/active - View active trades and positions

/pending SYMBOL SIDE QTY PRICE - Place limit order
  • Example: /pending BTCUSDT LONG 0.001 65000

/market SYMBOL SIDE QTY - Place market order
  • Example: /market BTCUSDT LONG 0.001

━━━━━━━━━━━━━━━━━━━━

*Tips:*
• Use burger menu button for quick access
• Click inline buttons for easy navigation
• All trades are saved to database

━━━━━━━━━━━━━━━━━━━━

*Powered by Sebas Butler* 🤵
  `.trim();

  await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// Handle /pnl command
bot.onText(/\/pnl(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const timeRange = match[1]?.toLowerCase() || 'all';
  
  const validRanges = ['today', 'week', 'month', 'all'];
  if (!validRanges.includes(timeRange)) {
    await bot.sendMessage(chatId, 
      '❌ Invalid time range. Use: /pnl [today|week|month|all]', 
      { parse_mode: 'Markdown' }
    );
    return;
  }

  await pnlHandlers.handleGetPnL(bot, chatId, timeRange);
});

// Handle /active command
bot.onText(/\/active/, async (msg) => {
  const chatId = msg.chat.id;
  await pnlHandlers.handleGetActiveTrades(bot, chatId);
});

// Handle /pending command
bot.onText(/\/pending\s+(.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const args = match[1].trim().split(/\s+/);
  await tradeHandlers.processPendingOrder(bot, chatId, args);
});

// Handle /market command
bot.onText(/\/market\s+(.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const args = match[1].trim().split(/\s+/);
  await tradeHandlers.processMarketOrder(bot, chatId, args);
});

// Handle callback queries (inline buttons)
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  try {
    // Acknowledge callback
    await bot.answerCallbackQuery(query.id);

    switch (data) {
      // Main menu
      case 'main_menu':
        await menuHandlers.showMainMenu(bot, chatId);
        break;

      // P&L
      case 'get_pnl':
        await menuHandlers.showPnLMenu(bot, chatId);
        break;
      case 'pnl_today':
        await pnlHandlers.handleGetPnL(bot, chatId, 'today');
        break;
      case 'pnl_week':
        await pnlHandlers.handleGetPnL(bot, chatId, 'week');
        break;
      case 'pnl_month':
        await pnlHandlers.handleGetPnL(bot, chatId, 'month');
        break;
      case 'pnl_all':
        await pnlHandlers.handleGetPnL(bot, chatId, 'all');
        break;

      // Active trades
      case 'get_active_trades':
        await pnlHandlers.handleGetActiveTrades(bot, chatId);
        break;

      // Manual trade menu
      case 'manual_trade_menu':
        await menuHandlers.showManualTradeMenu(bot, chatId);
        break;
      case 'manual_pending':
        await tradeHandlers.handleManualPendingOrder(bot, chatId);
        break;
      case 'manual_market':
        await tradeHandlers.handleManualMarketOrder(bot, chatId);
        break;

      // Close position
      case 'close_position':
        await closeHandlers.handleGetActivePositions(bot, chatId);
        break;

      // Refresh
      case 'refresh_menu':
        await bot.sendMessage(chatId, '🔄 Refreshing...', { ...menuHandlers.getMainMenuKeyboard() });
        await menuHandlers.showMainMenu(bot, chatId);
        break;

      default:
        await bot.sendMessage(chatId, '❓ Unknown action');
        break;
    }
  } catch (error) {
    console.error('Error handling callback query:', error);
    await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
  }
});

// Handle errors
bot.on('polling_error', (error) => {
  console.error(`[polling_error] ${error.code}: ${error.message}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down bot...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down bot...');
  bot.stopPolling();
  process.exit(0);
});

// Start bot
async function startBot() {
  const initialized = await initializeServices();
  
  if (!initialized) {
    console.error('❌ Failed to initialize services. Exiting...');
    process.exit(1);
  }

  console.log('🤖 Trading Monitor Bot is running...');
  console.log(`📱 Bot started for chat ID: ${config.telegram.chatId}`);
  
  // Get bot info
  try {
    const botInfo = await bot.getMe();
    console.log(`🤖 Bot username: @${botInfo.username}`);
  } catch (error) {
    console.error('Error getting bot info:', error.message);
  }
  
  // Send welcome message to configured chat ID
  try {
    await bot.sendMessage(
      config.telegram.chatId,
      '🚀 *Trading Monitor Bot Started!*\n\n✅ All systems operational\n\n📱 Use /menu to access all features.\n📋 Commands available via burger menu button!\n\nPowered by Sebas Butler 🤵',
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error sending welcome message:', error.message);
  }
}

// Start application
startBot().catch(console.error);

module.exports = { bot };
